from django.db import models

class Recipe(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    servings = models.IntegerField()

    def __str__(self):
        return self.title

class ManagedIngredient(models.Model):
    name = models.CharField(max_length=200, unique=True)
    common_denonyms = models.JSONField(default=list, blank=True, help_text="List of common denonyms")
    weight_to_volume_conversion = models.FloatField(default=1.0, help_text="Grams per milliliter (g/ml)")
    category = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)


    def __str__(self):
        return self.name

class Ingredient(models.Model):
    UNIT_CHOICES = [
        ('g', 'gram'),
        ('kg', 'kilogram'),
        ('l', 'liter'),
        ('dl', 'deciliter'),
        ('cl', 'centiliter'),
        ('ml', 'milliliter'),
        ('krm', 'kryddmått'),
        ('tsk', 'tesked'),
        ('msk', 'matsked'),
        ('st', 'styck'),
    ]
    name = models.ForeignKey(ManagedIngredient, on_delete=models.PROTECT, related_name='ingredients')
    quantity = models.FloatField()
    unit = models.CharField(max_length=50, choices=UNIT_CHOICES)
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE)

    def __str__(self):
        return self.name.name