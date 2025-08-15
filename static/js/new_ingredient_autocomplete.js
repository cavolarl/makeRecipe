/**
 * IngredientAutocomplete - Handles ingredient name autocomplete functionality
 */
class IngredientAutocomplete {
    constructor() {
        this.debounceDelay = 300;
        this.minQueryLength = 2;
        this.cache = new Map();
        
        this.initializeExistingInputs();
        
        console.log('IngredientAutocomplete initialized');
    }

    /**
     * Initialize autocomplete for existing inputs
     */
    initializeExistingInputs() {
        const existingInputs = document.querySelectorAll('.ingredient-autocomplete');
        existingInputs.forEach(input => this.initializeInput(input));
    }

    /**
     * Initialize autocomplete for a single input
     */
    initializeInput(input) {
        if (input.dataset.autocompleteInitialized) {
            return;
        }

        input.dataset.autocompleteInitialized = 'true';
        
        let debounceTimer;
        
        // Input event for search
        input.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                this.handleInputChange(e.target);
            }, this.debounceDelay);
        });

        // Focus event to show cached results
        input.addEventListener('focus', (e) => {
            if (e.target.value.length >= this.minQueryLength) {
                this.handleInputChange(e.target);
            }
        });

        // Blur event to hide suggestions (with delay for click handling)
        input.addEventListener('blur', (e) => {
            setTimeout(() => {
                this.hideSuggestions(e.target);
            }, 200);
        });

        // Keyboard navigation
        input.addEventListener('keydown', (e) => {
            this.handleKeyNavigation(e);
        });

        console.log('Initialized autocomplete for input');
    }

    /**
     * Handle input change
     */
    async handleInputChange(input) {
        const query = input.value.trim();
        
        if (query.length < this.minQueryLength) {
            this.hideSuggestions(input);
            return;
        }

        try {
            const suggestions = await this.fetchSuggestions(query);
            this.showSuggestions(input, suggestions);
        } catch (error) {
            console.error('Error fetching suggestions:', error);
            this.hideSuggestions(input);
        }
    }

    /**
     * Fetch suggestions from server or cache
     */
    async fetchSuggestions(query) {
        const cacheKey = query.toLowerCase();
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        // Fetch from server
        const response = await fetch(`/recipes/ingredients/autocomplete/?q=${encodeURIComponent(query)}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const suggestions = await response.json();
        
        // Cache the results
        this.cache.set(cacheKey, suggestions);
        
        // Limit cache size
        if (this.cache.size > 100) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        return suggestions;
    }

    /**
     * Show suggestions dropdown
     */
    showSuggestions(input, suggestions) {
        this.hideSuggestions(input);

        if (!suggestions || suggestions.length === 0) {
            return;
        }

        const formElement = input.closest('.ingredient-form');
        const container = formElement.querySelector('.suggestions-container');
        
        if (!container) {
            console.error('Suggestions container not found');
            return;
        }

        // Create suggestions dropdown
        const dropdown = document.createElement('div');
        dropdown.className = 'suggestions-dropdown absolute z-50 w-full bg-base-100 shadow-lg rounded-lg border border-base-300 mt-1';
        dropdown.innerHTML = this.buildSuggestionsHTML(suggestions);

        // Position and show
        container.appendChild(dropdown);

        // Add click handlers
        this.attachSuggestionClickHandlers(dropdown, input);

        console.log('Showing', suggestions.length, 'suggestions');
    }

    /**
     * Build HTML for suggestions
     */
    buildSuggestionsHTML(suggestions) {
        const suggestionItems = suggestions.map(suggestion => 
            `<div class="suggestion-item px-4 py-2 hover:bg-base-200 cursor-pointer border-b border-base-300 last:border-b-0" data-id="${suggestion.id}" data-name="${suggestion.name}">
                <span class="text-sm">${this.escapeHtml(suggestion.name)}</span>
            </div>`
        ).join('');

        return `
            <div class="suggestions-list max-h-48 overflow-y-auto">
                ${suggestionItems}
            </div>
        `;
    }

    /**
     * Attach click handlers to suggestions
     */
    attachSuggestionClickHandlers(dropdown, input) {
        const suggestionItems = dropdown.querySelectorAll('.suggestion-item');
        
        suggestionItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const id = item.dataset.id;
                const name = item.dataset.name;
                
                this.selectSuggestion(input, id, name);
                this.hideSuggestions(input);
            });
        });
    }

    /**
     * Select a suggestion
     */
    selectSuggestion(input, id, name) {
        // Update the autocomplete input
        input.value = name;

        // Update the hidden select
        const formElement = input.closest('.ingredient-form');
        const nameSelect = formElement.querySelector('select[name$="-name"]');
        
        if (nameSelect) {
            // Check if option exists
            let option = nameSelect.querySelector(`option[value="${id}"]`);
            if (!option) {
                // Create new option
                option = new Option(name, id, true, true);
                nameSelect.appendChild(option);
            }
            nameSelect.value = id;
        }

        // Trigger change event
        input.dispatchEvent(new Event('change', { bubbles: true }));

        console.log('Selected suggestion:', name, 'ID:', id);
    }

    /**
     * Hide suggestions
     */
    hideSuggestions(input) {
        const formElement = input.closest('.ingredient-form');
        if (!formElement) return;

        const container = formElement.querySelector('.suggestions-container');
        if (!container) return;

        const dropdown = container.querySelector('.suggestions-dropdown');
        if (dropdown) {
            dropdown.remove();
        }
    }

    /**
     * Handle keyboard navigation
     */
    handleKeyNavigation(e) {
        const input = e.target;
        const formElement = input.closest('.ingredient-form');
        const dropdown = formElement?.querySelector('.suggestions-dropdown');
        
        if (!dropdown) return;

        const items = dropdown.querySelectorAll('.suggestion-item');
        if (items.length === 0) return;

        let currentIndex = -1;
        
        // Find currently highlighted item
        items.forEach((item, index) => {
            if (item.classList.contains('bg-primary')) {
                currentIndex = index;
            }
        });

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.highlightSuggestion(items, Math.min(currentIndex + 1, items.length - 1));
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                this.highlightSuggestion(items, Math.max(currentIndex - 1, 0));
                break;
                
            case 'Enter':
                e.preventDefault();
                if (currentIndex >= 0 && items[currentIndex]) {
                    items[currentIndex].click();
                }
                break;
                
            case 'Escape':
                e.preventDefault();
                this.hideSuggestions(input);
                break;
        }
    }

    /**
     * Highlight a suggestion item
     */
    highlightSuggestion(items, index) {
        // Remove existing highlighting
        items.forEach(item => {
            item.classList.remove('bg-primary', 'text-primary-content');
        });

        // Add highlighting to selected item
        if (items[index]) {
            items[index].classList.add('bg-primary', 'text-primary-content');
            items[index].scrollIntoView({ block: 'nearest' });
        }
    }

    /**
     * Escape HTML for safe rendering
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        console.log('Autocomplete cache cleared');
    }

    /**
     * Get cache stats
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}