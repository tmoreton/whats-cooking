"""API Gateway (HTTP API) -> Lambda proxy for the "What's Cooking?" app.

The mobile app POSTs { image, preferences, mode } here. AgentCore runtimes are
only reachable via the SigV4 `InvokeAgentRuntime` data-plane API, so this Lambda
signs the call with its execution role and streams the runtime's RecipeResponse
straight back to the client.
"""

import base64
import json
import os
import uuid

import boto3

_client = boto3.client("bedrock-agentcore")
_ARN = os.environ["AGENT_RUNTIME_ARN"]
_QUALIFIER = os.environ.get("AGENT_QUALIFIER", "DEFAULT")

_CORS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
}


def _resp(status: int, body: dict) -> dict:
    return {"statusCode": status, "headers": _CORS, "body": json.dumps(body)}


def handler(event, context):
    # CORS preflight (harmless for native clients, handy for Expo web).
    method = (event.get("requestContext", {}).get("http", {}) or {}).get("method")
    if method == "OPTIONS":
        return _resp(200, {})

    raw = event.get("body") or "{}"
    if event.get("isBase64Encoded"):
        raw = base64.b64decode(raw).decode("utf-8")

    try:
        payload = json.loads(raw)
    except (ValueError, TypeError):
        return _resp(400, {"message": "Body must be valid JSON: { image, preferences, mode }."})

    if not isinstance(payload, dict) or not payload.get("image"):
        return _resp(400, {"message": "Missing 'image' (base64 PNG) in the request body."})

    # AgentCore requires a runtimeSessionId of >= 33 chars. The agent is
    # stateless per request, so a fresh id per call is fine.
    session_id = payload.pop("sessionId", None) or f"whatscooking-{uuid.uuid4().hex}"
    if len(session_id) < 33:
        session_id = f"whatscooking-{uuid.uuid4().hex}"

    try:
        result = _client.invoke_agent_runtime(
            agentRuntimeArn=_ARN,
            runtimeSessionId=session_id,
            qualifier=_QUALIFIER,
            contentType="application/json",
            payload=json.dumps(payload).encode("utf-8"),
        )
        data = result["response"].read()
    except Exception as exc:  # noqa: BLE001 - return a friendly error, log detail
        print(f"invoke_agent_runtime failed: {exc!r}")
        return _resp(502, {"message": "The recipe service is unavailable right now. Please try again in a moment."})

    # The runtime already returns a RecipeResponse JSON; pass it straight through.
    body = data.decode("utf-8") if isinstance(data, (bytes, bytearray)) else str(data)
    return {"statusCode": 200, "headers": _CORS, "body": body}
