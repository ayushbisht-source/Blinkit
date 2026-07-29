"""Raw collector output -> validated Documents, with PII stripped at the boundary.

Nothing downstream should ever see a raw username, email or phone number. This is the only place
that touches them, so it is the only place that has to be right.
"""

from __future__ import annotations

import hashlib
import logging
import os
import re
from datetime import datetime, timezone

from datasketch import MinHash, MinHashLSH

from engine.schema import Document, Source

log = logging.getLogger(__name__)

EMAIL = re.compile(r"[\w.+-]+@[\w-]+\.[\w.]+")
PHONE = re.compile(r"(?:\+?91[-\s]?)?\b[6-9]\d{9}\b")
ORDER_ID = re.compile(r"\b(?:order|ord)[\s#:-]*\w{6,}\b", re.I)

# Hinglish markers — cheap heuristic, good enough for a corpus-composition stat.
HINGLISH = re.compile(
    r"\b(nahi|nahin|kya|hai|hain|kar|karo|kiya|bhai|accha|acha|bohot|bahut|"
    r"paisa|sasta|mehnga|jaldi|abhi|thoda|matlab|liye|wala|wali)\b",
    re.I,
)


def scrub(text: str) -> str:
    text = EMAIL.sub("[email]", text)
    text = PHONE.sub("[phone]", text)
    text = ORDER_ID.sub("[order-id]", text)
    return re.sub(r"\s+", " ", text).strip()


def detect_lang(text: str) -> str:
    if not re.search(r"[a-zA-Z]", text):
        return "hi"
    return "hinglish" if len(HINGLISH.findall(text)) >= 2 else "en"


def hash_author(author: str | None) -> str | None:
    if not author:
        return None
    salt = os.getenv("AUTHOR_HASH_SALT", "")
    if not salt:
        log.warning("AUTHOR_HASH_SALT unset — hashes will not be stable across runs")
    return hashlib.sha256(f"{salt}{author}".encode()).hexdigest()[:24]


def _parse_ts(value) -> datetime | None:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return datetime.fromtimestamp(value, tz=timezone.utc)
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return None


def _doc_id(source: str, external_id: str | None, text: str) -> str:
    basis = external_id or text[:200]
    return f"{source[:2]}_{hashlib.sha1(basis.encode()).hexdigest()[:16]}"


def normalize(raw: list[dict], min_chars: int = 25) -> list[Document]:
    """Validate, scrub and de-noise. Drops empties and anything too short to carry signal."""
    docs: list[Document] = []
    dropped_short = 0

    for r in raw:
        text = scrub(r.get("text") or "")
        if len(text) < min_chars:
            dropped_short += 1
            continue

        try:
            docs.append(
                Document(
                    doc_id=_doc_id(r["source"], r.get("external_id"), text),
                    source=Source(r["source"]),
                    source_url=r.get("source_url"),
                    app_or_community=r.get("app_or_community", "unknown"),
                    created_at=_parse_ts(r.get("created_at")),
                    text=text,
                    rating=r.get("rating"),
                    upvotes=r.get("upvotes"),
                    replies=r.get("replies"),
                    lang=detect_lang(text),
                    author_hash=hash_author(r.get("author")),
                )
            )
        except Exception as exc:  # noqa: BLE001
            log.debug("normalize: dropped malformed record: %s", exc)

    log.info("normalize: %d raw -> %d valid (%d too short)", len(raw), len(docs), dropped_short)
    return docs


def dedupe(docs: list[Document], threshold: float = 0.9) -> list[Document]:
    """Near-duplicate removal via MinHash LSH.

    Matters more than it looks: templated and bot reviews cluster hard, and left in they inflate the
    prevalence of whichever theme they happen to touch. Frequency is the number the whole analysis
    rests on, so it has to be counted on distinct voices.
    """
    lsh = MinHashLSH(threshold=threshold, num_perm=64)
    kept: list[Document] = []
    exact: set[str] = set()

    for doc in docs:
        norm = doc.text.lower()
        if norm in exact:
            continue
        exact.add(norm)

        mh = MinHash(num_perm=64)
        for token in norm.split():
            mh.update(token.encode())

        if lsh.query(mh):
            continue
        lsh.insert(doc.doc_id, mh)
        kept.append(doc)

    log.info("dedupe: %d -> %d (%d near-duplicates)", len(docs), len(kept), len(docs) - len(kept))
    return kept
