"""Reddit collector.

Two paths, chosen automatically. With REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET set it uses the
client-credentials grant against oauth.reddit.com. Without them it falls back to the public `.json`
endpoints, which work from a personal machine and are refused from CI: a GitHub Actions run returned
**HTTP 403 on 117 of 117 requests**, body being Reddit's HTML block page. Reddit blocks datacenter
IP ranges for anonymous reads, so on a runner the credentials are not optional.

This matters for source coverage. The brief asks for Reddit discussions, community forums and social
media alongside app-store reviews, and Reddit is the only one of those three reachable without
either paid API access (X) or scraping behind a login. It is also the most *discursive* source
available: app-store reviews are short and complaint-shaped, while Reddit threads contain reasoning
("I switched to X because…"), which is where mechanism-level insight comes from.
"""

from __future__ import annotations

import logging
import os
import time
from typing import Iterator

import requests

log = logging.getLogger(__name__)

# Reddit blocks default library user-agents. A descriptive one is both required and courteous.
HEADERS = {"User-Agent": "blinkit-category-research/0.1 (academic project; contact via GitHub)"}
PUBLIC_BASE = "https://www.reddit.com"
OAUTH_BASE = "https://oauth.reddit.com"

# Resolved once, at first use, by _session().
_BASE = PUBLIC_BASE
_SESSION: requests.Session | None = None


def _session() -> requests.Session:
    """A session, authenticated if credentials exist.

    The unauthenticated `.json` endpoints work fine from a laptop and are refused outright from CI:
    a run from GitHub Actions returned **HTTP 403 on 117 of 117 requests**, with Reddit's HTML block
    page as the body. Reddit blocks datacenter IP ranges for anonymous reads, so "no documents" from
    a runner means "blocked", not "nothing to find".

    With REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET set, this uses the client-credentials grant
    against oauth.reddit.com, which is not IP-blocked. Register a free "script" app at
    https://www.reddit.com/prefs/apps to obtain them.
    """
    global _SESSION, _BASE
    if _SESSION is not None:
        return _SESSION

    s = requests.Session()
    s.headers.update(HEADERS)

    cid = os.getenv("REDDIT_CLIENT_ID", "").strip()
    secret = os.getenv("REDDIT_CLIENT_SECRET", "").strip()
    if cid and secret:
        try:
            r = requests.post(
                f"{PUBLIC_BASE}/api/v1/access_token",
                auth=(cid, secret),
                data={"grant_type": "client_credentials"},
                headers=HEADERS,
                timeout=25,
            )
            r.raise_for_status()
            token = r.json()["access_token"]
            s.headers["Authorization"] = f"bearer {token}"
            _BASE = OAUTH_BASE
            log.info("reddit: authenticated — using %s", OAUTH_BASE)
        except Exception as exc:  # noqa: BLE001
            log.warning("reddit: auth failed (%s), falling back to public endpoints", str(exc)[:150])
    else:
        log.warning(
            "reddit: no REDDIT_CLIENT_ID / REDDIT_CLIENT_SECRET — using public .json endpoints, "
            "which Reddit refuses from datacenter IPs. Expect 403s if this is running in CI."
        )

    _SESSION = s
    return s

SUBREDDITS = [
    "india", "bangalore", "mumbai", "delhi", "pune", "hyderabad", "chennai",
    "IndiaSpeaks", "developersIndia", "IndianFood", "personalfinanceindia",
    "IndianStreetBets", "bangaloreDiaries",
]

QUERIES = [
    "blinkit", "zepto", "instamart", "quick commerce", "10 minute delivery",
    "grocery delivery app", "bigbasket", "dunzo", "online grocery",
]


_FAILURES: dict[str, int] = {}


def _get(url: str, params: dict | None = None) -> dict | None:
    """One listing. Failures are counted and surfaced, never silently swallowed.

    This used to log at DEBUG and return None, which meant a run that was being blocked outright
    looked exactly like a run that found nothing to report — "0 documents from 13 subreddits" with
    no indication that not one request had actually succeeded. Reddit blocks unauthenticated
    requests from datacenter ranges, so that distinction is the whole diagnosis.
    """
    try:
        r = _session().get(url, params=params, timeout=25)
        if r.status_code == 429:
            _FAILURES["429 rate limited"] = _FAILURES.get("429 rate limited", 0) + 1
            log.warning("reddit: rate limited, backing off")
            time.sleep(5)
            return None
        if r.status_code != 200:
            key = f"HTTP {r.status_code}"
            _FAILURES[key] = _FAILURES.get(key, 0) + 1
            if _FAILURES[key] == 1:
                log.warning("reddit: %s — first body: %s", key, r.text[:200].replace("\n", " "))
            return None
        return r.json()
    except Exception as exc:  # noqa: BLE001 — one bad listing must not end the run
        key = type(exc).__name__
        _FAILURES[key] = _FAILURES.get(key, 0) + 1
        if _FAILURES[key] == 1:
            log.warning("reddit: %s — %s", key, str(exc)[:200])
        return None


def failure_summary() -> dict[str, int]:
    """What went wrong and how often, for the caller to report."""
    return dict(_FAILURES)


def _url(path: str) -> str:
    """Absolute URL for a listing path, on whichever host this run is authorised for.

    Two things this has to get right. The host is only known after `_session()` has tried to
    authenticate, so it is resolved here rather than at import time — reading the global while
    building an f-string elsewhere would pin the public host before auth had run. And the `.json`
    suffix belongs to the public host only: oauth.reddit.com serves JSON at the bare path and
    returns an error if you append it.
    """
    _session()
    return f"{_BASE}{path}.json" if _BASE == PUBLIC_BASE else f"{_BASE}{path}"


def _posts(subreddit: str, query: str, limit: int) -> Iterator[dict]:
    data = _get(
        _url(f"/r/{subreddit}/search"),
        {"q": query, "restrict_sr": "on", "sort": "relevance", "t": "all", "limit": limit},
    )
    for child in (data or {}).get("data", {}).get("children", []):
        yield child.get("data", {})


def _comments(permalink: str, limit: int) -> Iterator[dict]:
    """Top-level comments for a post. The comments carry the reasoning; titles are often just bait."""
    data = _get(_url(permalink.rstrip("/")), {"limit": limit, "depth": 1})
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
                            "source_url": PUBLIC_BASE + post.get("permalink", ""),
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
                                "source_url": PUBLIC_BASE + post.get("permalink", ""),
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
    if _FAILURES:
        log.warning("reddit: request failures by kind: %s", failure_summary())
        if not collected:
            log.warning(
                "reddit: every request failed — this is a blocked or unreachable endpoint, not an "
                "absence of discussion. Reddit refuses unauthenticated .json reads from datacenter "
                "IP ranges, which includes CI runners. Set REDDIT_CLIENT_ID / REDDIT_CLIENT_SECRET "
                "to use the authenticated API instead."
            )
    return collected
