from django.shortcuts import render, get_object_or_404, redirect
from .models import Recipe, Ingredient

def recipe_list(request):
    recipes = Recipe.objects.all()
    return render(request, 'recipes/recipe_list.html', {'recipes': recipes})

def recipe_detail(request, pk):
    recipe = get_object_or_404(Recipe, pk=pk)
    return render(request, 'recipes/recipe_detail.html', {'recipe': recipe})

def add_recipe(request):
    if request.method == 'POST':
        title = request.POST['title']
        description = request.POST['description']
        servings = request.POST['servings']
        recipe = Recipe.objects.create(title=title, description=description, servings=servings)
        return redirect('recipe_detail', pk=recipe.pk)
    return render(request, 'recipes/add_recipe.html')

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