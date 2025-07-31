from playwright.sync_api import sync_playwright



with sync_playwright() as p:

    browser = p.chromium.launch()

    page = browser.new_page()

    page.goto("https://ica.se/recept/korv/stroganoff")

    # Print all links on the page
    links = page.query_selector_all('a')
    for link in links:
        print(link.get_attribute('href'))

    browser.close()