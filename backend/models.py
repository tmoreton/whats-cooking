"""Shared Pydantic data contract for the "What's Cooking?" backend.

These models define the exact response shape the frontend depends on.
Do NOT change field names or types without updating the frontend in lockstep.
"""

from typing import List, Optional, Literal

from pydantic import BaseModel


class IdentifiedIngredient(BaseModel):
    """A single ingredient the agent spotted in the photo."""

    name: str
    confidence: Literal["high", "medium", "low"]


class Ingredient(BaseModel):
    """An ingredient required by a recipe, flagged for availability."""

    name: str
    available: bool  # True if seen in the photo, False if the user needs to buy it


class Recipe(BaseModel):
    """A single suggested recipe."""

    title: str
    time_minutes: int
    difficulty: Literal["easy", "medium", "hard"]
    ingredients: List[Ingredient]
    steps: List[str]
    missing_count: int  # number of recipe ingredients NOT visible in the photo


class RecipeResponse(BaseModel):
    """Top-level response returned by the AgentCore entrypoint."""

    identified_ingredients: List[IdentifiedIngredient]
    recipes: List[Recipe]
    fun_fact: str
    # Friendly note, e.g. empty-fridge humor or "can't quite see the photo".
    message: Optional[str] = None
