"""No screen may scroll horizontally.

A flex item defaults to `min-width: auto`, so one un-shrinkable child — a nav, a
`shrink-0` block — silently widens the whole document and every screen grows a
horizontal scrollbar. It passes `tsc`, ESLint, the build and every Vitest test,
because nothing in that toolchain has a viewport. Only a browser catches it.

Run against a dev server (see AGENTS.md for the port):

    python3 tests/browser/no-horizontal-scroll.py            # localhost:3111
    python3 tests/browser/no-horizontal-scroll.py 3000

Exits non-zero and names the offending elements if any page overflows.
"""

import sys

from playwright.sync_api import sync_playwright

PORT = sys.argv[1] if len(sys.argv) > 1 else "3111"
BASE = f"http://localhost:{PORT}"

# 320 is below the PRD's 375px floor but catches regressions early; 1100 proves
# nothing depends on a narrow viewport to stay contained.
WIDTHS = [320, 375, 414, 768, 1100]
PATHS = ["/pos", "/pos/reservations", "/manage/menu", "/manage/reports", "/admin", "/signin"]

PROBE = """() => {
  const vw = document.documentElement.clientWidth;
  const offenders = [];
  for (const el of document.querySelectorAll("body *")) {
    const r = el.getBoundingClientRect();
    if (!r.width && !r.height) continue;
    if (r.right <= vw + 1 && r.left >= -1) continue;
    // Ignore anything inside a deliberate horizontal scroller (category tabs).
    let p = el.parentElement, inScroller = false;
    while (p && p !== document.body) {
      const ov = getComputedStyle(p).overflowX;
      if (ov === "auto" || ov === "scroll") { inScroller = true; break; }
      p = p.parentElement;
    }
    if (inScroller) continue;
    offenders.push({
      tag: el.tagName.toLowerCase(),
      cls: (el.className || "").toString().slice(0, 70),
      right: Math.round(r.right),
    });
  }
  return {
    vw,
    overflow: document.documentElement.scrollWidth - vw,
    offenders: offenders.slice(0, 5),
  };
}"""

failures = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    for width in WIDTHS:
        page = browser.new_page(viewport={"width": width, "height": 800})
        page.goto(f"{BASE}/login")
        page.wait_for_load_state("networkidle")
        page.fill('input[type="email"]', "manager@chulho.demo")
        page.fill('input[type="password"]', "manager1234")
        page.click('button[type="submit"]')
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(600)

        for path in PATHS:
            page.goto(f"{BASE}{path}")
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(300)
            d = page.evaluate(PROBE)
            status = "ok" if d["overflow"] <= 0 else f"OVERFLOW +{d['overflow']}px"
            print(f"  {width:>5}px {path:<20} {status}")
            if d["overflow"] > 0:
                for o in d["offenders"]:
                    print(f"          <{o['tag']} class={o['cls']!r}> right={o['right']}")
                failures.append(f"{path} @ {width}px (+{d['overflow']}px)")
        page.close()
    browser.close()

if failures:
    print("\nFAIL — horizontal scroll on:")
    for f in failures:
        print("  ", f)
    sys.exit(1)
print("\nPASS — no page scrolls horizontally at any tested width.")
