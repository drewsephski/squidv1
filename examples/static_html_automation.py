#!/usr/bin/env python3
"""
Static HTML Automation Example - Using file:// URLs for local HTML
"""

from playwright.sync_api import sync_playwright
import os

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Example: Load a local HTML file
        # Assuming you have a static HTML file at public/index.html
        html_path = os.path.join(os.getcwd(), 'public', 'index.html')
        file_url = f'file://{html_path}'

        page.goto(file_url)
        page.wait_for_load_state('networkidle')

        # Take a screenshot for inspection
        page.screenshot(path='/tmp/static_page.png', full_page=True)
        print("Screenshot saved to /tmp/static_page.png")

        # Example automation: Click a button if it exists
        try:
            button = page.locator('button').first
            if button.is_visible():
                button.click()
                print("Clicked the first button")
                page.wait_for_timeout(1000)  # Wait for any animations
        except:
            print("No clickable button found")

        # Extract page content
        content = page.content()
        print(f"Page title: {page.title()}")
        print(f"Page contains {len(content)} characters")

        browser.close()

if __name__ == '__main__':
    main()</content>
<parameter name="filePath">examples/static_html_automation.py