document.addEventListener('DOMContentLoaded', function() {
    const scrapeButton = document.getElementById('scrape-button');
    const recipeUrlInput = document.getElementById('recipe-url');
    const statusDiv = document.getElementById('scraper-status');
    const scrapedIngredientsContainer = document.getElementById('scraped-ingredients-container');
    const ingredientTemplate = document.getElementById('scraped-ingredient-template');
    const addScrapedToRecipeBtn = document.getElementById('add-scraped-to-recipe');
    const addScrapedContainer = document.getElementById('add-scraped-to-recipe-container');
    const emptyFormTemplate = document.getElementById('empty-form').innerHTML;

    let managedIngredientsCache = [];

    // Fetch all managed ingredients for the dropdown
    function fetchManagedIngredients() {
        fetch('/ingredients/autocomplete/')
            .then(response => response.json())
            .then(data => {
                managedIngredientsCache = data;
            });
    }
    fetchManagedIngredients();

    scrapeButton.addEventListener('click', function() {
        const url = recipeUrlInput.value;
        if (!url) {
            statusDiv.textContent = 'Please enter a URL.';
            return;
        }
        statusDiv.textContent = 'Scraping...';
        scrapedIngredientsContainer.innerHTML = '';
        addScrapedContainer.style.display = 'none';

        fetch(`/scrape-recipe/?url=${encodeURIComponent(url)}`)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    statusDiv.textContent = `Error: ${data.error}`;
                    return;
                }
                statusDiv.textContent = 'Scraping successful! Please review the ingredients below.';
                populateScrapedIngredients(data.ingredients);
                addScrapedContainer.style.display = 'block';
            })
            .catch(error => {
                statusDiv.textContent = `Error: ${error}`;
            });
    });

    function populateScrapedIngredients(ingredients) {
        ingredients.forEach(ingredient => {
            const clone = ingredientTemplate.content.cloneNode(true);
            const row = clone.querySelector('.scraped-ingredient-row');
            
            row.querySelector('.original-ingredient-name-input').value = ingredient.original_name;
            row.querySelector('.quantity-input').value = ingredient.quantity;
            row.querySelector('.unit-input').value = ingredient.unit;

            const select = row.querySelector('.managed-ingredient-select');
            
            const placeholder = document.createElement('option');
            placeholder.textContent = 'Select matching ingredient...';
            placeholder.value = '';
            select.appendChild(placeholder);

            managedIngredientsCache.forEach(managed => {
                const option = document.createElement('option');
                option.value = managed.id;
                option.textContent = managed.name;
                if (ingredient.managed_ingredient.action === 'match' && managed.id === ingredient.managed_ingredient.id) {
                    option.selected = true;
                }
                select.appendChild(option);
            });

            scrapedIngredientsContainer.appendChild(clone);
        });
    }

    scrapedIngredientsContainer.addEventListener('click', function(e) {
        if (e.target.classList.contains('create-new-managed-ingredient')) {
            const row = e.target.closest('.scraped-ingredient-row');
            const ingredientName = row.querySelector('.original-ingredient-name-input').value;
            
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
                if (data.id) {
                    managedIngredientsCache.push({ id: data.id, name: data.name });
                    const allSelects = document.querySelectorAll('.managed-ingredient-select');
                    allSelects.forEach(s => {
                        const newOption = document.createElement('option');
                        newOption.value = data.id;
                        newOption.textContent = data.name;
                        s.appendChild(newOption);
                    });
                    const currentRowSelect = row.querySelector('.managed-ingredient-select');
                    currentRowSelect.value = data.id;
                }
            });
        }
    });

    addScrapedToRecipeBtn.addEventListener('click', function() {
        const formsetContainer = document.getElementById('ingredient-formset-container');
        const totalFormsInput = document.getElementById('id_ingredient_set-TOTAL_FORMS');
        let formIdx = parseInt(totalFormsInput.value);

        const scrapedRows = scrapedIngredientsContainer.querySelectorAll('.scraped-ingredient-row');
        
        scrapedRows.forEach(row => {
            const selectedManagedId = row.querySelector('.managed-ingredient-select').value;
            if (!selectedManagedId) return;

            const quantity = row.querySelector('.quantity-input').value;
            const unit = row.querySelector('.unit-input').value;

            const newFormHtml = emptyFormTemplate.replace(/__prefix__/g, formIdx);
            const newForm = document.createElement('div');
            newForm.innerHTML = newFormHtml;
            
            const nameSelect = newForm.querySelector('select[id$="-name"]');
            const quantityInput = newForm.querySelector('input[id$="-quantity"]');
            const unitInput = newForm.querySelector('select[id$="-unit"]');

            let optionExists = Array.from(nameSelect.options).some(opt => opt.value == selectedManagedId);
            if (!optionExists) {
                const selectedManaged = managedIngredientsCache.find(i => i.id == selectedManagedId);
                if (selectedManaged) {
                    const newOption = new Option(selectedManaged.name, selectedManaged.id, true, true);
                    nameSelect.add(newOption);
                }
            }
            
            nameSelect.value = selectedManagedId;
            quantityInput.value = quantity;
            unitInput.value = unit;

            formsetContainer.appendChild(newForm.firstElementChild);
            formIdx++;
        });

        totalFormsInput.value = formIdx;
        
        scrapedIngredientsContainer.innerHTML = '';
        addScrapedContainer.style.display = 'none';
    });
});
