from playwright.sync_api import sync_playwright
from .pages import SITE_CONFIGS
from .parser import parse_ingredient
import re

def find_all_recipe_links(site_key):
    """
    Finds all recipe links on the current page.
    Returns a list of links that match the recipe pattern.
    """
    config = SITE_CONFIGS[site_key]
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto(config["start_url"])
        hrefs = page.eval_on_selector_all(config["link_selector"], config["href_extractor"])
        links = [href for href in hrefs if config["recipe_pattern"].match(href)]
        browser.close()
        return links

def find_ingridients_from_recipe(url, site_key):
    """
    Scrapes ingredients from a recipe page.
    Returns a list of ingredients found on the page.
    """
    config = SITE_CONFIGS[site_key]
    print(f"Scraping ingredients from {url} using site key {site_key}")
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        # Adding timeout for page loading
        page.goto(url, wait_until="networkidle")
        ingredients = page.eval_on_selector_all(
            config["ingredients_selector"], config["ingredients_extractor"]
        )
        browser.close()
        return ingredients
    
def find_recipe_details(url, site_key):
    """
    Scrapes recipe details like title, description, and servings.
    Returns a dictionary with the scraped details.
    """
    config = SITE_CONFIGS[site_key]
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto(url, wait_until="networkidle")

        print(f"Scraping recipe details from {url} using site key {site_key}")

        try:
            title = page.eval_on_selector(config["title_selector"], config["title_extractor"])
        except Exception:
            title = None

        try:
            description = page.eval_on_selector(config["description_selector"], config["description_extractor"])
        except Exception:
            description = None

        try:
            servings = page.eval_on_selector(config["servings_selector"], config["servings_extractor"])
        except Exception:
            servings = None

        print(f"Title: {title}")
        print(f"Description: {description}")
        print(f"Servings: {servings}")

        browser.close()
        return {
            "title": title or "",
            "description": description or "",
            "servings": servings or ""
        }