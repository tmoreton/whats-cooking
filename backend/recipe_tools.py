"""Strands tool for ranking curated recipes against identified ingredients.

Uses only the Python standard library: recipes are scored with a simple
token-overlap (Jaccard-style) similarity between the identified ingredients
and each recipe's ingredient list.
"""

import json
import re
from pathlib import Path
from typing import List

from strands import tool

# Load the curated recipe database once at import time.
_RECIPES_PATH = Path(__file__).parent / "recipes.json"
with _RECIPES_PATH.open("r", encoding="utf-8") as _f:
    _RECIPES = json.load(_f)

# Common cooking staples we treat as "usually on hand" so they don't
# unfairly inflate the missing count when the user didn't photograph them.
_ASSUMED_STAPLES = {
    "salt",
    "pepper",
    "black pepper",
    "water",
    "oil",
    "olive oil",
    "cooking oil",
    "vegetable oil",
}

# Tiny stopword list so "canned tomatoes" matches "tomato", etc.
_STOPWORDS = {"canned", "fresh", "dried", "ground", "of", "and", "the", "a"}


def _tokenize(text: str) -> set:
    """Break an ingredient name into a set of normalized, singularized tokens."""
    tokens = set()
    for raw in re.split(r"[^a-z]+", text.lower()):
        if not raw or raw in _STOPWORDS:
            continue
        # Naive singularization so "tomatoes"/"tomato" and "eggs"/"egg" match.
        if raw.endswith("ies") and len(raw) > 4:
            raw = raw[:-3] + "y"
        elif raw.endswith("es") and len(raw) > 3:
            raw = raw[:-2]
        elif raw.endswith("s") and len(raw) > 3:
            raw = raw[:-1]
        tokens.add(raw)
    return tokens


def _ingredient_matches(recipe_ingredient: str, pantry_tokens: set) -> bool:
    """True if any token of the recipe ingredient is present in the pantry tokens."""
    return bool(_tokenize(recipe_ingredient) & pantry_tokens)


@tool
def search_recipes(ingredients: List[str]) -> List[dict]:
    """Rank curated recipes by how well they match the ingredients on hand.

    Given a list of ingredient names identified in a fridge/pantry photo, this
    searches a curated database of ~50 real home-cooking recipes and returns the
    best matches, scored by token-overlap similarity between the provided
    ingredients and each recipe's ingredient list.

    Args:
        ingredients: List of ingredient names identified in the photo, e.g.
            ["eggs", "milk", "bread", "cheese", "tomatoes"]. Case-insensitive;
            plurals and simple qualifiers (e.g. "canned tomatoes") are handled.

    Returns:
        A list of up to 8 recipe dicts, ranked best-match first. Each dict
        contains the original recipe fields (title, time_minutes, difficulty,
        ingredients, steps) plus these computed fields:
          - match_score (float): Jaccard-style similarity in [0, 1] between the
            pantry ingredients and the recipe's ingredients (higher = better).
          - available_ingredients (list[str]): recipe ingredients found in the
            photo (or safe assumed staples like salt/pepper/oil).
          - missing_ingredients (list[str]): recipe ingredients NOT found in the
            photo, i.e. what the user would need to buy.
          - missing_count (int): number of missing_ingredients. Use this to rank
            recipes by fewest additional ingredients needed and to populate the
            recipe's missing_count field.
    """
    pantry_tokens = set()
    for item in ingredients or []:
        pantry_tokens |= _tokenize(item)

    scored = []
    for recipe in _RECIPES:
        recipe_ingredients = recipe["ingredients"]
        available = []
        missing = []
        for ing in recipe_ingredients:
            if _ingredient_matches(ing, pantry_tokens) or ing.lower() in _ASSUMED_STAPLES:
                available.append(ing)
            else:
                missing.append(ing)

        # Jaccard similarity over the token sets of both ingredient lists.
        recipe_tokens = set()
        for ing in recipe_ingredients:
            recipe_tokens |= _tokenize(ing)
        union = pantry_tokens | recipe_tokens
        intersection = pantry_tokens & recipe_tokens
        match_score = (len(intersection) / len(union)) if union else 0.0

        enriched = dict(recipe)
        enriched["match_score"] = round(match_score, 3)
        enriched["available_ingredients"] = available
        enriched["missing_ingredients"] = missing
        enriched["missing_count"] = len(missing)
        scored.append(enriched)

    # Rank by: most available ingredients, then fewest missing, then similarity.
    scored.sort(
        key=lambda r: (len(r["available_ingredients"]), -r["missing_count"], r["match_score"]),
        reverse=True,
    )
    return scored[:8]
