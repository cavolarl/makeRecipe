from playwright.sync_api import sync_playwright
import re

recipe_pattern = re.compile(r"^https://www\.ica\.se/recept/.+-\d{6}/$")

def find_all_recipe_links():
    """
    Finds all recipe links on the current page.
    Returns a list of links that match the recipe pattern.
    """
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto("https://www.ica.se/recept/korv/stroganoff")  # fixed URL
        hrefs = page.eval_on_selector_all("a", "elements => elements.map(e => e.href)")
        links = [href for href in hrefs if recipe_pattern.match(href)]
        browser.close()
        return links

def find_ingridients_from_recipe(url):
    """
    Scrapes ingredients from a recipe page.
    Returns a list of ingredients found on the page.
    """
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto(url)
        ingredients = page.eval_on_selector_all("div.ingredients-list-group__card", 
            "elements => elements.map(e => e.textContent.trim())")
        browser.close()
        return ingredients
    
recipelist = find_all_recipe_links()
print(find_ingridients_from_recipe(recipelist[0]))