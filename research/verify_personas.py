"""Recompute every number quoted in research/synthetic-personas.md from the raw survey rows.

    python research/verify_personas.py

Exists because the first version of that document's results table was generated rather than
computed, and was wrong. Any figure in a research artifact should be reproducible by running
something; this is that something.

Survey rows are transcribed from the Google Forms responses sheet (40 responses, 28-29 Jul 2026).
Only the two fields the persona hypotheses depend on are needed here: order frequency and the
multi-select of categories ordered.
"""

from __future__ import annotations

import statistics
from collections import defaultdict

# (order_frequency, categories_ordered) — verbatim from the responses sheet
ROWS: list[tuple[str, str]] = [
    ("10+", "Snacks & beverages, Personal care"),
    ("10+", "Groceries, Snacks & beverages, Personal care, Baby products, Fruits & vegetables"),
    ("10+", "Groceries, Snacks & beverages, Household essentials, Personal care"),
    ("10+", "Groceries, Snacks & beverages, Household essentials, Personal care, Baby products, Fruits & vegetables"),
    ("6-10", "Groceries, Snacks & beverages, Household essentials, Personal care, Fruits & vegetables"),
    ("3-5", "Groceries, Snacks & beverages, Fruits & vegetables"),
    ("3-5", "Groceries, Snacks & beverages"),
    ("10+", "Groceries, Snacks & beverages, Household essentials"),
    ("10+", "Groceries, Snacks & beverages, Household essentials"),
    ("3-5", "Groceries, Snacks & beverages, Personal care, Fruits & vegetables"),
    ("1-2", "Groceries, Snacks & beverages"),
    ("3-5", "Snacks & beverages"),
    ("3-5", "Groceries, Snacks & beverages, Household essentials, Fruits & vegetables"),
    ("1-2", "Groceries, Snacks & beverages, Fruits & vegetables"),
    ("10+", "Groceries, Snacks & beverages"),
    ("3-5", "Groceries"),
    ("10+", "Groceries, Snacks & beverages, Household essentials, Personal care, Baby products"),
    ("3-5", "Groceries, Snacks & beverages, Personal care"),
    ("1-2", "Groceries, Snacks & beverages"),
    ("1-2", "Groceries, Snacks & beverages, Household essentials, Personal care, Pet supplies"),
    ("10+", "Groceries, Fruits & vegetables"),
    ("3-5", "Snacks & beverages, Personal care, Fruits & vegetables"),
    ("3-5", "Groceries, Snacks & beverages, Household essentials, Personal care"),
    ("6-10", "Groceries, Snacks & beverages, Household essentials"),
    ("6-10", "Groceries, Snacks & beverages, Fruits & vegetables"),
    ("6-10", "Groceries, Snacks & beverages, Fruits & vegetables"),
    ("6-10", "Groceries, Snacks & beverages, Personal care"),
    ("1-2", "Snacks & beverages, Personal care, Pet supplies"),
    ("6-10", "Groceries, Snacks & beverages, Fruits & vegetables"),
    ("6-10", "Groceries, Snacks & beverages, Household essentials, Personal care, Fruits & vegetables"),
    ("6-10", "Groceries, Snacks & beverages, Household essentials"),
    ("1-2", "Groceries, Snacks & beverages, Personal care"),
    ("6-10", "Groceries"),
    ("1-2", "Snacks & beverages, Household essentials, Fruits & vegetables"),
    ("3-5", "Snacks & beverages, Household essentials, Personal care"),
    ("3-5", "Groceries"),
    ("10+", "Groceries, Snacks & beverages, Fruits & vegetables"),
    ("10+", "Groceries, Snacks & beverages, Personal care"),
    ("1-2", "Snacks & beverages"),
    ("10+", "Groceries, Snacks & beverages, Household essentials"),
]

ORDER = ["1-2", "3-5", "6-10", "10+"]


def n_categories(cell: str) -> int:
    return len([c for c in cell.split(",") if c.strip()])


def main() -> None:
    assert len(ROWS) == 40, f"expected 40 rows, got {len(ROWS)}"

    grouped: dict[str, list[int]] = defaultdict(list)
    for freq, cats in ROWS:
        grouped[freq].append(n_categories(cats))

    print(f"n = {len(ROWS)} responses\n")
    print(f"{'Order frequency':>16} {'n':>4} {'mean categories':>17}")
    for f in ORDER:
        v = grouped[f]
        print(f"{f:>16} {len(v):>4} {statistics.mean(v):>17.2f}")

    rank = {f: i for i, f in enumerate(ORDER)}
    xs = [rank[f] for f, _ in ROWS]
    ys = [n_categories(c) for _, c in ROWS]
    mx, my = statistics.mean(xs), statistics.mean(ys)
    cov = sum((a - mx) * (b - my) for a, b in zip(xs, ys))
    den = (sum((a - mx) ** 2 for a in xs) * sum((b - my) ** 2 for b in ys)) ** 0.5
    r = cov / den

    print(f"\nPearson r (frequency rank vs category count) = {r:+.3f}")
    print()
    print("P1's consolidation hypothesis predicts r < 0 (infrequent users bundle more categories).")
    print(f"Observed r is {'positive' if r > 0 else 'negative'} -> hypothesis "
          f"{'NOT supported' if r > 0 else 'supported'}.")
    print("At n=40, |r| of this size is suggestive only; it does not support a strong claim either way.")


if __name__ == "__main__":
    main()
