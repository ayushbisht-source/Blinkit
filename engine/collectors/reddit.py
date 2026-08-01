"""Reddit collector — public JSON endpoints, no credentials required.

Reddit serves any listing as JSON by appending `.json` to the URL. That path is unauthenticated and
rate-limited only by user-agent courtesy, which means the OAuth app registration this originally
required was never actually necessary for reading public posts.

This matters for source coverage. The brief asks for Reddit discussions, community forums and social
media alongside app-store reviews, and Reddit is the only one of those three reachable without
either paid API access (X) or scraping behind a login. It is also the most *discursive* source
available: app-store reviews are short and complaint-shaped, while Reddit threads contain reasoning
("I switched to X because…"), which is where mechanism-level insight comes from.
"""

from __future__ import annotations

import logging
import time
from typing import Iterator

import requests

log = logging.getLogger(__name__)

# Reddit blocks default library user-agents. A descriptive one is both required and courteous.
HEADERS = {"User-Agent": "blinkit-category-research/0.1 (academic project; contact via GitHub)"}
BASE = "https://www.reddit.com"

SUBREDDITS = [
    "india", "bangalore", "mumbai", "delhi", "pune", "hyderabad", "chennai",
    "IndiaSpeaks", "developersIndia", "IndianFood", "personalfinanceindia",
    "IndianStreetBets", "bangaloreDiaries",
]

QUERIES = [
    "blinkit", "zepto", "instamart", "quick commerce", "10 minute delivery",
    "grocery delivery app", "bigbasket", "dunzo", "online grocery",
]


def _get(url: str, params: dict | None = None) -> dict | None:
    try:
        r = requests.get(url, params=params, headers=HEADERS, timeout=25)
        if r.status_code == 429:
            log.warning("reddit: rate limited, backing off")
            time.sleep(5)
            return None
        r.raise_for_status()
        return r.json()
    except Exception as exc:  # noqa: BLE001 — one bad listing must not end the run
        log.debug("reddit: %s failed: %s", url, exc)
        return None


def _posts(subreddit: str, query: str, limit: int) -> Iterator[dict]:
    data = _get(
        f"{BASE}/r/{subreddit}/search.json",
        {"q": query, "restrict_sr": "on", "sort": "relevance", "t": "all", "limit": limit},
    )
    for child in (data or {}).get("data", {}).get("children", []):
        yield child.get("data", {})


def _comments(permalink: str, limit: int) -> Iterator[dict]:
    """Top-level comments for a post. The comments carry the reasoning; titles are often just bait."""
    data = _get(f"{BASE}{permalink}.json", {"limit": limit, "depth": 1})
    if not isinstance(data, list) or len(data) < 2:
        return
    for child in data[1].get("data", {}).get("children", []):
        c = child.get("data", {})
        if c.get("body") and c["body"] not in ("[deleted]", "[removed]"):
            yield c


def collect(limit_per_query: int = 40, comments_per_post: int = 12, pause: float = 1.2) -> list[dict]:
    collected: list[dict] = []
    seen: set[str] = set()

    for sub in SUBREDDITS:
        for query in QUERIES:
            for post in _posts(sub, query, limit_per_query):
                pid = post.get("id")
                if not pid or pid in seen:
                    continue
                seen.add(pid)

                body = f"{post.get('title', '')}\n\n{post.get('selftext', '') or ''}".strip()
                if len(body) > 25:
                    collected.append(
                        {
                            "source": "reddit",
                            "source_url": BASE + post.get("permalink", ""),
                            "app_or_community": f"r/{sub}",
                            "external_id": pid,
                            "author": post.get("author"),
                            "created_at": post.get("created_utc"),
                            "text": body,
                            "rating": None,
                            "upvotes": post.get("score"),
                            "replies": post.get("num_comments"),
                        }
                    )

                # Only pull comments for posts with actual discussion — saves requests and skips
                # the long tail of unanswered posts.
                if (post.get("num_comments") or 0) >= 3 and post.get("permalink"):
                    for c in _comments(post["permalink"], comments_per_post):
                        cid = c.get("id")
                        if not cid or cid in seen:
                            continue
                        seen.add(cid)
                        collected.append(
                            {
                                "source": "reddit",
                                "source_url": BASE + post.get("permalink", ""),
                                "app_or_community": f"r/{sub}",
                                "external_id": cid,
                                "author": c.get("author"),
                                "created_at": c.get("created_utc"),
                                "text": c.get("body", ""),
                                "rating": None,
                                "upvotes": c.get("score"),
                                "replies": None,
                            }
                        )
                    time.sleep(pause)
                time.sleep(pause / 2)

            log.info("reddit: r/%s '%s' -> %d cumulative", sub, query, len(collected))

    log.info("reddit: %d documents from %d subreddits", len(collected), len(SUBREDDITS))
    return collected
