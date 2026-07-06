# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import logging
import os


def _is_vertex_ai_mode() -> bool:
    """Returns True if the app is configured to use Vertex AI (GCP credentials required)."""
    return os.environ.get("GOOGLE_GENAI_USE_VERTEXAI", "false").lower() in ("true", "1")


def setup_telemetry() -> str | None:
    """Configure GenAI prompt/response logging via OpenTelemetry.

    On GCP (GOOGLE_GENAI_USE_VERTEXAI=True), enables Cloud Trace spans.
    On local dev / when running with a plain API key, telemetry is a no-op.
    """
    os.environ.setdefault("ADK_CAPTURE_MESSAGE_CONTENT_IN_SPANS", "false")

    # Only enable Agent Engine telemetry when running on GCP with Vertex AI.
    # Enabling it without GCP credentials causes google.auth.default() to crash.
    if _is_vertex_ai_mode():
        os.environ.setdefault("GOOGLE_CLOUD_AGENT_ENGINE_ENABLE_TELEMETRY", "true")
    else:
        os.environ.setdefault("GOOGLE_CLOUD_AGENT_ENGINE_ENABLE_TELEMETRY", "false")

    bucket = os.environ.get("LOGS_BUCKET_NAME")
    capture_content = os.environ.get(
        "OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT", "false"
    )
    if bucket and capture_content != "false":
        logging.info(
            "Prompt-response logging enabled - mode: NO_CONTENT (metadata only, no prompts/responses)"
        )
        os.environ["OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT"] = "NO_CONTENT"
        os.environ.setdefault("OTEL_INSTRUMENTATION_GENAI_UPLOAD_FORMAT", "jsonl")
        os.environ.setdefault("OTEL_INSTRUMENTATION_GENAI_COMPLETION_HOOK", "upload")
        os.environ.setdefault(
            "OTEL_SEMCONV_STABILITY_OPT_IN", "gen_ai_latest_experimental"
        )
        commit_sha = os.environ.get("COMMIT_SHA", "dev")
        os.environ.setdefault(
            "OTEL_RESOURCE_ATTRIBUTES",
            f"service.namespace=krishimitra-ai,service.version={commit_sha}",
        )
        path = os.environ.get("GENAI_TELEMETRY_PATH", "completions")
        os.environ.setdefault(
            "OTEL_INSTRUMENTATION_GENAI_UPLOAD_BASE_PATH",
            f"gs://{bucket}/{path}",
        )
    else:
        logging.info(
            "Prompt-response logging disabled "
            "(set LOGS_BUCKET_NAME=gs://your-bucket and "
            "OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT=NO_CONTENT to enable)"
        )

    return bucket


def setup_agent_engine_telemetry() -> None:
    """Install the Agent Engine tracer provider (traces/logs to the customer project).

    Tags spans with the reasoningEngine resource. The OTel resource is fixed at
    provider creation, so this must run before get_fast_api_app to set the tags.

    This is a **no-op** unless all of the following conditions are met:
    - GOOGLE_CLOUD_AGENT_ENGINE_ENABLE_TELEMETRY = true (set by setup_telemetry when on Vertex AI)
    - GOOGLE_GENAI_USE_VERTEXAI = true (GCP/Vertex AI mode)
    - GCP Application Default Credentials are available

    On local dev (plain Gemini API key), this function exits immediately.
    """
    enabled = os.environ.get("GOOGLE_CLOUD_AGENT_ENGINE_ENABLE_TELEMETRY", "").lower()
    if enabled not in ("true", "1"):
        return

    # Additional guard: skip entirely if not in Vertex AI mode.
    if not _is_vertex_ai_mode():
        return

    try:
        import google.auth
        from vertexai.agent_engines.templates.adk import _default_instrumentor_builder

        _, project_id = google.auth.default()
        _default_instrumentor_builder(
            project_id, enable_tracing=True, enable_logging=True
        )
    except Exception as exc:
        logging.warning(
            "Agent Engine telemetry could not be initialized (continuing without it): %s",
            exc,
        )
