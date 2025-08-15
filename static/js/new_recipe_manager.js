/**
 * RecipeManager - Handles dynamic ingredient form management
 */
class RecipeManager {
    constructor() {
        this.ingredientsContainer = document.getElementById('ingredientsContainer');
        this.totalFormsInput = document.getElementById('id_ingredient_set-TOTAL_FORMS');
        this.addIngredientBtn = document.getElementById('addIngredientBtn');
        this.template = document.getElementById('ingredientFormTemplate');
        this.autocomplete = null;
        
        this.ingredientCache = new Map();
        
        this.initializeEventListeners();
        this.loadIngredientCache();
        
        console.log('RecipeManager initialized');
    }

    /**
     * Set the autocomplete instance
     */
    setAutocomplete(autocomplete) {
        this.autocomplete = autocomplete;
    }

    /**
     * Initialize event listeners
     */
    initializeEventListeners() {
        // Add ingredient button
        if (this.addIngredientBtn) {
            this.addIngredientBtn.addEventListener('click', () => {
                this.addIngredientForm();
            });
        }

        // Event delegation for ingredient form actions
        if (this.ingredientsContainer) {
            this.ingredientsContainer.addEventListener('click', (e) => {
                if (e.target.classList.contains('remove-ingredient-btn')) {
                    this.removeIngredientForm(e.target);
                } else if (e.target.classList.contains('create-ingredient-btn')) {
                    this.createNewIngredient(e.target);
                }
            });
        }
    }

    /**
     * Load ingredient cache from server
     */
    async loadIngredientCache() {
        try {
            const response = await fetch('/recipes/ingredients/autocomplete/');
            if (response.ok) {
                const ingredients = await response.json();
                ingredients.forEach(ingredient => {
                    this.ingredientCache.set(ingredient.name.toLowerCase(), ingredient);
                });
                console.log('Loaded ingredient cache:', this.ingredientCache.size, 'ingredients');
            }
        } catch (error) {
            console.error('Failed to load ingredient cache:', error);
        }
    }

    /**
     * Get current form count
     */
    getCurrentFormCount() {
        return parseInt(this.totalFormsInput?.value || '0');
    }

    /**
     * Update total forms count
     */
    updateFormCount(count) {
        if (this.totalFormsInput) {
            this.totalFormsInput.value = count;
        }
    }

    /**
     * Create a new ingredient form element
     */
    createIngredientFormElement(formIndex, data = {}) {
        if (!this.template) {
            console.error('Ingredient form template not found');
            return null;
        }

        // Clone the template
        const templateContent = this.template.content.cloneNode(true);
        const formElement = templateContent.querySelector('.ingredient-form');

        // Replace __prefix__ with actual form index
        this.updateFormPrefixes(formElement, formIndex);

        // Populate the form with data if provided
        this.populateIngredientForm(formElement, data);

        return formElement;
    }

    /**
     * Update form field prefixes
     */
    updateFormPrefixes(formElement, formIndex) {
        const elementsWithNames = formElement.querySelectorAll('[name*="__prefix__"]');
        elementsWithNames.forEach(element => {
            element.name = element.name.replace('__prefix__', formIndex);
            if (element.id) {
                element.id = element.id.replace('__prefix__', formIndex);
            }
        });

        const elementsWithFor = formElement.querySelectorAll('[for*="__prefix__"]');
        elementsWithFor.forEach(element => {
            element.setAttribute('for', element.getAttribute('for').replace('__prefix__', formIndex));
        });
    }

    /**
     * Populate ingredient form with data
     */
    populateIngredientForm(formElement, data) {
        const {
            id = null,
            name = '',
            quantity = '',
            unit = ''
        } = data;

        // Set autocomplete input
        const autocompleteInput = formElement.querySelector('.ingredient-autocomplete');
        if (autocompleteInput && name) {
            autocompleteInput.value = name;
        }

        // Set hidden select for managed ingredients
        const nameSelect = formElement.querySelector('select[name$="-name"]');
        if (nameSelect && id) {
            // Create option if it doesn't exist
            let option = nameSelect.querySelector(`option[value="${id}"]`);
            if (!option) {
                option = new Option(name, id, true, true);
                nameSelect.appendChild(option);
            }
            nameSelect.value = id;
        } else if (nameSelect && name && !id) {
            // Try to find in cache
            const cachedIngredient = this.ingredientCache.get(name.toLowerCase());
            if (cachedIngredient) {
                let option = nameSelect.querySelector(`option[value="${cachedIngredient.id}"]`);
                if (!option) {
                    option = new Option(cachedIngredient.name, cachedIngredient.id, true, true);
                    nameSelect.appendChild(option);
                }
                nameSelect.value = cachedIngredient.id;
            }
        }

        // Set quantity
        const quantityInput = formElement.querySelector('input[name$="-quantity"]');
        if (quantityInput && quantity) {
            quantityInput.value = quantity;
        }

        // Set unit
        const unitInput = formElement.querySelector('input[name$="-unit"]');
        if (unitInput && unit) {
            unitInput.value = unit;
        }
    }

    /**
     * Add a new ingredient form
     */
    addIngredientForm(data = {}) {
        const currentCount = this.getCurrentFormCount();
        const newFormElement = this.createIngredientFormElement(currentCount, data);
        
        if (newFormElement && this.ingredientsContainer) {
            this.ingredientsContainer.appendChild(newFormElement);
            this.updateFormCount(currentCount + 1);

            // Initialize autocomplete for the new form
            if (this.autocomplete) {
                const autocompleteInput = newFormElement.querySelector('.ingredient-autocomplete');
                if (autocompleteInput) {
                    this.autocomplete.initializeInput(autocompleteInput);
                }
            }

            console.log('Added ingredient form', currentCount);
            return newFormElement;
        }

        return null;
    }

    /**
     * Remove an ingredient form
     */
    removeIngredientForm(removeButton) {
        const formElement = removeButton.closest('.ingredient-form');
        if (!formElement) return;

        // Check if this is an existing record (has DELETE field)
        const deleteInput = formElement.querySelector('input[name$="-DELETE"]');
        if (deleteInput) {
            // Mark for deletion and hide
            deleteInput.checked = true;
            formElement.style.display = 'none';
        } else {
            // Remove entirely and update form count
            formElement.remove();
            const currentCount = this.getCurrentFormCount();
            this.updateFormCount(Math.max(0, currentCount - 1));
        }

        console.log('Removed ingredient form');
    }

    /**
     * Create a new managed ingredient
     */
    async createNewIngredient(createButton) {
        const formElement = createButton.closest('.ingredient-form');
        const autocompleteInput = formElement.querySelector('.ingredient-autocomplete');
        const ingredientName = autocompleteInput?.value?.trim();

        if (!ingredientName) {
            this.showFormMessage(formElement, 'Please enter an ingredient name first.', 'error');
            return;
        }

        try {
            const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;
            if (!csrfToken) {
                throw new Error('CSRF token not found');
            }

            const response = await fetch('/add-managed-ingredient/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRFToken': csrfToken
                },
                body: `name=${encodeURIComponent(ingredientName)}`
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.id && data.name) {
                // Add to cache
                this.ingredientCache.set(data.name.toLowerCase(), data);

                // Update the form
                const nameSelect = formElement.querySelector('select[name$="-name"]');
                if (nameSelect) {
                    const newOption = new Option(data.name, data.id, true, true);
                    nameSelect.appendChild(newOption);
                    nameSelect.value = data.id;
                }

                this.showFormMessage(formElement, `Created '${data.name}' successfully!`, 'success');
            } else {
                throw new Error(data.error || 'Failed to create ingredient');
            }

        } catch (error) {
            console.error('Error creating ingredient:', error);
            this.showFormMessage(formElement, `Error: ${error.message}`, 'error');
        }
    }

    /**
     * Clear all ingredient forms
     */
    clearAllIngredients() {
        const forms = this.ingredientsContainer.querySelectorAll('.ingredient-form');
        forms.forEach(form => form.remove());
        this.updateFormCount(0);
        console.log('Cleared all ingredient forms');
    }

    /**
     * Add multiple ingredients from scraped data
     */
    addIngredientsFromData(ingredientsData) {
        if (!Array.isArray(ingredientsData)) {
            console.error('Invalid ingredients data:', ingredientsData);
            return;
        }

        this.clearAllIngredients();

        ingredientsData.forEach((ingredient, index) => {
            const formData = this.parseIngredientData(ingredient);
            this.addIngredientForm(formData);
        });

        console.log('Added', ingredientsData.length, 'ingredients from scraped data');
    }

    /**
     * Parse ingredient data from scraper response
     */
    parseIngredientData(ingredient) {
        const data = {
            id: null,
            name: '',
            quantity: '',
            unit: ''
        };

        // Handle managed ingredient
        if (ingredient.managed_ingredient) {
            const managed = ingredient.managed_ingredient;
            if (managed.id) {
                data.id = managed.id;
                data.name = managed.name;
            } else if (managed.name) {
                data.name = managed.name;
            }
        }

        // Fallback to original name
        if (!data.name) {
            data.name = ingredient.original_name || ingredient.name || '';
        }

        // Handle quantity (can be object or simple value)
        if (ingredient.quantity) {
            if (typeof ingredient.quantity === 'object') {
                data.quantity = ingredient.quantity.source || 
                              ingredient.quantity.parsedValue?.toString() || '';
            } else {
                data.quantity = ingredient.quantity.toString();
            }
        }

        // Handle unit
        data.unit = ingredient.unit || '';

        return data;
    }

    /**
     * Show a message for a specific form
     */
    showFormMessage(formElement, message, type = 'info') {
        // Remove existing messages
        const existingMessage = formElement.querySelector('.form-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Create new message
        const messageDiv = document.createElement('div');
        messageDiv.className = `form-message alert alert-${type} mt-2`;
        messageDiv.innerHTML = `<span class="text-sm">${message}</span>`;

        // Add to form
        formElement.appendChild(messageDiv);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 3000);
    }

    /**
     * Get all ingredient form data
     */
    getAllIngredientData() {
        const forms = this.ingredientsContainer.querySelectorAll('.ingredient-form');
        const data = [];

        forms.forEach(form => {
            const nameSelect = form.querySelector('select[name$="-name"]');
            const autocompleteInput = form.querySelector('.ingredient-autocomplete');
            const quantityInput = form.querySelector('input[name$="-quantity"]');
            const unitInput = form.querySelector('input[name$="-unit"]');

            data.push({
                managedId: nameSelect?.value || null,
                name: autocompleteInput?.value || '',
                quantity: quantityInput?.value || '',
                unit: unitInput?.value || ''
            });
        });

        return data;
    }
}