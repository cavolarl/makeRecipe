from django.contrib import admin
from django.urls import path
from . import views

urlpatterns = [
    path('', views.list_recipes, name='list_recipes'),
    path('<int:pk>/', views.view_recipe, name='view_recipe'),
    path('add/', views.create_recipe, name='create_recipe'),
    path('<int:pk>/edit/', views.update_recipe, name='update_recipe'),
    path('<int:pk>/delete/', views.delete_recipe, name='delete_recipe'),
    path('shopping-list/', views.create_shopping_list, name='create_shopping_list'),
    path('ingredients/manage/', views.manage_ingredients, name='manage_ingredients'),
    path('ingredients/<int:pk>/edit/', views.update_managed_ingredient, name='update_managed_ingredient'),
    path('ingredients/delete/<int:pk>/', views.delete_managed_ingredient, name='delete_managed_ingredient'),
    path('ingredients/autocomplete/', views.autocomplete_ingredient, name='autocomplete_ingredient'),
    path('scrape-recipe/', views.scrape_recipe, name='scrape_recipe'),
    path('scrape-recipe-details/', views.scrape_recipe_details, name='scrape_recipe_details'),
    path('add-managed-ingredient/', views.create_managed_ingredient_from_recipe, name='create_managed_ingredient_from_recipe'),
]