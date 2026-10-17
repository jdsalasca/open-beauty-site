from pathlib import Path
import json
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[1]
styles = ["renaissance", "brutalist", "papercraft"]

with sync_playwright() as p:
    browser = p.chromium.launch(channel="chrome", headless=True)
    for style in styles:
        page = browser.new_page(viewport={"width": 1440, "height": 900}, device_scale_factor=1)
        errors = []
        page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
        url = (root / "examples" / style / "index.html").as_uri()
        page.goto(url)
        page.wait_for_timeout(2000)
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page.wait_for_timeout(900)
        page.evaluate("window.scrollTo(0, 0)")
        page.wait_for_timeout(500)
        page.screenshot(path=str(root / "qa" / f"{style}-full.png"), full_page=True)
        page.screenshot(path=str(root / "qa" / f"{style}-top.png"), full_page=False)
        info = page.evaluate(
            """() => {
              const pick = (s) => {
                const el = document.querySelector(s);
                if (!el) return null;
                const r = el.getBoundingClientRect();
                const cs = getComputedStyle(el);
                return {top: Math.round(r.top + scrollY), height: Math.round(r.height), opacity: cs.opacity, text: (el.innerText || '').slice(0, 60)};
              };
              return {
                scrollHeight: document.body.scrollHeight,
                h1: pick('h1'),
                quote: pick('.quote'),
                quoteBand: pick('.quote-band'),
                cta: pick('.cta'),
                works: pick('.works'),
                hero: pick('.hero'),
              };
            }"""
        )
        print(style, json.dumps(info, ensure_ascii=False))
        print("console-errors", errors[:3])
        page.close()
    browser.close()
