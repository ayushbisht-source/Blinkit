"""Step 1 of the pipeline: build the corpus.

    python -m engine.collect                 # all sources, default volumes
    python -m engine.collect --per-app 1200  # bigger Play Store pull
    python -m engine.collect --sources play_store,app_store

No ANTHROPIC_API_KEY needed — this step is pure collection. Run it first, while you sort out
model access.
"""

from __future__ import annotations

import argparse
import json
import logging
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv

from engine.collectors import app_store, play_store, reddit
from engine.pipeline.normalize import dedupe, normalize
from engine.schema import Document

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")
log = logging.getLogger("collect")

RAW = Path("data/raw")
INTERIM = Path("data/interim")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--per-app", type=int, default=800, help="Play Store reviews per app")
    ap.add_argument("--sources", default="play_store,app_store,reddit")
    ap.add_argument(
        "--append",
        action="store_true",
        help=(
            "Merge into the existing corpus instead of replacing it, then de-duplicate across "
            "both. Without this, collecting one source alone silently discards every document "
            "from the others — which is how a 3,372-document corpus becomes a 300-document one."
        ),
    )
    args = ap.parse_args()

    RAW.mkdir(parents=True, exist_ok=True)
    INTERIM.mkdir(parents=True, exist_ok=True)
    wanted = {s.strip() for s in args.sources.split(",")}
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S")

    raw: list[dict] = []
    if "play_store" in wanted:
        raw += play_store.collect(target_per_app=args.per_app)
    if "app_store" in wanted:
        raw += app_store.collect()
    if "reddit" in wanted:
        raw += reddit.collect()

    if not raw:
        log.error("No documents collected. Check network access and .env credentials.")
        raise SystemExit(1)

    # Immutable snapshot first — never re-pull to redo a downstream bug.
    snapshot = RAW / f"corpus_{stamp}.jsonl"
    with snapshot.open("w") as fh:
        for r in raw:
            fh.write(json.dumps(r, default=str) + "\n")
    log.info("raw snapshot -> %s (%d records)", snapshot, len(raw))

    docs = normalize(raw)
    out = INTERIM / "documents.jsonl"

    if args.append and out.exists():
        existing = [Document.model_validate_json(line) for line in out.read_text().splitlines() if line.strip()]
        log.info("append: %d existing + %d newly collected", len(existing), len(docs))
        docs = existing + docs

    # De-duplication runs across the merged set, so a document collected twice by two runs is
    # counted once — and so a Reddit post quoting an app-store review cannot inflate a theme twice.
    before = len(docs)
    docs = dedupe(docs)
    if before != len(docs):
        log.info("dedupe removed %d near-duplicates", before - len(docs))

    with out.open("w") as fh:
        for d in docs:
            fh.write(d.model_dump_json() + "\n")

    by_source: dict[str, int] = {}
    by_lang: dict[str, int] = {}
    for d in docs:
        by_source[d.source.value] = by_source.get(d.source.value, 0) + 1
        by_lang[d.lang] = by_lang.get(d.lang, 0) + 1

    log.info("corpus ready -> %s", out)
    log.info("  by source: %s", by_source)
    log.info("  by lang:   %s", by_lang)

    if len(docs) < 500:
        log.warning(
            "Corpus is small (%d). The saturation curve needs ~1500+ to plateau convincingly. "
            "Raise --per-app or add Reddit credentials.",
            len(docs),
        )


if __name__ == "__main__":
    main()
