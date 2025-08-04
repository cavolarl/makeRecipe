import re



# A dictionary to hold the site settings for the scraper.
SITE_CONFIGS = {
    "ica.se": {
        "start_url": "https://www.ica.se/recept/",
        "recipe_pattern": re.compile(r"^https://www\.ica\.se/recept/.+-\d{6}/$"),
        "link_selector": "a",
        "href_extractor": "elements => elements.map(e => e.href)",
        "ingredients_selector": "div.ingredients-list-group__card",
        "ingredients_extractor": "elements => elements.map(e => e.textContent.trim())"
    },
    "koket.se": {
        "start_url": "https://www.koket.se/",
        "recipe_pattern": re.compile(r"^https://www\.koket\.se/[a-z0-9\-]+$"),
        "link_selector": "a",
        "href_extractor": "elements => elements.map(e => e.href)",
        "ingredients_selector": "div.ingredients-list-group__card",
        "ingredients_extractor": "elements => elements.map(e => e.textContent.trim())"
    }
}
