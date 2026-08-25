"""API Gateway (HTTP API) -> Lambda proxy for the "What's Cooking?" app.

The mobile app POSTs { image, preferences, mode } here. AgentCore runtimes are
only reachable via the SigV4 `InvokeAgentRuntime` data-plane API, so this Lambda
signs the call with its execution role and streams the runtime's RecipeResponse
straight back to the client.
"""

import base64
import json
import logging
import os
import uuid

import boto3
from botocore.config import Config

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Adaptive retries + a modest per-call timeout make the proxy resilient to
# transient Bedrock throttling and slow model calls without runaway retries.
_boto_cfg = Config(retries={"max_attempts": 3, "mode": "adaptive"}, read_timeout=28)
_client = boto3.client("bedrock-agentcore", config=_boto_cfg)
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

    if not isinstance(payload, dict) or not (payload.get("images") or payload.get("image")):
        return _resp(400, {"message": "Missing 'images' (base64 PNGs) in the request body."})

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
    except Exception:  # noqa: BLE001 - return a friendly error, log detail
        logger.exception("invoke_agent_runtime failed")
        return _resp(502, {"message": "The recipe service is unavailable right now. Please try again in a moment."})

    # The runtime already returns a RecipeResponse JSON; pass it straight through.
    body = data.decode("utf-8") if isinstance(data, (bytes, bytearray)) else str(data)
    return {"statusCode": 200, "headers": _CORS, "body": body}
