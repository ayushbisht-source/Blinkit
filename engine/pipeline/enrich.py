"""Two-stage LLM enrichment: relevance gate, then structured extraction.

Why two stages. Roughly 60% of app-store reviews are about delivery times, rider conduct and
refunds — real complaints, but they say nothing about *what* people choose to buy. Running full
extraction over all of them would triple the cost and, worse, pad the denominator so every
prevalence number comes out artificially small. The gate is a cheap model answering one question;
extraction is the expensive model working only on what survives.

Resumable by design. Every batch is appended to disk immediately and completed doc_ids are skipped
on restart, so a rate limit at document 2,000 costs you a retry, not the run.

    python -m engine.pipeline.enrich
    python -m engine.pipeline.enrich --limit 200        # cheap trial run
    python -m engine.pipeline.enrich --stage relevance  # gate only
"""

from __future__ import annotations

import argparse
import json
import logging
import os
from pathlib import Path

from dotenv import load_dotenv

from engine.llm import LLMClient
from engine.schema import Document, Extraction

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")
log = logging.getLogger("enrich")

PROMPTS = Path("engine/prompts")
INTERIM = Path("data/interim")
DOCS = INTERIM / "documents.jsonl"
RELEVANCE = INTERIM / "relevance.jsonl"
EXTRACTIONS = INTERIM / "extractions.jsonl"

# Batch sizes are the main lever against a per-DAY request quota, because the cap counts requests,
# not tokens. Bigger batches mean fewer calls for identical work: at 20/batch the relevance gate
# needs ~169 calls for a 3.4k corpus; at 50 it needs ~68. Sized against output volume, not input —
# relevance emits one short JSON object per document, so 50 fits comfortably; extraction emits a
# large object per document, so it stays much smaller to avoid truncation mid-array.
RELEVANCE_BATCH = int(os.getenv("RELEVANCE_BATCH", "50"))
EXTRACTION_BATCH = int(os.getenv("EXTRACTION_BATCH", "15"))


def load_docs() -> list[Document]:
    if not DOCS.exists():
        raise SystemExit(f"{DOCS} not found — run `python -m engine.collect` first.")
    return [Document(**json.loads(line)) for line in DOCS.open()]


def done_ids(path: Path) -> set[str]:
    if not path.exists():
        return set()
    ids = set()
    for line in path.open():
        try:
            ids.add(json.loads(line)["doc_id"])
        except (json.JSONDecodeError, KeyError):
            continue
    return ids


def _render(docs: list[Document]) -> str:
    return "\n\n".join(
        f'<doc id="{d.doc_id}" rating="{d.rating}" lang="{d.lang}">\n{d.text}\n</doc>'
        for d in docs
    )


def _batches(items: list, size: int):
    for i in range(0, len(items), size):
        yield items[i : i + size]


class TooManyFailures(RuntimeError):
    """Raised when a stage is failing so consistently that continuing is pointless.

    Without this, a wrong model name or a dead key produces an empty output file and a green
    tick — the worst possible outcome, because it looks like the corpus had nothing in it.
    """


def _guard(stage: str, failures: int, total: int) -> None:
    if total >= 3 and failures / total > 0.5:
        raise TooManyFailures(
            f"{stage}: {failures}/{total} batches failed. This is a configuration problem "
            f"(model name, API key, or quota), not bad data. Fix it before re-running."
        )


def run_relevance(client: LLMClient, docs: list[Document]) -> None:
    system = (PROMPTS / "relevance.txt").read_text()
    pending = [d for d in docs if d.doc_id not in done_ids(RELEVANCE)]
    log.info("relevance: %d documents pending", len(pending))
    failures = 0

    with RELEVANCE.open("a") as out:
        for n, batch in enumerate(_batches(pending, RELEVANCE_BATCH), 1):
            try:
                # Scale with batch size: ~40 output tokens per document plus headroom. A budget
                # that silently truncates the JSON array loses the tail of the batch.
                result = client.structured(
                    system, _render(batch), tier="fast", max_tokens=len(batch) * 60 + 500
                )
            except Exception as exc:  # noqa: BLE001
                failures += 1
                log.warning("relevance batch %d failed: %s", n, exc)
                _guard("relevance", failures, n)
                continue

            got = {r.get("doc_id") for r in result if isinstance(r, dict)}
            for r in result:
                if isinstance(r, dict) and r.get("doc_id"):
                    out.write(json.dumps(r) + "\n")
            # A model that silently drops documents would quietly shrink the corpus; say so.
            missing = {d.doc_id for d in batch} - got
            if missing:
                log.warning("relevance batch %d: %d documents unreturned", n, len(missing))
            out.flush()

            if n % 10 == 0:
                log.info("relevance: %d batches done", n)


def run_extraction(client: LLMClient, docs: list[Document]) -> None:
    system = (PROMPTS / "extract.txt").read_text()

    relevant: set[str] = set()
    if RELEVANCE.exists():
        for line in RELEVANCE.open():
            r = json.loads(line)
            if r.get("is_relevant"):
                relevant.add(r["doc_id"])
    else:
        log.warning("no relevance file — extracting over the full corpus")
        relevant = {d.doc_id for d in docs}

    already = done_ids(EXTRACTIONS)
    pending = [d for d in docs if d.doc_id in relevant and d.doc_id not in already]
    log.info("extraction: %d relevant, %d pending", len(relevant), len(pending))
    failures = 0

    with EXTRACTIONS.open("a") as out:
        for n, batch in enumerate(_batches(pending, EXTRACTION_BATCH), 1):
            try:
                # Extraction emits a full structured object per document — budget generously,
                # since a truncated array silently drops the tail of the batch.
                result = client.structured(
                    system, _render(batch), tier="strong", max_tokens=len(batch) * 400 + 1000
                )
            except Exception as exc:  # noqa: BLE001
                failures += 1
                log.warning("extraction batch %d failed: %s", n, exc)
                _guard("extraction", failures, n)
                continue

            for r in result:
                if not isinstance(r, dict) or not r.get("doc_id"):
                    continue
                try:
                    # Validate against the schema here rather than downstream: a bad enum value
                    # caught now is a warning, caught during clustering it is a crash.
                    out.write(Extraction(**r).model_dump_json() + "\n")
                except Exception as exc:  # noqa: BLE001
                    log.warning("extraction: invalid record for %s: %s", r.get("doc_id"), exc)
            out.flush()

            if n % 10 == 0:
                log.info("extraction: %d batches done", n)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--stage", choices=["relevance", "extraction", "all"], default="all")
    ap.add_argument("--limit", type=int, default=0, help="cap documents, for trial runs")
    ap.add_argument("--selftest", action="store_true", help="one live call, then exit")
    ap.add_argument(
        "--list-models", action="store_true", help="print this key's Gemini model catalog, then exit"
    )
    args = ap.parse_args()

    if args.list_models:
        for line in LLMClient().list_gemini_models():
            log.info(line)
        return

    if args.selftest:
        LLMClient().selftest()
        return

    INTERIM.mkdir(parents=True, exist_ok=True)
    docs = load_docs()
    if args.limit:
        docs = docs[: args.limit]
    log.info("corpus: %d documents", len(docs))

    client = LLMClient()

    if args.stage in ("relevance", "all"):
        run_relevance(client, docs)
    if args.stage in ("extraction", "all"):
        run_extraction(client, docs)

    if EXTRACTIONS.exists():
        n = sum(1 for _ in EXTRACTIONS.open())
        log.info("extractions -> %s (%d records)", EXTRACTIONS, n)


if __name__ == "__main__":
    main()
