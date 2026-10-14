
const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const recipeContainer = document.getElementById("recipe-container");
const statusMessage = document.getElementById("status");

const modal = document.getElementById("recipe-modal");
const recipeDetails = document.getElementById("recipe-details");
const closeModalButton = document.getElementById("close-modal");

const API_URL =
    "https://www.themealdb.com/api/json/v1/1/";

let searchNumber = 0;

function getFavorites() {
    try {
        return JSON.parse(
            localStorage.getItem("favoriteRecipes") || "[]"
        );
    } catch {
        return [];
    }
}

function setStatus(message) {
    statusMessage.textContent = message;
}

function createRecipeCard(meal) {
    const card = document.createElement("article");
    card.className = "recipe-card";

    const image = document.createElement("img");
    image.src = meal.strMealThumb;
    image.alt = meal.strMeal;
    image.loading = "lazy";

    const info = document.createElement("div");
    info.className = "recipe-info";

    const title = document.createElement("h3");
    title.textContent = meal.strMeal;

    const actions = document.createElement("div");
    actions.className = "recipe-actions";

    const viewButton = document.createElement("button");
    viewButton.className = "view-button";
    viewButton.textContent = "View Recipe";
    viewButton.addEventListener("click", () => {
        showRecipe(meal.idMeal);
    });

    const favoriteButton = document.createElement("button");
    favoriteButton.className = "favorite-button";

    function updateFavoriteButton() {
        const isFavorite = getFavorites().includes(meal.idMeal);

        favoriteButton.textContent = isFavorite
            ? "❤️ Saved"
            : "♡ Favorite";

        favoriteButton.setAttribute(
            "aria-pressed",
            String(isFavorite)
        );
    }

    favoriteButton.addEventListener("click", () => {
        const favorites = getFavorites();
        const index = favorites.indexOf(meal.idMeal);

        if (index === -1) {
            favorites.push(meal.idMeal);
        } else {
            favorites.splice(index, 1);
        }

        localStorage.setItem(
            "favoriteRecipes",
            JSON.stringify(favorites)
        );

        updateFavoriteButton();
    });

    updateFavoriteButton();

    actions.append(viewButton, favoriteButton);
    info.append(title, actions);
    card.append(image, info);

    return card;
}

async function searchRecipes(query) {
    const currentSearch = ++searchNumber;

    recipeContainer.replaceChildren();
    setStatus("Searching for recipes...");

    try {
        const response = await fetch(
            `${API_URL}search.php?s=${encodeURIComponent(query)}`
        );

        if (!response.ok) {
            throw new Error("Unable to connect to the recipe service.");
        }

        const data = await response.json();

        if (currentSearch !== searchNumber) return;

        const meals = data.meals || [];

        if (meals.length === 0) {
            setStatus("No recipes found. Try another dish!");
            return;
        }

        const fragment = document.createDocumentFragment();

        meals.forEach(meal => {
            fragment.appendChild(createRecipeCard(meal));
        });

        recipeContainer.appendChild(fragment);

        setStatus(`${meals.length} recipe(s) found.`);
    } catch (error) {
        if (currentSearch !== searchNumber) return;

        setStatus(
            "Could not load recipes. Check your internet connection and try again."
        );
    }
}

async function showRecipe(id) {
    recipeDetails.replaceChildren();
    modal.hidden = false;
    setStatus("Loading recipe details...");

    const loadingMessage = document.createElement("p");
    loadingMessage.textContent = "Loading recipe details...";
    recipeDetails.appendChild(loadingMessage);

    try {
        const response = await fetch(
            `${API_URL}lookup.php?i=${encodeURIComponent(id)}`
        );

        if (!response.ok) {
            throw new Error("Unable to load recipe details.");
        }

        const data = await response.json();
        const meal = data.meals?.[0];

        if (!meal) {
            throw new Error("Recipe not found.");
        }

        recipeDetails.replaceChildren();

        const title = document.createElement("h2");
        title.textContent = meal.strMeal;

        const image = document.createElement("img");
        image.src = meal.strMealThumb;
        image.alt = meal.strMeal;

        const category = document.createElement("p");
        category.textContent =
            `Category: ${meal.strCategory || "Not specified"}`;

        const area = document.createElement("p");
        area.textContent =
            `Cuisine: ${meal.strArea || "Not specified"}`;

        const ingredientsTitle = document.createElement("h3");
        ingredientsTitle.textContent = "Ingredients";

        const ingredientsList = document.createElement("ul");

        for (let i = 1; i <= 20; i++) {
            const ingredient = meal[`strIngredient${i}`]?.trim();
            const measure = meal[`strMeasure${i}`]?.trim();

            if (ingredient) {
                const item = document.createElement("li");
                item.textContent = `${ingredient} — ${measure || "As needed"}`;
                ingredientsList.appendChild(item);
            }
        }

        const instructionsTitle = document.createElement("h3");
        instructionsTitle.textContent = "Cooking Instructions";

        const instructions = document.createElement("p");
        instructions.textContent =
            meal.strInstructions || "No instructions available.";

        recipeDetails.append(
            title,
            image,
            category,
            area,
            ingredientsTitle,
            ingredientsList,
            instructionsTitle,
            instructions
        );

        setStatus("");
    } catch (error) {
        recipeDetails.replaceChildren();

        const errorMessage = document.createElement("p");
        errorMessage.textContent =
            "Unable to load this recipe. Please try again.";

        recipeDetails.appendChild(errorMessage);
    }
}

searchForm.addEventListener("submit", event => {
    event.preventDefault();

    const query = searchInput.value.trim();

    if (query) {
        searchRecipes(query);
    }
});

closeModalButton.addEventListener("click", () => {
    modal.hidden = true;
});

modal.addEventListener("click", event => {
    if (event.target === modal) {
        modal.hidden = true;
    }
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        modal.hidden = true;
    }
});

// Load sample recipes when the website opens.
searchRecipes("chicken");

