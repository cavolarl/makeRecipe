from django import forms
from django.forms import inlineformset_factory
from .models import Recipe, Ingredient, ManagedIngredient

class RecipeForm(forms.ModelForm):
    class Meta:
        model = Recipe
        fields = ['title', 'description', 'servings']

class IngredientForm(forms.ModelForm):
    class Meta:
        model = Ingredient
        fields = ['name', 'quantity', 'unit']

IngredientFormSet = inlineformset_factory(Recipe, Ingredient, form=IngredientForm, extra=1, can_delete=False)
IngredientEditFormSet = inlineformset_factory(Recipe, Ingredient, form=IngredientForm, extra=1, can_delete=True)

class ShoppingListForm(forms.Form):
    recipes = forms.ModelMultipleChoiceField(
        queryset=Recipe.objects.all(),
        widget=forms.CheckboxSelectMultiple,
        label="Select Recipes"
    )
    num_guests = forms.IntegerField(
        min_value=1,
        initial=1,
        label="Number of Guests"
    )

class ManagedIngredientForm(forms.ModelForm):
    class Meta:
        model = ManagedIngredient
        fields = ['name', 'common_denonyms', 'container_sizes', 'weight_to_volume_conversion', 'category', 'notes']