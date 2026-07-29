"""Reddit collector — posts and comments mentioning quick commerce.

The most *discursive* source in the corpus. Play Store reviews are short and complaint-shaped;
Reddit threads contain reasoning ("I switched to X because…"), which is where mechanism-level
insight comes from. Worth the five minutes it takes to create the app credentials.

Skipped gracefully when credentials are absent — the pipeline still runs without it.
"""

from __future__ import annotations

import logging
import os

log = logging.getLogger(__name__)

SUBREDDITS = [
    "india", "bangalore", "mumbai", "delhi", "pune", "hyderabad",
    "IndiaSpeaks", "developersIndia", "IndianFood", "personalfinanceindia",
]

QUERIES = [
    "blinkit", "zepto", "instamart", "quick commerce",
    "grocery delivery app", "10 minute delivery",
]


def _credentials() -> tuple[str, str, str] | None:
    cid = os.getenv("REDDIT_CLIENT_ID")
    secret = os.getenv("REDDIT_CLIENT_SECRET")
    agent = os.getenv("REDDIT_USER_AGENT", "blinkit-discovery/0.1")
    if not cid or not secret:
        return None
    return cid, secret, agent


def collect(limit_per_query: int = 60, comments_per_post: int = 15) -> list[dict]:
    creds = _credentials()
    if creds is None:
        log.warning("reddit: no credentials in .env, skipping source")
        return []

    import praw  # imported lazily so the module loads without praw installed

    cid, secret, agent = creds
    api = praw.Reddit(client_id=cid, client_secret=secret, user_agent=agent)

    collected: list[dict] = []
    seen: set[str] = set()

    for sub in SUBREDDITS:
        for query in QUERIES:
            try:
                results = api.subreddit(sub).search(query, limit=limit_per_query, sort="relevance")
                for post in results:
                    if post.id in seen:
                        continue
                    seen.add(post.id)

                    body = f"{post.title}\n\n{post.selftext or ''}".strip()
                    collected.append(
                        {
                            "source": "reddit",
                            "source_url": f"https://reddit.com{post.permalink}",
                            "app_or_community": f"r/{sub}",
                            "external_id": post.id,
                            "author": str(post.author) if post.author else None,
                            "created_at": post.created_utc,
                            "text": body,
                            "rating": None,
                            "upvotes": post.score,
                            "replies": post.num_comments,
                        }
                    )

                    # Comments carry the reasoning; the post title is often just a prompt.
                    post.comments.replace_more(limit=0)
                    for c in post.comments[:comments_per_post]:
                        if not getattr(c, "body", None) or c.body in ("[deleted]", "[removed]"):
                            continue
                        collected.append(
                            {
                                "source": "reddit",
                                "source_url": f"https://reddit.com{post.permalink}",
                                "app_or_community": f"r/{sub}",
                                "external_id": c.id,
                                "author": str(c.author) if c.author else None,
                                "created_at": c.created_utc,
                                "text": c.body,
                                "rating": None,
                                "upvotes": c.score,
                                "replies": None,
                            }
                        )
            except Exception as exc:  # noqa: BLE001
                log.warning("reddit: r/%s '%s' failed: %s", sub, query, exc)
                continue

    log.info("reddit: -> %d documents", len(collected))
    return collected
