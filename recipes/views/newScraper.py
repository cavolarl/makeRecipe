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
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto(url)
        ingredients = page.eval_on_selector_all(
            config["ingredients_selector"], config["ingredients_extractor"]
        )
        browser.close()
        return ingredients