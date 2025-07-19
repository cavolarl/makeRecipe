document.addEventListener('DOMContentLoaded', function() {
    const addButton = document.getElementById('add-ingredient');
    const formsetContainer = document.getElementById('ingredient-formset-container');
    let totalForms = document.querySelector('#id_ingredient_set-TOTAL_FORMS');
    const emptyForm = document.getElementById('empty-form').innerHTML;

    addIngredientButton.addEventListener('click', function() {
        const totalFormsInput = document.getElementById('id_ingredient_set-TOTAL_FORMS');
        let formIdx = parseInt(totalFormsInput.value);
        
        const newFormHtml = emptyFormTemplate.replace(/__prefix__/g, formIdx);
        const newForm = document.createElement('div');
        newForm.innerHTML = newFormHtml;
        
        formsetContainer.appendChild(newForm.firstElementChild);
        totalFormsInput.value = formIdx + 1;
    });

    // Remove ingredient form
    formsetContainer.addEventListener('click', function(e) {
        if (e.target && e.target.classList.contains('remove-ingredient')) {
            const formToRemove = e.target.closest('.ingredient-form');
            if (formToRemove) {
                formToRemove.remove();
                // Optional: Update total forms count if needed for formset validation
                const totalFormsInput = document.getElementById('id_ingredient_set-TOTAL_FORMS');
                totalFormsInput.value = parseInt(totalFormsInput.value) - 1;
            }
        }
    });

    function attachAutocompleteListeners() {
        document.querySelectorAll('.autocomplete-ingredient').forEach(input => {
            input.addEventListener('input', function() {
                const query = this.value;
                const currentInput = this;
                const formRow = currentInput.closest('.ingredient-form');
                const hiddenSelect = formRow.querySelector('select[name$="-name"]'); // The actual select element

                if (query.length > 1) {
                    fetch(`/recipes/ingredients/autocomplete/?q=${query}`)
                        .then(response => response.json())
                        .then(data => {
                            // Clear previous suggestions
                            let suggestionsList = formRow.querySelector('.suggestions-list');
                            if (!suggestionsList) {
                                suggestionsList = document.createElement('ul');
                                suggestionsList.classList.add('suggestions-list', 'list-group', 'mt-1');
                                currentInput.parentNode.appendChild(suggestionsList);
                            }
                            suggestionsList.innerHTML = '';

                            data.forEach(item => {
                                const listItem = document.createElement('li');
                                listItem.classList.add('list-group-item', 'list-group-item-action');
                                listItem.textContent = item.name;
                                listItem.dataset.id = item.id;
                                listItem.addEventListener('click', function() {
                                    currentInput.value = item.name;
                                    // Set the selected option in the hidden select element
                                    const option = hiddenSelect.querySelector(`option[value="${item.id}"]`);
                                    if (option) {
                                        option.selected = true;
                                    } else {
                                        // If option doesn't exist, create it (for newly added ManagedIngredients)
                                        const newOption = document.createElement('option');
                                        newOption.value = item.id;
                                        newOption.textContent = item.name;
                                        newOption.selected = true;
                                        hiddenSelect.appendChild(newOption);
                                    }
                                    suggestionsList.innerHTML = ''; // Clear suggestions
                                });
                                suggestionsList.appendChild(listItem);
                            });
                        });
                } else {
                    // Clear suggestions if query is too short
                    const suggestionsList = formRow.querySelector('.suggestions-list');
                    if (suggestionsList) {
                        suggestionsList.innerHTML = '';
                    }
                }
            });

            // Clear suggestions when input loses focus
            input.addEventListener('blur', function() {
                setTimeout(() => {
                    const suggestionsList = this.closest('.ingredient-form').querySelector('.suggestions-list');
                    if (suggestionsList) {
                        suggestionsList.innerHTML = '';
                    }
                }, 100);
            });
        });
    }

    attachAutocompleteListeners(); // Attach listeners on initial load
});