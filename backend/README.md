# What's Cooking? — Backend

A [Strands](https://strandsagents.com/) agent deployed on **Amazon Bedrock AgentCore Runtime**.
It takes a base64 photo of your fridge/pantry, identifies the ingredients with a
vision model, and returns recipe suggestions tailored to your dietary preferences.

## Architecture

- `main.py` — AgentCore entrypoint (`BedrockAgentCoreApp` + `@app.entrypoint`). Builds the
  multimodal Bedrock Converse message (image + instruction) and runs the Strands agent with
  structured output.
- `models.py` — the shared Pydantic data contract (`RecipeResponse` and friends). The frontend
  depends on these shapes exactly.
- `system_prompt.txt` — the agent's system prompt.
- `recipe_tools.py` — a Strands `@tool` (`search_recipes`) that ranks a curated recipe DB by
  ingredient overlap.
- `recipes.json` — ~50 curated real home-cooking recipes.

Model: `us.anthropic.claude-sonnet-4-20250514-v1:0` (cross-region inference profile).

## Prerequisites

- Python 3.12+
- AWS credentials configured with Bedrock model access enabled in your region
  (`aws bedrock list-foundation-models`).
- `pip install -r requirements.txt`

## Run locally

```bash
pip install -r requirements.txt
agentcore dev
```

This serves the agent at `http://localhost:8080` (health on `/ping`, invocation on
`/invocations`). Test it:

```bash
curl -X POST http://localhost:8080/invocations \
  -H "Content-Type: application/json" \
  -d '{
        "image": "<base64-encoded PNG, no data: prefix>",
        "preferences": {"vegetarian": false, "vegan": false, "glutenFree": false},
        "mode": "normal"
      }'
```

## Deploy to production

```bash
agentcore configure --entrypoint main.py   # first time only
agentcore launch
```

`agentcore launch` builds an ARM64 container, pushes it to ECR, and creates/updates the
AgentCore Runtime + endpoint. Invoke the deployed agent with `agentcore invoke '<json-payload>'`
or via the `bedrock-agentcore` data-plane API.

## Endpoint contract

### Request payload

```json
{
  "image": "<base64-encoded PNG string, NO data: prefix>",
  "preferences": { "vegetarian": false, "vegan": false, "glutenFree": false },
  "mode": "normal"
}
```

- `image` — required. Base64 PNG, no `data:` prefix.
- `preferences` — optional; any subset of `vegetarian`, `vegan`, `glutenFree` (defaults to `false`).
- `mode` — `"normal"` (practical picks) or `"surprise"` (most creative dish first). Defaults to `"normal"`.

### Response (`RecipeResponse`)

```json
{
  "identified_ingredients": [
    { "name": "eggs", "confidence": "high" }
  ],
  "recipes": [
    {
      "title": "Veggie Omelette",
      "time_minutes": 15,
      "difficulty": "easy",
      "ingredients": [
        { "name": "eggs", "available": true },
        { "name": "bell pepper", "available": false }
      ],
      "steps": ["..."],
      "missing_count": 1
    }
  ],
  "fun_fact": "…",
  "message": "optional friendly note (empty-fridge humor or 'can't quite see')"
}
```

On a missing/blurry/empty photo the agent still returns a valid `RecipeResponse` with an
encouraging `message` and an empty or minimal `recipes` list.
