from django.contrib import admin
from django.urls import path
from . import views

urlpatterns = [
    path('', views.recipe_list, name='recipe_list'),
    path('<int:pk>/', views.recipe_detail, name='recipe_detail'),
    path('add/', views.add_recipe, name='add_recipe'),
    path('<int:pk>/edit/', views.edit_recipe, name='edit_recipe'),
    path('<int:pk>/scale/', views.scale_recipe, name='scale_recipe'),
    path('<int:pk>/delete/', views.delete_recipe, name='delete_recipe'),
    path('shopping-list/', views.create_shopping_list, name='create_shopping_list'),
    path('ingredients/manage/', views.manage_ingredients, name='manage_ingredients'),
    path('ingredients/delete/<int:pk>/', views.delete_managed_ingredient, name='delete_managed_ingredient'),
    path('ingredients/autocomplete/', views.ingredient_autocomplete, name='ingredient_autocomplete'),
    path('scrape-recipe/', views.scrape_recipe, name='scrape_recipe'),
    path('add-managed-ingredient/', views.add_managed_ingredient_from_recipe, name='add_managed_ingredient_from_recipe'),
]