from django.db import migrations

def link_existing_ingredients(apps, schema_editor):
    Ingredient = apps.get_model('recipes', 'Ingredient')
    ManagedIngredient = apps.get_model('recipes', 'ManagedIngredient')

    for ingredient in Ingredient.objects.all():
        # Get or create ManagedIngredient based on the old name
        managed_ingredient, created = ManagedIngredient.objects.get_or_create(name=ingredient.name)
        # Assign the ManagedIngredient instance to the ingredient's name field
        ingredient.name = managed_ingredient
        ingredient.save()

class Migration(migrations.Migration):

    dependencies = [
        ('recipes', '0003_managedingredient'),
    ]

    operations = [
        migrations.RunPython(link_existing_ingredients, migrations.RunPython.noop),
    ]