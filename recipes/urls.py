from django.urls import path
from . import views

urlpatterns = [
    path('', views.recipe_list, name='recipe_list'),
    path('<int:pk>/', views.recipe_detail, name='recipe_detail'),
    path('add/', views.add_recipe, name='add_recipe'),
    path('<int:pk>/scale/', views.scale_recipe, name='scale_recipe'),
]