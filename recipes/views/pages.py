import re



# A dictionary to hold the site settings for the scraper.
SITE_CONFIGS = {
    "ica.se": {
        "start_url": "https://www.ica.se/recept/",
        "recipe_pattern": re.compile(r"^https://www\.ica\.se/recept/.+-\d{6}/$"),
        "link_selector": "a",
        "href_extractor": "elements => elements.map(e => e.href)",
        "ingredients_selector": "div.ingredients-list-group__card",
        "ingredients_extractor": "elements => elements.map(e => e.textContent.trim())",
        "title_selector": "h1.recipe-header__title",
        "title_extractor": "element => element.textContent.trim()",
        "description_selector": "div.recipe-header__preamble",
        "description_extractor": "element => element.textContent.trim()",
        "servings_selector": "div.change-portions-wrapper",
        "servings_extractor": "element => { const match = element.textContent.match(/\\d+/); return match ? parseInt(match[0], 10) : null; }"


    },
    "koket.se": {
        "start_url": "https://www.koket.se/",
        "recipe_pattern": re.compile(r"^https://www\.koket\.se/[a-z0-9\-]+$"),
        "link_selector": "a",
        "href_extractor": "elements => elements.map(e => e.href)",
        "ingredients_selector": "li.ingredient_wrapper__uRhJx",
        "ingredients_extractor": "elements => elements.map(e => e.textContent.trim())",
        "title_selector": "h1.recipe_title__Al9fM",
        "title_extractor": "element => element.textContent.trim()",
        "description_selector": "div.koket_markdown_mdWrapper__trCli",
        "description_extractor": "element => element.textContent.trim()",
        "servings_selector": "span.portions_portions__Iwly7",
        "servings_extractor": "element => parseInt(element.textContent.match(/\\d+/)[0], 10)"
    }
}
