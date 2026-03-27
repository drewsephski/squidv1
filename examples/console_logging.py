#!/usr/bin/env python3
"""
Console Logging Example - Capturing console logs during automation
"""

from playwright.sync_api import sync_playwright

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Set up console logging
        console_messages = []

        def on_console(msg):
            console_messages.append({
                'type': msg.type,
                'text': msg.text,
                'location': f"{msg.location.get('url', 'unknown')}:{msg.location.get('lineNumber', 0)}"
            })
            print(f"[CONSOLE {msg.type.upper()}] {msg.text}")

        page.on('console', on_console)

        # Navigate to the page
        page.goto('http://localhost:3000')  # Adjust URL as needed
        page.wait_for_load_state('networkidle')

        # Perform some actions that might generate console logs
        try:
            # Example: Click a button that might log something
            button = page.locator('button').first
            if button.is_visible():
                button.click()
                page.wait_for_timeout(2000)  # Wait for potential async operations

            # Example: Fill a form that might have validation logging
            input_field = page.locator('input').first
            if input_field.is_visible():
                input_field.fill('test input')
                input_field.press('Enter')
                page.wait_for_timeout(1000)

        except Exception as e:
            print(f"Action failed: {e}")

        # Summary of captured logs
        print(f"\nCaptured {len(console_messages)} console messages:")
        for msg in console_messages:
            print(f"  {msg['type'].upper()}: {msg['text']} (at {msg['location']})")

        # Check for errors
        errors = [msg for msg in console_messages if msg['type'] == 'error']
        if errors:
            print(f"\nFound {len(errors)} console errors!")
            for error in errors:
                print(f"  ERROR: {error['text']}")
        else:
            print("\nNo console errors found.")

        browser.close()

if __name__ == '__main__':
    main()</content>
<parameter name="filePath">examples/console_logging.py