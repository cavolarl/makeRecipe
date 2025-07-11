from django.shortcuts import render, get_object_or_404, redirect
from django.http import JsonResponse
from .models import Recipe, Ingredient, ManagedIngredient
from .forms import RecipeForm, IngredientFormSet, ShoppingListForm, ManagedIngredientForm, IngredientEditFormSet

def recipe_list(request):
    recipes = Recipe.objects.all()
    return render(request, 'recipes/recipe_list.html', {'recipes': recipes})

def recipe_detail(request, pk):
    recipe = get_object_or_404(Recipe, pk=pk)
    return render(request, 'recipes/recipe_detail.html', {'recipe': recipe})

def add_recipe(request):
    if request.method == 'POST':
        form = RecipeForm(request.POST)
        formset = IngredientFormSet(request.POST)
        if form.is_valid() and formset.is_valid():
            recipe = form.save()
            formset.instance = recipe
            formset.save()
            return redirect('recipe_detail', pk=recipe.pk)
    else:
        form = RecipeForm()
        formset = IngredientFormSet()
    return render(request, 'recipes/add_recipe.html', {'form': form, 'formset': formset})

def edit_recipe(request, pk):
    recipe = get_object_or_404(Recipe, pk=pk)
    if request.method == 'POST':
        form = RecipeForm(request.POST, instance=recipe)
        formset = IngredientEditFormSet(request.POST, instance=recipe)
        if form.is_valid() and formset.is_valid():
            form.save()
            formset.save()
            return redirect('recipe_detail', pk=recipe.pk)
    else:
        form = RecipeForm(instance=recipe)
        formset = IngredientEditFormSet(instance=recipe)
    return render(request, 'recipes/add_recipe.html', {'form': form, 'formset': formset})

def scale_recipe(request, pk):
    recipe = get_object_or_404(Recipe, pk=pk)
    if request.method == 'POST':
        scaled_servings = int(request.POST['servings'])
        scale_factor = scaled_servings / recipe.servings
        for ingredient in recipe.ingredient_set.all():
            ingredient.quantity *= scale_factor
        recipe.servings = scaled_servings
        return render(request, 'recipes/recipe_detail.html', {'recipe': recipe})
    return render(request, 'recipes/scale_recipe.html', {'recipe': recipe})

def delete_recipe(request, pk):
    recipe = get_object_or_404(Recipe, pk=pk)
    if request.method == 'POST':
        recipe.delete()
        return redirect('recipe_list')
    return render(request, 'recipes/recipe_detail.html', {'recipe': recipe}) # Or a confirmation page

def create_shopping_list(request):
    shopping_list = []
    if request.method == 'POST':
        form = ShoppingListForm(request.POST)
        if form.is_valid():
            selected_recipes = form.cleaned_data['recipes']
            num_guests = form.cleaned_data['num_guests']

            for recipe in selected_recipes:
                # Calculate scale factor based on recipe's servings and desired guests
                # Assuming recipe.servings is for a single serving or a base serving size
                # If recipe.servings is for a group, then adjust accordingly
                # For simplicity, let's assume recipe.servings is for a base unit of guests
                # and we want to scale it to num_guests
                scale_factor = num_guests / recipe.servings

                for ingredient in recipe.ingredient_set.all():
                    scaled_quantity = ingredient.quantity * scale_factor
                    shopping_list.append({
                        'name': ingredient.name.name, # Access the name from ManagedIngredient
                        'quantity': scaled_quantity,
                        'unit': ingredient.unit
                    })
    else:
        form = ShoppingListForm()

    return render(request, 'recipes/shopping_list.html', {'form': form, 'shopping_list': shopping_list})

def manage_ingredients(request):
    if request.method == 'POST':
        form = ManagedIngredientForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('manage_ingredients')
    else:
        form = ManagedIngredientForm()
    ingredients = ManagedIngredient.objects.all().order_by('name')
    return render(request, 'recipes/manage_ingredients.html', {'form': form, 'ingredients': ingredients})

def delete_managed_ingredient(request, pk):
    ingredient = get_object_or_404(ManagedIngredient, pk=pk)
    if request.method == 'POST':
        ingredient.delete()
        return redirect('manage_ingredients')
    return redirect('manage_ingredients')

def ingredient_autocomplete(request):
    query = request.GET.get('q', '')
    ingredients = ManagedIngredient.objects.filter(name__icontains=query).values('id', 'name')
    return JsonResponse(list(ingredients), safe=False)