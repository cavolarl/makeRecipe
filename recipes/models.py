from django.db import models

class Recipe(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    servings = models.IntegerField()

    def __str__(self):
        return self.title

class ManagedIngredient(models.Model):
    name = models.CharField(max_length=200, unique=True)

    def __str__(self):
        return self.name

class Ingredient(models.Model):
    UNIT_CHOICES = [
        ('g', 'gram'),
        ('kg', 'kilogram'),
        ('liter', 'liter'),
        ('dl', 'deciliter'),
        ('cl', 'centiliter'),
        ('ml', 'milliliter'),
        ('krm', 'kryddmått'),
        ('tsk', 'tesked'),
        ('msk', 'matsked'),
    ]
    name = models.ForeignKey(ManagedIngredient, on_delete=models.PROTECT, related_name='ingredients')
    quantity = models.FloatField()
    unit = models.CharField(max_length=50, choices=UNIT_CHOICES)
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE)

    def __str__(self):
        return self.name