import time
import traceback
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# Chrome options for stealth mode
chrome_options = Options()
chrome_options.add_argument("--headless")  # Run without UI (optional)
chrome_options.add_argument("--disable-gpu")
chrome_options.add_argument("--window-size=1920,1080")
chrome_options.add_argument("--no-sandbox")
chrome_options.add_argument("--disable-dev-shm-usage")
chrome_options.add_argument("--disable-blink-features=AutomationControlled")
chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
chrome_options.add_experimental_option("useAutomationExtension", False)

# Set a custom User-Agent to bypass bot detection
chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36")

# ChromeDriver setup
service = Service("/usr/bin/chromedriver")
driver = webdriver.Chrome(service=service, options=chrome_options)


def debug_screenshot(driver, step_name):
    """Capture a screenshot for debugging."""
    screenshot_path = f"debug_{step_name}.png"
    driver.save_screenshot(screenshot_path)
    print(f"[DEBUG] Screenshot saved: {screenshot_path}")


def login_to_tiktok(driver, username, password):
    """Logs into TikTok using the provided credentials."""
    try:
        print("[DEBUG] Navigating to TikTok login page...")
        driver.get("https://www.tiktok.com/login")
        time.sleep(5)  # Allow page to load
        debug_screenshot(driver, "login_page_loaded")

        # Check if login is inside an iframe
        print("[DEBUG] Checking for iframe...")
        iframes = driver.find_elements(By.TAG_NAME, "iframe")
        if iframes:
            print("[DEBUG] Switching to login iframe...")
            driver.switch_to.frame(iframes[0])
            debug_screenshot(driver, "iframe_detected")

        # Click on "Use phone / email / username"
        print("[DEBUG] Clicking on 'Use phone / email / username'...")
        login_option = WebDriverWait(driver, 30).until(
            EC.element_to_be_clickable((By.XPATH, "//div[contains(text(), 'Use phone / email / username')]"))
        )
        login_option.click()
        time.sleep(3)
        debug_screenshot(driver, "login_option_clicked")

        # Click on "Log in with email / username"
        print("[DEBUG] Selecting 'Log in with email / username' option...")
        email_login_option = WebDriverWait(driver, 30).until(
            EC.element_to_be_clickable((By.XPATH, "//a[contains(text(), 'Log in with email or username')]"))
        )
        email_login_option.click()
        time.sleep(3)
        debug_screenshot(driver, "email_login_option_clicked")

        # Ensure we are not inside an iframe anymore
        driver.switch_to.default_content()

        # Find and enter username
        print("[DEBUG] Waiting for username input field...")
        username_field = WebDriverWait(driver, 30).until(
            EC.presence_of_element_located((By.XPATH, "//input[@name='username' or @type='text']"))
        )
        username_field.send_keys(username)
        debug_screenshot(driver, "username_entered")

        # Find and enter password
        print("[DEBUG] Waiting for password input field...")
        password_field = WebDriverWait(driver, 30).until(
            EC.presence_of_element_located((By.XPATH, "//input[@name='password' or @type='password']"))
        )
        password_field.send_keys(password)
        debug_screenshot(driver, "password_entered")

        # Click login button
        print("[DEBUG] Clicking login button...")
        login_button = WebDriverWait(driver, 30).until(
            EC.element_to_be_clickable((By.XPATH, "//button[@type='submit']"))
        )
        login_button.click()
        time.sleep(5)
        debug_screenshot(driver, "after_login_attempt")

        # Check for successful login
        if "login" in driver.current_url:
            print("[ERROR] Login failed! Still on login page.")
            debug_screenshot(driver, "login_failed")
        else:
            print("[SUCCESS] Logged in successfully!")

    except Exception as e:
        print("[ERROR] Login failed due to an exception!")
        print(traceback.format_exc())
        debug_screenshot(driver, "login_error")


def main():
    """Main function to run TikTok login automation."""
    username = "alxtester"  # Replace with your TikTok username
    password = "Alx@1234"  # Replace with your TikTok password

    login_to_tiktok(driver, username, password)

    # Close the browser
    driver.quit()


if __name__ == "__main__":
    main()

