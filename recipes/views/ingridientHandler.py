from recipes.models import ManagedIngredient
from recipes.forms import ManagedIngredientForm
from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse


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