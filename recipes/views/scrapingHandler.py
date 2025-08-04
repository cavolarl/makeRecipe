from django.http import JsonResponse
from .ingridientHandler import find_or_create_ingredient
from .newScraper import find_ingridients_from_recipe
from .parser import parse_ingredient
from .pages import SITE_CONFIGS
import re

def get_site_key_from_url(url):
    for key in SITE_CONFIGS:
        if key in url:
            return key
    return None

def scrape_recipe(request):
    url = request.GET.get('url')
    if not url:
        return JsonResponse({'error': 'URL is required.'}, status=400)

    site_key = get_site_key_from_url(url)
    if not site_key:
        return JsonResponse({'error': 'Website not supported for scraping.'}, status=400)

    try:
        raw_ingredients = find_ingridients_from_recipe(url, site_key)
        
        ingredients = []
        for raw_ing in raw_ingredients:
            parsed_ings = parse_ingredient(raw_ing)
            for ing in parsed_ings:
                ingredient_data = find_or_create_ingredient(ing['item'])
                ingredients.append({
                    'original_name': ing['item'],
                    'quantity': ing['amount'] if ing['amount'] is not None else '',
                    'unit': ing['unit'],
                    'managed_ingredient': ingredient_data
                })

        return JsonResponse({'ingredients': ingredients})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
