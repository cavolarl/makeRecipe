from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from recipes.models import Recipe, Ingredient
from recipes.forms import RecipeForm, IngredientFormSet, IngredientEditFormSet
from .quantityHandler import normalize_quantity
from .ingridientHandler import find_or_create_ingredient
import requests
from bs4 import BeautifulSoup
import re



def scrape_recipe(request):
    url = request.GET.get('url')
    if not url:
        return JsonResponse({'error': 'URL is required.'}, status=400)

    try:
        resp = requests.get(url)
        soup = BeautifulSoup(resp.text, 'html.parser')

        ingredients = []
        cards = soup.select('div.ingredients-list-group__card')
        for card in cards:
            qty_element = card.select_one('span.ingredients-list-group__card__qty')
            qty_text = qty_element.get_text(strip=True) if qty_element else ''

            if qty_element:
                qty_element.extract()
            
            ing_text = card.get_text(strip=True)

            normalized_qty_text = normalize_quantity(qty_text)

            quantity = ''
            unit = ''
            match = re.match(r'([0-9\.]+)\s*(.*)', normalized_qty_text)
            if match:
                quantity = match.group(1).strip()
                unit = match.group(2).strip()
            else:
                quantity = normalized_qty_text.strip()

            ingredient_data = find_or_create_ingredient(ing_text)
            ingredients.append({
                'original_name': ing_text,
                'quantity': quantity,
                'unit': unit,
                'managed_ingredient': ingredient_data
            })

        return JsonResponse({'ingredients': ingredients})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)