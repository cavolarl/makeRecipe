# makeRecipe

`makeRecipe` is a Django-based web application designed to help users manage their recipes, with a strong focus on recipe scraping and creating shopping lists.

## Features

- **Recipe Management**: Users can add, view, edit, and delete recipes.
- **Web Scraping**: Easily import recipes from various websites. The application uses `BeautifulSoup` and `Playwright` to scrape recipe data.
- **Shopping List Generator**: Combine multiple recipes and specify the number of guests to generate a comprehensive shopping list with scaled ingredient quantities.
- **Recipe Scaling**: Scale recipe ingredient quantities based on desired servings.
- **Dynamic Ingredient Forms**: When adding or editing recipes, ingredient fields can be dynamically added or removed.
- **Ingredient Autocomplete**: Ingredient input fields provide autocomplete suggestions from the centralized ingredient list for faster and more consistent data entry.

## Setup and Installation for development

1. **Clone the repository**:

    ```bash
    git clone <repository_url>
    cd makeRecipe
    ```

2. **Choose your package manager and follow the steps:**

   ### Using `uv`

    a. **Create a virtual environment and install dependencies**:

    ```bash
    # Create the virtual environment
    uv venv

    # Activate the environment
    # On Windows:
    .\.venv\Scripts\activate
    # On macOS/Linux:
    source .venv/bin/activate

    # Sync dependencies from the lock file
    uv pip sync requirements.txt
    ```

   ### Using `pip`

    a. **Create and activate a virtual environment**:

    ```bash
    python -m venv venv
    # On Windows:
    .\venv\Scripts\activate
    # On macOS/Linux:
    source venv/bin/activate
    ```

    b. **Install dependencies**:

    ```bash
    pip install -r requirements.txt
    ```

3. **Apply database migrations**:

    ```bash
    python manage.py makemigrations
    python manage.py migrate
    ```

4. **Collect static files**:

    ```bash
    python manage.py collectstatic
    ```

5. **Run the development server**:

    ```bash
    python manage.py runserver
    ```

6. **Access the application**: Open your web browser and go to `http://127.0.0.1:8000/recipes/`

## Usage

- **Recipes**: Navigate to the `/recipes/` page to view, add, edit, or delete recipes.
- **Scrape Recipes**: Use the "Scrape" feature to import recipes from other websites.
- **Shopping List**: Use the "Shopping List" menu item to generate a combined purchasing list from selected recipes.
