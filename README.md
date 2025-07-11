# makeRecipe

`makeRecipe` is a Django-based web application designed to help users manage their recipes, ingredients, and generate shopping lists.

## Features

- **Recipe Management**: Users can add, view, edit, and delete recipes.
- **Centralized Ingredient Management**: A dedicated section to manage a canonical list of ingredients, preventing duplicates like "red onion" and "onion red".
- **Dynamic Ingredient Forms**: When adding or editing recipes, ingredient fields can be dynamically added or removed.
- **Ingredient Autocomplete**: Ingredient input fields provide autocomplete suggestions from the centralized ingredient list for faster and more consistent data entry.
- **Shopping List Generator**: Combine multiple recipes and specify the number of guests to generate a comprehensive shopping list with scaled ingredient quantities.
- **Recipe Scaling**: Scale recipe ingredient quantities based on desired servings.
- **Bootstrap Styling**: A clean and responsive user interface powered by Bootstrap.

## Setup and Installation for development

1. **Clone the repository**:

    ```bash
    git clone <repository_url>
    cd makeRecipe
    ```

2. **Create and activate a virtual environment**:

    ```bash
    python -m venv venv
    # On Windows:
    .\venv\Scripts\activate
    # On macOS/Linux:
    source venv/bin/activate
    ```

3. **Install dependencies**:

    ```bash
    pip install -r requirements.txt
    ```

4. **Apply database migrations**:

    ```bash
    python manage.py makemigrations
    python manage.py migrate
    ```

5. **Collect static files**:

    ```bash
    python manage.py collectstatic
    ```

6. **Run the development server**:

    ```bash
    python manage.py runserver
    ```

7. **Access the application**: Open your web browser and go to `http://127.0.0.1:8000/recipes/`

## Usage

- **Recipes**: Navigate to the `/recipes/` page to view, add, edit, or delete recipes.
- **Ingredients**: Use the "Ingredients" menu item to manage your master list of ingredients.
- **Shopping List**: Use the "Shopping List" menu item to generate a combined purchasing list from selected recipes.
