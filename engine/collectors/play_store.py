"""Google Play review collector.

Highest-yield source by a wide margin: no auth, no rate-limit ceremony, and tens of thousands of
India-market reviews across the four major q-commerce apps. Start here; if nothing else works, a
Play-Store-only corpus is still a defensible corpus.
"""

from __future__ import annotations

import logging
import time

from google_play_scraper import Sort, reviews

log = logging.getLogger(__name__)

# Package ids verified against the India Play Store listings.
APPS: dict[str, str] = {
    "blinkit": "com.grofers.customerapp",
    "zepto": "com.zeptoconsumerapp",
    "instamart": "com.swiggy.android",       # Instamart lives inside the Swiggy app
    "bigbasket": "com.bigbasket.mobileapp",
    "dunzo": "in.dunzo.user",
}


def fetch_app(
    app_name: str,
    package: str,
    target: int = 800,
    lang: str = "en",
    country: str = "in",
) -> list[dict]:
    """Page through reviews for one app until `target` is reached or the source runs dry."""
    collected: list[dict] = []
    token = None

    while len(collected) < target:
        try:
            batch, token = reviews(
                package,
                lang=lang,
                country=country,
                sort=Sort.NEWEST,
                count=min(200, target - len(collected)),
                continuation_token=token,
            )
        except Exception as exc:  # noqa: BLE001 - one bad app must not kill the run
            log.warning("play_store: %s failed at %d reviews: %s", app_name, len(collected), exc)
            break

        if not batch:
            break

        for r in batch:
            collected.append(
                {
                    "source": "play_store",
                    "source_url": f"https://play.google.com/store/apps/details?id={package}",
                    "app_or_community": app_name,
                    "external_id": r.get("reviewId"),
                    "author": r.get("userName"),
                    "created_at": r["at"].isoformat() if r.get("at") else None,
                    "text": r.get("content") or "",
                    "rating": r.get("score"),
                    "upvotes": r.get("thumbsUpCount"),
                    "replies": None,
                }
            )

        if token is None:
            break
        time.sleep(0.6)  # be a good citizen; the endpoint is unauthenticated but not free

    log.info("play_store: %s -> %d reviews", app_name, len(collected))
    return collected


def collect(target_per_app: int = 800) -> list[dict]:
    out: list[dict] = []
    for app_name, package in APPS.items():
        out.extend(fetch_app(app_name, package, target=target_per_app))
    return out
