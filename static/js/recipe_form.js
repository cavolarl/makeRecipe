document.addEventListener('DOMContentLoaded', function() {
    // --- ELEMENTS ---
    const formsetContainer = document.getElementById('ingredient-formset-container');
    const emptyFormTemplate = document.getElementById('empty-form').innerHTML;
    const totalFormsInput = document.getElementById('id_ingredient_set-TOTAL_FORMS');
    const addIngredientButton = document.getElementById('add-ingredient');
    
    // Scraper elements
    const scrapeButton = document.getElementById('scrape-button');
    const recipeUrlInput = document.getElementById('recipe-url');
    const statusDiv = document.getElementById('scraper-status');

    let managedIngredientsCache = [];

    // --- INITIALIZATION ---
    function fetchManagedIngredients() {
        fetch('/recipes/ingredients/autocomplete/')
            .then(response => response.json())
            .then(data => {
                managedIngredientsCache = data;
            })
            .catch(error => console.error('Error fetching managed ingredients:', error));
    }
    fetchManagedIngredients();

    // --- SHARED FUNCTIONS ---
    function addIngredientForm(formIdx, id = null, name = '', quantity = '', unit = '') {
        const newFormHtml = emptyFormTemplate.replace(/__prefix__/g, formIdx);
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = newFormHtml;
        const newForm = tempDiv.firstElementChild;

        const autocompleteInput = newForm.querySelector('.autocomplete-ingredient');
        if (autocompleteInput) {
            autocompleteInput.value = name;
        }

        if (id) {
            const nameSelect = newForm.querySelector('select[name$="-name"]');
            if (nameSelect) {
                let option = nameSelect.querySelector(`option[value="${id}"]`);
                if (!option) {
                    option = new Option(name, id, true, true);
                    nameSelect.appendChild(option);
                }
                nameSelect.value = id;
            }
        }
        
        const quantityInput = newForm.querySelector('input[name$="-quantity"]');
        if (quantityInput && quantity) {
            quantityInput.value = quantity;
        }

        const unitInput = newForm.querySelector('input[name$="-unit"]');
        if (unitInput && unit) {
            unitInput.value = unit;
        }

        formsetContainer.appendChild(newForm);
    }

    function showStatus(message, type = 'info') {
        let alertColor = 'alert-info';
        let icon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" /></svg>`;

        if (type === 'success') {
            alertColor = 'alert-success';
            icon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
        } else if (type === 'error') {
            alertColor = 'alert-error';
            icon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>`;
        }

        statusDiv.innerHTML = `
            <div role="alert" class="alert ${alertColor}">
                ${icon}
                <span>${message}</span>
            </div>
        `;
        statusDiv.classList.remove('hidden');
    }

    // --- EVENT LISTENERS ---
    if (scrapeButton) {
        scrapeButton.addEventListener('click', function() {
            const url = recipeUrlInput.value;
            if (!url) {
                showStatus('Please enter a URL.', 'error');
                return;
            }
            showStatus('Scraping...');

            fetch(`/scrape-recipe-details/?url=${encodeURIComponent(url)}`)
                .then(response => response.json())
                .then(data => {
                    if (data.error) console.error('Details Error:', data.error);
                    if (data.title) document.getElementById('id_title').value = data.title;
                    if (data.description) document.getElementById('id_description').value = data.description;
                    if (data.servings) document.getElementById('id_servings').value = data.servings;
                });

            fetch(`/scrape-recipe/?url=${encodeURIComponent(url)}`)
                .then(response => response.json())
                .then(data => {
                    if (data.error) {
                        showStatus(`Error: ${data.error}`, 'error');
                        return;
                    }
                    
                    let formIdx = parseInt(totalFormsInput.value);
                    data.ingredients.forEach(ingredient => {
                        const managed = ingredient.managed_ingredient;
                        if (managed) {
                            addIngredientForm(formIdx, managed.id, managed.name, ingredient.quantity, ingredient.unit);
                        } else {
                            addIngredientForm(formIdx, null, ingredient.original_name, ingredient.quantity, ingredient.unit);
                        }
                        formIdx++;
                    });
                    totalFormsInput.value = formIdx;

                    showStatus(`Successfully added ${data.ingredients.length} ingredients.`, 'success');
                })
                .catch(error => {
                    showStatus(`An error occurred: ${error}`, 'error');
                });
        });
    }

    if (addIngredientButton) {
        addIngredientButton.addEventListener('click', function() {
            let formIdx = parseInt(totalFormsInput.value);
            addIngredientForm(formIdx);
            totalFormsInput.value = formIdx + 1;
        });
    }

    formsetContainer.addEventListener('click', function(e) {
        if (e.target && e.target.classList.contains('remove-ingredient')) {
            const formToRemove = e.target.closest('.ingredient-form');
            if (formToRemove) {
                const deleteInput = formToRemove.querySelector('input[name$="-DELETE"]');
                if (deleteInput) {
                    deleteInput.checked = true;
                    formToRemove.style.display = 'none';
                } else {
                    formToRemove.remove();
                }
            }
        }

        if (e.target && e.target.classList.contains('create-new-ingredient-btn')) {
            const formRow = e.target.closest('.ingredient-form');
            const autocompleteInput = formRow.querySelector('.autocomplete-ingredient');
            const ingredientName = autocompleteInput.value;
            
            if (!ingredientName) {
                showStatus('Please enter an ingredient name first.', 'error');
                return;
            }

            const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

            fetch('/add-managed-ingredient/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRFToken': csrfToken
                },
                body: `name=${encodeURIComponent(ingredientName)}`
            })
            .then(response => response.json())
            .then(data => {
                if (data.id && data.name) {
                    managedIngredientsCache.push({ id: data.id, name: data.name });
                    
                    const hiddenSelect = formRow.querySelector('select[name$="-name"]');
                    const newOption = new Option(data.name, data.id, true, true);
                    hiddenSelect.appendChild(newOption);
                    hiddenSelect.value = data.id;

                    showStatus(`Successfully created and selected '${data.name}'.`, 'success');
                } else {
                    showStatus(data.error || 'Could not create ingredient.', 'error');
                }
            })
            .catch(error => {
                showStatus(`An error occurred: ${error}`, 'error');
            });
        }
    });
});