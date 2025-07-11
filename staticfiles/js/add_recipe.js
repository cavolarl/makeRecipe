document.addEventListener('DOMContentLoaded', function() {
    const addButton = document.getElementById('add-ingredient');
    const formsetContainer = document.getElementById('ingredient-formset-container');
    let totalForms = document.querySelector('#id_ingredient_set-TOTAL_FORMS');
    const emptyForm = document.getElementById('empty-form').innerHTML;

    addButton.addEventListener('click', function() {
        const currentFormsCount = parseInt(totalForms.value);
        const newFormHtml = emptyForm.replace(/__prefix__/g, currentFormsCount);
        const newFormDiv = document.createElement('div');
        newFormDiv.innerHTML = newFormHtml;

        // Remove the hidden 'id' input field from the new form, as it's for a new object
        const idInput = newFormDiv.querySelector(`[name$="-id"]`);
        if (idInput) {
            idInput.remove();
        }

        // Insert the new form before the add button
        addButton.before(newFormDiv.firstElementChild);

        totalForms.value = currentFormsCount + 1;
        attachAutocompleteListeners(); // Attach listeners to new form
    });

    // Event delegation for remove buttons
    formsetContainer.addEventListener('click', function(event) {
        if (event.target.classList.contains('remove-ingredient')) {
            const formToRemove = event.target.closest('.ingredient-form');
            if (formToRemove) {
                formToRemove.remove();
                totalForms.value = parseInt(totalForms.value) - 1;

                // Re-index forms after removal
                const forms = document.querySelectorAll('.ingredient-form');
                forms.forEach((form, index) => {
                    form.querySelectorAll('*').forEach(element => {
                        if (element.name) {
                            element.name = element.name.replace(/-\d+-/, `-${index}-`);
                        }
                        if (element.id) {
                            element.id = element.id.replace(/_\d+_/, `_${index}_`);
                        }
                    });
                });
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