from django.shortcuts import render, get_object_or_404, redirect
from django.http import JsonResponse
from .models import Recipe, Ingredient, ManagedIngredient
from .forms import RecipeForm, IngredientFormSet, ShoppingListForm, ManagedIngredientForm, IngredientEditFormSet
import requests
from bs4 import BeautifulSoup
import re

def normalize_quantity(text):
    """
    Converts unicode fractions, mixed number fractions, and simple fractions within a string to decimals.
    e.g., "½" -> "0.5", "2 1/2" -> "2.5", "1/2" -> "0.5"
    """
    if not text:
        return ""

    # 1. Replace unicode fractions
    unicode_map = {
        '½': '0.5', '⅓': '0.33', '⅔': '0.67', '¼': '0.25', '¾': '0.75',
        '⅕': '0.2', '⅖': '0.4', '⅗': '0.6', '⅘': '0.8', '⅙': '0.17',
        '⅚': '0.83', '⅛': '0.125', '⅜': '0.375', '⅝': '0.625', '⅞': '0.875'
    }
    processed_text = text
    for char, replacement in unicode_map.items():
        processed_text = processed_text.replace(char, replacement)

    # 2. Convert mixed fractions (e.g., "1 1/2")
    def mixed_fraction_to_float(match):
        try:
            whole = int(match.group(1))
            num = int(match.group(2))
            den = int(match.group(3))
            result = whole + (num / den)
            return str(round(result, 2)).rstrip('0').rstrip('.')
        except (ValueError, ZeroDivisionError):
            return match.group(0)
    processed_text = re.sub(r'(\d+)\s+(\d+)/(\d+)', mixed_fraction_to_float, processed_text)

    # 3. Convert simple fractions (e.g., "1/2")
    def simple_fraction_to_float(match):
        try:
            num = int(match.group(1))
            den = int(match.group(2))
            result = num / den
            return str(round(result, 2)).rstrip('0').rstrip('.')
        except (ValueError, ZeroDivisionError):
            return match.group(0)
    processed_text = re.sub(r'^\s*(\d+)/(\d+)\s*$', simple_fraction_to_float, processed_text)

    return processed_text

def list_recipes(request):
    recipes = Recipe.objects.all()
    return render(request, 'recipes/recipe_list.html', {'recipes': recipes})

def view_recipe(request, pk):
    recipe = get_object_or_404(Recipe, pk=pk)
    return render(request, 'recipes/recipe_detail.html', {'recipe': recipe})

def create_recipe(request):
    if request.method == 'POST':
        form = RecipeForm(request.POST)
        formset = IngredientFormSet(request.POST)
        if form.is_valid() and formset.is_valid():
            recipe = form.save()
            formset.instance = recipe
            formset.save()
            return redirect('view_recipe', pk=recipe.pk)
    else:
        form = RecipeForm()
        formset = IngredientFormSet()
    return render(request, 'recipes/add_recipe.html', {'form': form, 'formset': formset})

def update_recipe(request, pk):
    recipe = get_object_or_404(Recipe, pk=pk)
    if request.method == 'POST':
        form = RecipeForm(request.POST, instance=recipe)
        formset = IngredientEditFormSet(request.POST, instance=recipe)
        if form.is_valid() and formset.is_valid():
            form.save()
            formset.save()
            return redirect('view_recipe', pk=recipe.pk)
    else:
        form = RecipeForm(instance=recipe)
        formset = IngredientEditFormSet(instance=recipe)
    return render(request, 'recipes/add_recipe.html', {'form': form, 'formset': formset})

def delete_recipe(request, pk):
    recipe = get_object_or_404(Recipe, pk=pk)
    if request.method == 'POST':
        recipe.delete()
        return redirect('list_recipes')
    return render(request, 'recipes/recipe_detail.html', {'recipe': recipe})

def create_shopping_list(request):
    shopping_list = []
    if request.method == 'POST':
        form = ShoppingListForm(request.POST)
        if form.is_valid():
            selected_recipes = form.cleaned_data['recipes']
            num_guests = form.cleaned_data['num_guests']
            
            merged_ingredients = {}

            for recipe in selected_recipes:
                scale_factor = num_guests / recipe.servings

                for ingredient in recipe.ingredient_set.all():
                    scaled_quantity = ingredient.quantity * scale_factor
                    ingredient_key = f"{ingredient.name.name}_{ingredient.unit}"
                    
                    if ingredient_key in merged_ingredients:
                        merged_ingredients[ingredient_key]['quantity'] += scaled_quantity
                    else:
                        merged_ingredients[ingredient_key] = {
                            'name': ingredient.name.name,
                            'quantity': scaled_quantity,
                            'unit': ingredient.unit,
                            'managed_ingredient': ingredient.name  # Pass the whole object
                        }
            
            shopping_list = list(merged_ingredients.values())
    else:
        form = ShoppingListForm()

    return render(request, 'recipes/shopping_list.html', {'form': form, 'shopping_list': shopping_list})

def manage_ingredients(request):
    """
    View to show and manage ingredients.
    """
    if request.method == 'POST':
        form = ManagedIngredientForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('manage_ingredients')
    else:
        form = ManagedIngredientForm()
    ingredients = ManagedIngredient.objects.all().order_by('name')
    return render(request, 'recipes/manage_ingredients.html', {'form': form, 'ingredients': ingredients})

def update_managed_ingredient(request, pk):
    """
    Edits a specific ingredient.
    """
    ingredient = get_object_or_404(ManagedIngredient, pk=pk)
    if request.method == 'POST':
        form = ManagedIngredientForm(request.POST, instance=ingredient)
        if form.is_valid():
            form.save()
            return redirect('manage_ingredients')
    else:
        form = ManagedIngredientForm(instance=ingredient)
    return render(request, 'recipes/edit_managed_ingredient.html', {'form': form})

def delete_managed_ingredient(request, pk):
    """
    Deletes a managed ingredient.
    If the request method is POST, the ingredient is deleted and redirects to manage ingredients.
    Otherwise, it redirects to manage ingredients without deleting.
    """
    ingredient = get_object_or_404(ManagedIngredient, pk=pk)
    if request.method == 'POST':
        ingredient.delete()
        return redirect('manage_ingredients')
    return redirect('manage_ingredients')

def autocomplete_ingredient(request):
    """
    Autocomplete for ingredients.
    Returns a JSON response with ingredient names matching the query.
    """
    query = request.GET.get('q', '')
    ingredients = ManagedIngredient.objects.filter(name__icontains=query).values('id', 'name')
    return JsonResponse(list(ingredients), safe=False)

def find_or_create_ingredient(name):
    """
    Finds a ManagedIngredient by name or prepares data for creation.
    Returns a dictionary with either the ingredient's ID or data for a new one.
    """
    try:
        # First, try an exact match (case-insensitive)
        ingredient = ManagedIngredient.objects.get(name__iexact=name)
        return {'id': ingredient.id, 'name': ingredient.name, 'action': 'match'}
    except ManagedIngredient.DoesNotExist:
        # If no exact match, suggest creating a new one
        return {'id': None, 'name': name, 'action': 'create'}

def create_managed_ingredient_from_recipe(request):
    if request.method == 'POST':
        ingredient_name = request.POST.get('name')
        if ingredient_name:
            ingredient, created = ManagedIngredient.objects.get_or_create(
                name__iexact=ingredient_name,
                defaults={'name': ingredient_name}
            )
            return JsonResponse({'id': ingredient.id, 'name': ingredient.name})
    return JsonResponse({'error': 'Invalid request'}, status=400)

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
