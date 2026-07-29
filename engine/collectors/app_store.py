"""App Store reviews via the public iTunes RSS feed.

No key needed. The feed caps at 10 pages (~500 reviews) per app per country, which is why this is a
supporting source rather than a primary one. Its value is source diversity: an insight that shows up
on Play *and* App Store is far harder to dismiss as a platform artifact.
"""

from __future__ import annotations

import logging
import time

import requests

log = logging.getLogger(__name__)

# Numeric App Store ids. Verify at https://apps.apple.com before a long run — Apple reissues ids
# when an app is relisted, and a wrong id fails silently with an empty feed rather than a 404.
APPS: dict[str, str] = {
    "blinkit": "1533144170",
    "zepto": "1584982447",
    "instamart": "989540920",   # Swiggy
    "bigbasket": "663666583",
}

# Apple has quietly moved this endpoint more than once and never documented it. Try both known
# shapes per page and take whichever answers — the older country-prefixed path still works for some
# storefronts, the query-param form for others.
FEEDS = [
    "https://itunes.apple.com/{country}/rss/customerreviews/"
    "page={page}/id={app_id}/sortby=mostrecent/json",
    "https://itunes.apple.com/rss/customerreviews/"
    "page={page}/id={app_id}/sortby=mostrecent/json?l=en&cc={country}",
]


def _get_entries(app_id: str, country: str, page: int) -> list[dict] | None:
    for template in FEEDS:
        url = template.format(country=country, page=page, app_id=app_id)
        try:
            resp = requests.get(url, timeout=20, headers={"User-Agent": "Mozilla/5.0"})
            if resp.status_code != 200:
                continue
            entries = resp.json().get("feed", {}).get("entry", [])
            if entries:
                return entries
        except Exception as exc:  # noqa: BLE001
            log.debug("app_store: %s page %d via %s: %s", app_id, page, template[:40], exc)
    return None


def fetch_app(app_name: str, app_id: str, country: str = "in", max_pages: int = 10) -> list[dict]:
    collected: list[dict] = []

    for page in range(1, max_pages + 1):
        entries = _get_entries(app_id, country, page)
        if entries is None:
            if page == 1:
                log.warning(
                    "app_store: %s (id=%s) returned nothing on page 1 — id may be stale or the "
                    "feed is unavailable for this storefront",
                    app_name,
                    app_id,
                )
            break

        # Page 1 leads with an app-metadata entry that has no "author" — skip it.
        entries = [e for e in entries if "author" in e and "content" in e]
        if not entries:
            break

        for e in entries:
            collected.append(
                {
                    "source": "app_store",
                    "source_url": f"https://apps.apple.com/{country}/app/id{app_id}",
                    "app_or_community": app_name,
                    "external_id": e.get("id", {}).get("label"),
                    "author": e.get("author", {}).get("name", {}).get("label"),
                    "created_at": e.get("updated", {}).get("label"),
                    "text": e.get("content", {}).get("label", ""),
                    "rating": int(e.get("im:rating", {}).get("label", 0)) or None,
                    "upvotes": None,
                    "replies": None,
                }
            )
        time.sleep(0.5)

    log.info("app_store: %s -> %d reviews", app_name, len(collected))
    return collected


def collect() -> list[dict]:
    out: list[dict] = []
    for app_name, app_id in APPS.items():
        out.extend(fetch_app(app_name, app_id))
    return out
