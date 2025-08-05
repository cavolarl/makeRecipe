from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from recipes.models import Recipe, Ingredient
from recipes.forms import RecipeForm, IngredientFormSet, ShoppingListForm


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

