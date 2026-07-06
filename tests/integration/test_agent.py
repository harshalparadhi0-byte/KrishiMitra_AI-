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

"""Integration test for ADK streaming via the KrishiMitra workflow.

Requires a valid GOOGLE_API_KEY (starting with 'AIza') to run against the
live Gemini API. When the key is absent or invalid (e.g. starts with 'AQ.'),
the test is automatically skipped so that the test suite remains green in CI
and local dev environments without credentials.
"""

import os
import pytest
import dotenv
dotenv.load_dotenv(override=True)

# Support both legacy "AIza" keys and new official "AQ." AI Studio keys.
# We skip only if no key is configured.
_api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
_key_is_present = bool(_api_key and _api_key.strip())

pytestmark = pytest.mark.skipif(
    not _key_is_present,
    reason=(
        "GOOGLE_API_KEY or GEMINI_API_KEY is missing — set a valid Google AI Studio "
        "API key to run live agent tests."
    ),
)


def test_agent_stream() -> None:
    """
    End-to-end streaming test for the KrishiMitra ADK workflow.

    Verifies that:
    - The Runner can be initialised with the workflow root_agent.
    - At least one streaming event is returned.
    - At least one event contains text content.
    """
    from google.adk.agents.run_config import RunConfig, StreamingMode
    from google.adk.runners import Runner
    from google.adk.sessions import InMemorySessionService
    from google.genai import types

    from app.agent import root_agent

    session_service = InMemorySessionService()
    session = session_service.create_session_sync(user_id="test_user", app_name="test")
    runner = Runner(agent=root_agent, session_service=session_service, app_name="test")

    message = types.Content(
        role="user",
        parts=[types.Part.from_text(
            text="My tomato leaves have yellow spots in Pune. What is the likely disease?"
        )],
    )

    events = list(
        runner.run(
            new_message=message,
            user_id="test_user",
            session_id=session.id,
            run_config=RunConfig(streaming_mode=StreamingMode.SSE),
        )
    )
    assert len(events) > 0, "Expected at least one streaming event from the runner"

    has_text_content = any(
        part.text
        for event in events
        if event.content and event.content.parts
        for part in event.content.parts
    )
    assert has_text_content, "Expected at least one event with non-empty text content"
