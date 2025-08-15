/**
 * RecipeScraper - Handles recipe URL scraping and form population
 */
class RecipeScraper {
    constructor(recipeManager) {
        this.recipeManager = recipeManager;
        this.urlInput = document.getElementById('recipeUrl');
        this.importBtn = document.getElementById('importBtn');
        this.importSpinner = document.getElementById('importSpinner');
        this.importBtnText = document.getElementById('importBtnText');
        this.statusContainer = document.getElementById('statusContainer');
        this.statusAlert = document.getElementById('statusAlert');
        this.statusIcon = document.getElementById('statusIcon');
        this.statusMessage = document.getElementById('statusMessage');
        
        this.isImporting = false;
        
        this.initializeEventListeners();
        this.initializeUrlValidation();
        
        console.log('RecipeScraper initialized');
    }

    /**
     * Initialize event listeners
     */
    initializeEventListeners() {
        if (this.importBtn) {
            this.importBtn.addEventListener('click', () => {
                this.handleImportClick();
            });
        }

        if (this.urlInput) {
            this.urlInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleImportClick();
                }
            });

            this.urlInput.addEventListener('input', () => {
                this.validateUrl();
            });
        }
    }

    /**
     * Initialize URL validation
     */
    initializeUrlValidation() {
        this.supportedDomains = [
            'ica.se',
            'koket.se'
        ];
    }

    /**
     * Validate URL input
     */
    validateUrl() {
        const url = this.urlInput?.value?.trim();
        
        if (!url) {
            this.setImportButtonState(false, 'Import Recipe');
            return false;
        }

        try {
            const urlObj = new URL(url);
            const isSupported = this.supportedDomains.some(domain => 
                urlObj.hostname.includes(domain)
            );

            if (isSupported) {
                this.setImportButtonState(true, 'Import Recipe');
                return true;
            } else {
                this.setImportButtonState(false, 'Unsupported Site');
                return false;
            }
        } catch {
            this.setImportButtonState(false, 'Invalid URL');
            return false;
        }
    }

    /**
     * Set import button state
     */
    setImportButtonState(enabled, text) {
        if (this.importBtn && this.importBtnText) {
            this.importBtn.disabled = !enabled || this.isImporting;
            this.importBtnText.textContent = text;
            
            if (enabled && !this.isImporting) {
                this.importBtn.classList.remove('btn-disabled');
                this.importBtn.classList.add('btn-primary');
            } else {
                this.importBtn.classList.add('btn-disabled');
                this.importBtn.classList.remove('btn-primary');
            }
        }
    }

    /**
     * Handle import button click
     */
    async handleImportClick() {
        if (this.isImporting) return;

        const url = this.urlInput?.value?.trim();
        if (!url || !this.validateUrl()) {
            this.showStatus('Please enter a valid recipe URL from ICA or Koket.', 'error');
            return;
        }

        await this.importRecipe(url);
    }

    /**
     * Import recipe from URL
     */
    async importRecipe(url) {
        this.setImportingState(true);
        this.showStatus('Importing recipe...', 'info');

        try {
            // Import both recipe details and ingredients in parallel
            const [detailsResult, ingredientsResult] = await Promise.allSettled([
                this.fetchRecipeDetails(url),
                this.fetchRecipeIngredients(url)
            ]);

            // Handle results
            let hasErrors = false;

            // Process recipe details
            if (detailsResult.status === 'fulfilled' && !detailsResult.value.error) {
                this.populateRecipeDetails(detailsResult.value);
                console.log('Recipe details imported successfully');
            } else {
                console.error('Failed to import recipe details:', 
                    detailsResult.status === 'rejected' ? detailsResult.reason : detailsResult.value.error);
                hasErrors = true;
            }

            // Process ingredients
            if (ingredientsResult.status === 'fulfilled' && !ingredientsResult.value.error) {
                this.populateIngredients(ingredientsResult.value);
                console.log('Recipe ingredients imported successfully');
            } else {
                console.error('Failed to import ingredients:', 
                    ingredientsResult.status === 'rejected' ? ingredientsResult.reason : ingredientsResult.value.error);
                hasErrors = true;
            }

            // Show final status
            if (hasErrors) {
                this.showStatus('Recipe imported with some errors. Please check the form.', 'warning');
            } else {
                this.showStatus('Recipe imported successfully!', 'success');
            }

        } catch (error) {
            console.error('Import failed:', error);
            this.showStatus(`Import failed: ${error.message}`, 'error');
        } finally {
            this.setImportingState(false);
        }
    }

    /**
     * Fetch recipe details
     */
    async fetchRecipeDetails(url) {
        const response = await fetch(`/scrape-recipe-details/?url=${encodeURIComponent(url)}`);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch recipe details (${response.status})`);
        }

        return await response.json();
    }

    /**
     * Fetch recipe ingredients
     */
    async fetchRecipeIngredients(url) {
        const response = await fetch(`/scrape-recipe/?url=${encodeURIComponent(url)}`);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch recipe ingredients (${response.status})`);
        }

        return await response.json();
    }

    /**
     * Populate recipe details form
     */
    populateRecipeDetails(data) {
        const fieldMappings = {
            'id_title': data.title,
            'id_description': data.description,
            'id_servings': data.servings
        };

        Object.entries(fieldMappings).forEach(([fieldId, value]) => {
            if (value !== undefined && value !== null) {
                const field = document.getElementById(fieldId);
                if (field) {
                    field.value = value;
                    console.log(`Set ${fieldId} to:`, value);
                }
            }
        });
    }

    /**
     * Populate ingredients
     */
    populateIngredients(data) {
        if (!data.ingredients || !Array.isArray(data.ingredients)) {
            console.error('Invalid ingredients data:', data);
            throw new Error('Invalid ingredients data received');
        }

        if (data.ingredients.length === 0) {
            console.warn('No ingredients found in recipe');
            return;
        }

        // Use the recipe manager to add ingredients
        this.recipeManager.addIngredientsFromData(data.ingredients);
        
        console.log('Populated', data.ingredients.length, 'ingredients');
    }

    /**
     * Set importing state
     */
    setImportingState(importing) {
        this.isImporting = importing;

        if (this.importSpinner) {
            if (importing) {
                this.importSpinner.classList.remove('hidden');
            } else {
                this.importSpinner.classList.add('hidden');
            }
        }

        if (importing) {
            this.setImportButtonState(false, 'Importing...');
        } else {
            this.validateUrl();
        }
    }

    /**
     * Show status message
     */
    showStatus(message, type = 'info') {
        if (!this.statusContainer || !this.statusAlert || !this.statusIcon || !this.statusMessage) {
            console.error('Status elements not found');
            return;
        }

        // Update alert classes
        this.statusAlert.className = `alert alert-${type}`;

        // Update icon
        this.statusIcon.innerHTML = this.getStatusIcon(type);

        // Update message
        this.statusMessage.textContent = message;

        // Show container
        this.statusContainer.classList.remove('hidden');

        // Auto-hide success and info messages
        if (type === 'success' || type === 'info') {
            setTimeout(() => {
                this.hideStatus();
            }, 5000);
        }

        console.log(`Status (${type}):`, message);
    }

    /**
     * Hide status message
     */
    hideStatus() {
        if (this.statusContainer) {
            this.statusContainer.classList.add('hidden');
        }
    }

    /**
     * Get status icon based on type
     */
    getStatusIcon(type) {
        const icons = {
            success: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>`,
            error: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>`,
            warning: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>`,
            info: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M12 21a9 9 0 100-18 9 9 0 000 18z" />
            </svg>`
        };

        return icons[type] || icons.info;
    }

    /**
     * Clear form
     */
    clearForm() {
        // Clear URL input
        if (this.urlInput) {
            this.urlInput.value = '';
        }

        // Clear recipe details
        const recipeFields = ['id_title', 'id_description', 'id_servings'];
        recipeFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.value = '';
            }
        });

        // Clear ingredients
        this.recipeManager.clearAllIngredients();

        // Hide status
        this.hideStatus();

        console.log('Form cleared');
    }

    /**
     * Get supported domains
     */
    getSupportedDomains() {
        return [...this.supportedDomains];
    }
}