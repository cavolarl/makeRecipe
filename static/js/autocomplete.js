document.addEventListener('DOMContentLoaded', function() {
    const formsetContainer = document.getElementById('ingredient-formset-container');

    function attachAutocompleteTo(input) {
        if (input.dataset.listenerAttached) return;
        input.dataset.listenerAttached = 'true';

        input.addEventListener('input', function() {
            const query = this.value;
            const currentInput = this;
            const formRow = currentInput.closest('.ingredient-form');
            if (!formRow) return;

            const hiddenSelect = formRow.querySelector('select[name$="-name"]');
            if (!hiddenSelect) return;

            let suggestionsList = formRow.querySelector('.suggestions-list');
            if (suggestionsList) {
                suggestionsList.remove();
            }

            if (query.length < 2) {
                return;
            }

            fetch(`/recipes/ingredients/autocomplete/?q=${query}`)
                .then(response => response.json())
                .then(data => {
                    let existingList = formRow.querySelector('.suggestions-list');
                    if (existingList) {
                        existingList.remove();
                    }

                    if (data.length === 0) return;

                    suggestionsList = document.createElement('div');
                    suggestionsList.classList.add('suggestions-list', 'absolute', 'z-10', 'w-full', 'card', 'bg-base-200', 'shadow-xl', 'mt-1');
                    currentInput.parentNode.style.position = 'relative';
                    currentInput.parentNode.appendChild(suggestionsList);

                    const suggestionsMenu = document.createElement('ul');
                    suggestionsMenu.classList.add('menu', 'p-2');
                    suggestionsList.appendChild(suggestionsMenu);

                    data.forEach(item => {
                        const listItem = document.createElement('li');
                        listItem.innerHTML = `<a>${item.name}</a>`;
                        listItem.addEventListener('click', function(e) {
                            e.preventDefault();
                            currentInput.value = item.name;
                            
                            let option = hiddenSelect.querySelector(`option[value="${item.id}"]`);
                            if (!option) {
                                option = new Option(item.name, item.id, true, true);
                                hiddenSelect.appendChild(option);
                            }
                            option.selected = true;
                            
                            suggestionsList.remove();
                        });
                        suggestionsMenu.appendChild(listItem);
                    });
                });
        });

        input.addEventListener('blur', function() {
            setTimeout(() => {
                const suggestionsList = this.closest('.ingredient-form')?.querySelector('.suggestions-list');
                if (suggestionsList) {
                    suggestionsList.remove();
                }
            }, 200);
        });
    }

    formsetContainer.addEventListener('input', function(e) {
        if (e.target && e.target.classList.contains('autocomplete-ingredient')) {
            attachAutocompleteTo(e.target);
        }
    });

    document.querySelectorAll('.autocomplete-ingredient').forEach(attachAutocompleteTo);
});
