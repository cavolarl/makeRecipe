document.addEventListener('DOMContentLoaded', function() {
    const scrapeButton = document.getElementById('scrape-button');
    const recipeUrlInput = document.getElementById('recipe-url');
    const statusDiv = document.getElementById('scraper-status');
    const formsetContainer = document.getElementById('ingredient-formset-container');
    const addIngredientButton = document.getElementById('add-ingredient');
    const emptyForm = document.getElementById('empty-form').innerHTML;

    scrapeButton.addEventListener('click', function() {
        const url = recipeUrlInput.value;
        if (!url) {
            statusDiv.textContent = 'Please enter a URL.';
            return;
        }

        statusDiv.textContent = 'Scraping...';

        fetch(`/scrape-recipe/?url=${encodeURIComponent(url)}`)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    statusDiv.textContent = `Error: ${data.error}`;
                    return;
                }

                statusDiv.textContent = 'Scraping successful!';
                populateIngredients(data.ingredients);
            })
            .catch(error => {
                statusDiv.textContent = `Error: ${error}`;
            });
    });

    function populateIngredients(ingredients) {
        // Clear existing non-management forms
        const existingForms = formsetContainer.querySelectorAll('.ingredient-form');
        existingForms.forEach(form => form.remove());

        let totalForms = 0;
        ingredients.forEach((ingredient, index) => {
            let newFormHtml = emptyForm.replace(/__prefix__/g, index);
            let newForm = document.createElement('div');
            newForm.innerHTML = newFormHtml;
            newForm.classList.add('ingredient-form', 'mb-3', 'p-3', 'border', 'rounded', 'bg-light');

            const nameInput = newForm.querySelector('[id$="-name"]');
            const quantityInput = newForm.querySelector('[id$="-quantity"]');
            const unitInput = newForm.querySelector('[id$="-unit"]');

            if (nameInput) {
                nameInput.value = ingredient.name; // This is now the ManagedIngredient ID
            }
            if (quantityInput) {
                quantityInput.value = ingredient.quantity;
            }
            if (unitInput) {
                unitInput.value = ingredient.unit;
            }

            formsetContainer.appendChild(newForm);
            totalForms++;
        });

        // Update the management form
        const totalFormsInput = document.getElementById('id_ingredient_set-TOTAL_FORMS');
        if (totalFormsInput) {
            totalFormsInput.value = totalForms;
        }
    }
});