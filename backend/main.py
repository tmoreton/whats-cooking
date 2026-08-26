"""AgentCore entrypoint for the "What's Cooking?" demo.

A Strands agent, deployed on Amazon Bedrock AgentCore Runtime via the
BedrockAgentCoreApp starter-toolkit pattern. It receives a base64 photo of a
fridge/pantry plus dietary preferences and a mode, then returns structured
recipe suggestions conforming to RecipeResponse.

Run locally:  agentcore dev      ->  POST http://localhost:8080/invocations
Deploy:       agentcore launch
"""

import base64
import binascii
import logging
from pathlib import Path

from bedrock_agentcore.runtime import BedrockAgentCoreApp
from strands import Agent
from strands.models import BedrockModel

from models import RecipeResponse

# Cap the number of images per request to keep payloads and latency sane.
MAX_IMAGES = 6

logger = logging.getLogger("whats-cooking")
logging.basicConfig(level=logging.INFO)

# Cross-region inference profile ID (us. prefix) for higher availability.
MODEL_ID = "us.anthropic.claude-sonnet-4-20250514-v1:0"

# Load the system prompt authored alongside this file.
_SYSTEM_PROMPT = (Path(__file__).parent / "system_prompt.txt").read_text(encoding="utf-8")

# Build the model and agent once at module load (reused across invocations).
# maxTokens is set explicitly to avoid over-reserving quota (ThrottlingException).
_model = BedrockModel(
    model_id=MODEL_ID,
    max_tokens=4096,
    temperature=0.7,
)

_agent = Agent(
    model=_model,
    system_prompt=_SYSTEM_PROMPT,
)

app = BedrockAgentCoreApp()


def _image_format(data: bytes) -> str:
    """Detect the Bedrock Converse image format from a byte signature."""
    if data[:3] == b"\xff\xd8\xff":
        return "jpeg"
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return "png"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "webp"
    if data[:6] in (b"GIF87a", b"GIF89a"):
        return "gif"
    return "jpeg"  # sensible default — the app sends JPEG


def _empty_response(message: str) -> dict:
    """Return a friendly, well-formed RecipeResponse when we have no image to work with."""
    return RecipeResponse(
        identified_ingredients=[],
        recipes=[],
        fun_fact=(
            "The word 'recipe' comes from the Latin 'recipere', meaning 'to receive' -- "
            "originally a doctor's instruction before it ever meant cooking!"
        ),
        message=message,
    ).model_dump()


@app.entrypoint
def invoke(payload: dict) -> dict:
    """AgentCore entrypoint.

    Expected payload:
        {
          "image": "<base64-encoded PNG, no data: prefix>",
          "preferences": {"vegetarian": false, "vegan": false, "glutenFree": false},
          "mode": "normal" | "surprise"
        }

    Returns a RecipeResponse serialized to a plain dict.
    """
    payload = payload or {}

    # 1. Defensively read fields.
    preferences = payload.get("preferences") or {}
    mode = payload.get("mode") or "normal"
    if mode not in ("normal", "surprise"):
        mode = "normal"

    vegetarian = bool(preferences.get("vegetarian", False))
    vegan = bool(preferences.get("vegan", False))
    gluten_free = bool(preferences.get("glutenFree", False))

    # Accept a list of images ("images") or a single legacy "image".
    raw_images = payload.get("images")
    if raw_images is None and payload.get("image"):
        raw_images = [payload["image"]]
    if not isinstance(raw_images, list) or not raw_images:
        return _empty_response(
            "I couldn't find a photo to look at! Snap a well-lit picture of your "
            "open fridge, pantry, or spice cabinet and I'll whip up some ideas."
        )

    # 2. Decode each base64 image into bytes for the Converse multimodal blocks.
    #    The client sends JPEG (smaller payloads); detect the real format from
    #    the magic bytes so PNG/JPEG/WebP/GIF all work regardless of the client.
    image_blocks = []
    for item in raw_images[:MAX_IMAGES]:
        if not isinstance(item, str) or not item:
            continue
        try:
            data = base64.b64decode(item, validate=True)
        except (binascii.Error, ValueError):
            continue
        if data:
            fmt = _image_format(data)
            image_blocks.append({"image": {"format": fmt, "source": {"bytes": data}}})

    if not image_blocks:
        return _empty_response(
            "Those photos didn't decode cleanly. Please send base64-encoded images "
            "(no data: prefix) and I'll take another look."
        )

    # 3. Build the multimodal user message: image block + instruction text block.
    prefs_lines = []
    if vegan:
        prefs_lines.append("- VEGAN: absolutely no animal products (no meat, fish, eggs, dairy, honey).")
    elif vegetarian:
        prefs_lines.append("- VEGETARIAN: no meat, poultry, or fish (eggs and dairy are fine).")
    if gluten_free:
        prefs_lines.append("- GLUTEN-FREE: no wheat, barley, or rye (no regular pasta, bread, or flour).")
    prefs_text = "\n".join(prefs_lines) if prefs_lines else "- No dietary restrictions."

    mode_text = (
        "Mode is SURPRISE: lead with the most creative, unexpected, delightful dish "
        "you can reasonably cook from these ingredients."
        if mode == "surprise"
        else "Mode is NORMAL: suggest the 3 most practical, achievable recipes."
    )

    instruction = (
        f"Here {'are' if len(image_blocks) > 1 else 'is'} {len(image_blocks)} "
        f"photo{'s' if len(image_blocks) > 1 else ''} of my fridge/pantry/spice cabinet. "
        "Identify every ingredient you can see across all of them "
        "(with a high/medium/low confidence for each), then invent 3 recipes ranked by how "
        "few extra ingredients I'd need to buy. For each recipe mark which ingredients are "
        "already visible in the photos (available) versus need-to-buy, and make sure "
        "missing_count exactly equals the number of unavailable ingredients.\n\n"
        f"Dietary preferences:\n{prefs_text}\n\n"
        f"{mode_text}\n\n"
        "If you can barely see anything, say so kindly in the message. If the fridge is "
        "essentially empty, return a funny takeout-humor message and an empty recipes list."
    )

    content = [*image_blocks, {"text": instruction}]

    # 4. Invoke the Strands agent with structured output so the return conforms
    #    to RecipeResponse, and return it as a plain dict.
    try:
        result: RecipeResponse = _agent.structured_output(RecipeResponse, content)
    except Exception:  # noqa: BLE001 - surface a friendly response, log the detail
        logger.exception("Agent invocation failed")
        return _empty_response(
            "My kitchen brain hiccuped while looking at that photo. Please try again "
            "in a moment!"
        )

    return result.model_dump()


if __name__ == "__main__":
    # Starts the AgentCore HTTP server (health on /ping, invoke on /invocations,
    # port 8080). `agentcore dev` uses this entrypoint for local runs.
    app.run()
