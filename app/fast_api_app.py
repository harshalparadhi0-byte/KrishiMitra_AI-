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

import contextlib
import logging
import os
from collections.abc import AsyncIterator
from typing import Any

from a2a.server.tasks import InMemoryTaskStore
from dotenv import load_dotenv
from fastapi import FastAPI
from google.adk.cli.fast_api import get_fast_api_app
from google.adk.runners import Runner
from pydantic import BaseModel

from app.app_utils import services
from app.app_utils.a2a import attach_a2a_routes
from app.app_utils.reasoning_engine_adapter import attach_reasoning_engine_routes
from app.app_utils.telemetry import setup_agent_engine_telemetry, setup_telemetry
from app.app_utils.typing import Feedback
from app.memory import MemoryManager

load_dotenv(override=True)

import os
print("ENV FILE LOADED")
print("ALLOW_ORIGINS =", os.getenv("ALLOW_ORIGINS"))
setup_telemetry()
# Must run before get_fast_api_app to set the tracer provider resource.
setup_agent_engine_telemetry()

# ---------------------------------------------------------------------------
# Logging setup — use Google Cloud Logging when running on GCP (INTEGRATION_TEST
# env var not set), fall back to standard Python logging for local dev/tests.
# ---------------------------------------------------------------------------

_py_logger = logging.getLogger(__name__)

# Try to initialise Cloud Logging; gracefully degrade to stdlib logger.
try:
    import google.auth
    from google.cloud import logging as google_cloud_logging

    _, _project_id = google.auth.default()
    _gcp_logging_client = google_cloud_logging.Client()
    _gcp_logger = _gcp_logging_client.logger(__name__)

    def _log_struct(data: dict, severity: str = "INFO") -> None:  # noqa: D401
        _gcp_logger.log_struct(data, severity=severity)

except Exception:
    # No GCP credentials available (local dev, unit tests, CI).
    def _log_struct(data: dict, severity: str = "INFO") -> None:  # noqa: D401
        _py_logger.info("Feedback: %s", data)


allow_origins = (
    os.getenv("ALLOW_ORIGINS", "").split(",") if os.getenv("ALLOW_ORIGINS") else None
)

AGENT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


@contextlib.asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """FastAPI lifespan: build Runner and attach A2A routes after env/telemetry setup."""
    from app.agent import app as adk_app
    from app.agent import root_agent

    runner = Runner(
        app=adk_app,
        session_service=services.get_session_service(),
        artifact_service=services.get_artifact_service(),
        auto_create_session=True,
    )
    # Shared runner used by A2A and reasoning_engine adapter routes.
    app.state.runner = runner
    app.state.agent_app_name = adk_app.name
    await attach_a2a_routes(
        app,
        agent=root_agent,
        runner=runner,
        task_store=InMemoryTaskStore(),
        rpc_path=f"/a2a/{adk_app.name}",
    )
    yield


app: FastAPI = get_fast_api_app(
    agents_dir=AGENT_DIR,
    web=True,
    artifact_service_uri=services.ARTIFACT_SERVICE_URI,
    allow_origins=allow_origins,
    session_service_uri=services.SESSION_SERVICE_URI,
    otel_to_cloud=False,
    lifespan=lifespan,
)
app.title = "krishimitra-ai"
app.description = "KrishiMitra AI — Agricultural Multi-Agent Operating System"

# Attach Vertex AI Console Playground proxy routes.
attach_reasoning_engine_routes(app)


# ---------------------------------------------------------------------------
# Farm Profile API
# ---------------------------------------------------------------------------

class SoilNPK(BaseModel):
    N: int = 0
    P: int = 0
    K: int = 0


class FarmProfileInput(BaseModel):
    location: str = "Unknown"
    soil_npk: SoilNPK = SoilNPK()
    soil_ph: float = 7.0
    soil_texture: str = "Unknown"
    crops: list[str] = []
    farming_history: list[dict[str, Any]] = []
    previous_diseases: list[dict[str, Any]] = []
    previous_recommendations: list[str] = []
    preferred_language: str = "English"
    irrigation_method: str = "Unknown"


@app.get("/api/profile/{user_id}")
def get_profile(user_id: str) -> dict[str, Any]:
    """Retrieve the persistent farm profile for a user."""
    memory_mgr = MemoryManager()
    return memory_mgr.get_profile(user_id)


@app.post("/api/profile/{user_id}")
def save_profile(user_id: str, profile: FarmProfileInput) -> dict[str, str]:
    """Create or update the persistent farm profile for a user."""
    memory_mgr = MemoryManager()
    data = profile.model_dump()
    # Convert nested SoilNPK model to plain dict
    data["soil_npk"] = data["soil_npk"] if isinstance(data["soil_npk"], dict) else profile.soil_npk.model_dump()
    memory_mgr.save_profile(user_id, data)
    return {"status": "success", "message": "Profile updated successfully."}


@app.get("/api/history/{user_id}")
def get_history(
    user_id: str, session_id: str | None = None, limit: int = 20
) -> list[dict[str, Any]]:
    """Retrieve conversation history for a user, optionally filtered by session."""
    memory_mgr = MemoryManager()
    return memory_mgr.get_conversation_history(user_id, session_id=session_id, limit=limit)


@app.delete("/api/history/{user_id}")
def clear_history(user_id: str) -> dict[str, str]:
    """Clear all conversation history for a user."""
    memory_mgr = MemoryManager()
    memory_mgr.clear_history(user_id)
    return {"status": "success", "message": "History cleared."}


# ---------------------------------------------------------------------------
# Proactive Alerts Endpoint
# ---------------------------------------------------------------------------

@app.post("/api/proactive_alerts/{user_id}")
def check_proactive_alerts(user_id: str) -> dict[str, Any]:
    """Trigger the proactive notification agent for a user's farm."""
    from google.genai import types

    runner = app.state.runner
    session_service = runner.session_service
    agent_app_name = app.state.agent_app_name
    session_id = f"alerts-{user_id}"

    session = session_service.get_session_sync(
        app_name=agent_app_name,
        user_id=user_id,
        session_id=session_id,
    )
    if not session:
        session = session_service.create_session_sync(
            app_name=agent_app_name,
            user_id=user_id,
            session_id=session_id,
        )

    message = types.Content(
        role="user",
        parts=[types.Part.from_text(text="Check for proactive alerts for my farm including weather risks, pest risks, and irrigation schedules.")],
    )

    events = list(
        runner.run(
            new_message=message,
            user_id=user_id,
            session_id=session.id,
        )
    )

    result_text = ""
    for event in events:
        if event.content and event.content.parts:
            for part in event.content.parts:
                if part.text:
                    result_text += part.text

    return {"user_id": user_id, "alerts": result_text}


# ---------------------------------------------------------------------------
# Feedback Endpoint
# ---------------------------------------------------------------------------

@app.post("/feedback")
def collect_feedback(feedback: Feedback) -> dict[str, str]:
    """Collect and log user feedback on agent responses.

    Args:
        feedback: The feedback data to log.

    Returns:
        A success confirmation dict.
    """
    _log_struct(feedback.model_dump(), severity="INFO")
    return {"status": "success"}


# ---------------------------------------------------------------------------
# Entry point for direct uvicorn execution
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)

# Uvicorn entrypoint configuration



