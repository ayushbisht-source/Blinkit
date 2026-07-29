"""Google Play review collector.

Highest-yield source by a wide margin: no auth, no rate-limit ceremony, and a deep well of
India-market reviews across the major q-commerce apps.

Volume note. Google caps how deep the continuation token will page for any single
(sort, language) combination — typically a few hundred reviews, well short of what you ask for.
Requesting 1000 with one sort quietly returns ~350. The fix is to sweep several sort orders and
languages and union the results by review id: each combination exposes a different slice of the
same review pool, and together they multiply the yield several times over.

The sweep is also a quality win, not just a volume one. NEWEST alone skews to whatever people are
angry about this week; adding RATING and MOST_RELEVANT pulls in the considered, longer reviews
where people actually explain their reasoning.
"""

from __future__ import annotations

import logging
import time

from google_play_scraper import Sort, reviews

log = logging.getLogger(__name__)

# Verified against the India Play Store. Dunzo is deliberately absent — it shut down in 2024 and
# its listing is gone, so it can only ever contribute zero.
APPS: dict[str, str] = {
    "blinkit": "com.grofers.customerapp",
    "zepto": "com.zeptoconsumerapp",
    "instamart": "in.swiggy.android",       # Instamart lives inside the Swiggy app
    "bigbasket": "com.bigbasket.mobileapp",
    "jiomart": "com.jpl.jiomart",
}

SORTS = [Sort.NEWEST, Sort.RATING, Sort.MOST_RELEVANT]
LANGS = ["en", "hi"]


def _fetch_slice(
    package: str,
    sort: Sort,
    lang: str,
    target: int,
    country: str = "in",
) -> list[dict]:
    """Page one (sort, lang) combination until it is exhausted or `target` is reached."""
    out: list[dict] = []
    token = None

    while len(out) < target:
        try:
            batch, token = reviews(
                package,
                lang=lang,
                country=country,
                sort=sort,
                count=min(200, target - len(out)),
                continuation_token=token,
            )
        except Exception as exc:  # noqa: BLE001 - one dead combination must not kill the run
            log.warning("  %s/%s/%s failed after %d: %s", package, sort.name, lang, len(out), exc)
            break

        if not batch:
            break
        out.extend(batch)

        if token is None:
            break
        time.sleep(0.5)

    return out


def fetch_app(app_name: str, package: str, target: int = 1000, country: str = "in") -> list[dict]:
    seen: set[str] = set()
    collected: list[dict] = []

    for sort in SORTS:
        for lang in LANGS:
            if len(collected) >= target:
                break

            raw = _fetch_slice(package, sort, lang, target=target, country=country)
            added = 0
            for r in raw:
                rid = r.get("reviewId")
                if rid in seen:
                    continue
                seen.add(rid)
                added += 1
                collected.append(
                    {
                        "source": "play_store",
                        "source_url": f"https://play.google.com/store/apps/details?id={package}",
                        "app_or_community": app_name,
                        "external_id": rid,
                        "author": r.get("userName"),
                        "created_at": r["at"].isoformat() if r.get("at") else None,
                        "text": r.get("content") or "",
                        "rating": r.get("score"),
                        "upvotes": r.get("thumbsUpCount"),
                        "replies": None,
                    }
                )
            log.info("  %s %s/%s -> +%d new (total %d)", app_name, sort.name, lang, added, len(collected))

    if not collected:
        log.error("play_store: %s (%s) returned NOTHING — package id is probably wrong", app_name, package)
    else:
        log.info("play_store: %s -> %d reviews", app_name, len(collected))
    return collected


def collect(target_per_app: int = 1000) -> list[dict]:
    out: list[dict] = []
    for app_name, package in APPS.items():
        out.extend(fetch_app(app_name, package, target=target_per_app))
    return out
