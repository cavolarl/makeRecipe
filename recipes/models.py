from django.db import models

class Recipe(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    servings = models.IntegerField()

    def __str__(self):
        return self.title

class Ingredient(models.Model):
    name = models.CharField(max_length=200)
    quantity = models.FloatField()
    unit = models.CharField(max_length=50)
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE)

    def __str__(self):
        return self.name