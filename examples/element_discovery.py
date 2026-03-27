#!/usr/bin/env python3
from playwright.sync_api import sync_playwright


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the page
        page.goto("http://localhost:3000")
        page.wait_for_load_state("networkidle")

        # Discover all buttons
        buttons = page.locator("button").all()
        print(f"Found {len(buttons)} buttons:")
        for i, button in enumerate(buttons):
            text = (
                button.text_content().strip()
                or button.get_attribute("aria-label")
                or f"Button {i + 1}"
            )
            print(f"  - {text}")

        # Discover all links
        links = page.locator("a").all()
        print(f"\nFound {len(links)} links:")
        for i, link in enumerate(links):
            href = link.get_attribute("href") or "#"
            text = link.text_content().strip() or f"Link {i + 1}"
            print(f"  - {href} -> {text}")

        # Discover all input fields
        inputs = page.locator("input").all()
        print(f"\nFound {len(inputs)} input fields:")
        for i, inp in enumerate(inputs):
            input_type = inp.get_attribute("type") or "text"
            placeholder = inp.get_attribute("placeholder") or ""
            name = inp.get_attribute("name") or f"input-{i + 1}"
            print(f"  - {name} (type: {input_type}) placeholder: '{placeholder}'")

        browser.close()


if __name__ == "__main__":
    main()
