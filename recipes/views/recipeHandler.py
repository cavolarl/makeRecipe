from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from recipes.models import Recipe, Ingredient
from recipes.forms import RecipeForm, IngredientFormSet, IngredientEditFormSet


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