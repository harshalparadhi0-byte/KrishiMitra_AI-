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

import pytest
from pathlib import Path
from app.memory import MemoryManager


@pytest.fixture
def memory_manager(tmp_path: Path) -> MemoryManager:
    """Provides a fresh MemoryManager backed by a temporary SQLite database.

    Uses pytest's built-in tmp_path fixture which creates and cleans up a
    temporary directory automatically. This avoids permission issues with
    relative paths and ensures test isolation.
    """
    db_file = tmp_path / "test_krishimitra.db"
    return MemoryManager(db_path=str(db_file))


def test_save_and_get_profile(memory_manager: MemoryManager):
    """Test that a farm profile can be saved and retrieved correctly."""
    user_id = "test_farmer_123"
    profile_data = {
        "location": "Pune",
        "soil_npk": {"N": 50, "P": 30, "K": 40},
        "soil_ph": 6.5,
        "soil_texture": "Clay",
        "crops": ["Tomato", "Wheat"],
        "farming_history": [{"season": "Rabi 2025", "crop": "Wheat", "yield": "12 quintals"}],
        "previous_diseases": [{"crop": "Tomato", "disease": "Early Blight"}],
        "previous_recommendations": ["Use nitrogen-rich fertilizers"],
        "preferred_language": "Marathi",
        "irrigation_method": "Drip",
    }

    memory_manager.save_profile(user_id, profile_data)
    retrieved = memory_manager.get_profile(user_id)

    assert retrieved["user_id"] == user_id
    assert retrieved["location"] == "Pune"
    assert retrieved["soil_npk"] == {"N": 50, "P": 30, "K": 40}
    assert retrieved["soil_ph"] == 6.5
    assert retrieved["crops"] == ["Tomato", "Wheat"]
    assert len(retrieved["farming_history"]) == 1
    assert retrieved["farming_history"][0]["crop"] == "Wheat"
    assert len(retrieved["previous_diseases"]) == 1
    assert retrieved["previous_recommendations"] == ["Use nitrogen-rich fertilizers"]
    assert retrieved["preferred_language"] == "Marathi"
    assert retrieved["irrigation_method"] == "Drip"


def test_save_profile_overwrites_existing(memory_manager: MemoryManager):
    """Test that saving a profile with the same user_id updates it (upsert)."""
    user_id = "test_farmer_456"

    memory_manager.save_profile(user_id, {
        "location": "Nagpur",
        "crops": ["Cotton"],
        "preferred_language": "Hindi",
        "irrigation_method": "Flood",
    })

    # Update the profile
    memory_manager.save_profile(user_id, {
        "location": "Nashik",
        "crops": ["Onion", "Grapes"],
        "preferred_language": "Marathi",
        "irrigation_method": "Drip",
    })

    retrieved = memory_manager.get_profile(user_id)
    assert retrieved["location"] == "Nashik"
    assert retrieved["crops"] == ["Onion", "Grapes"]
    assert retrieved["preferred_language"] == "Marathi"
    assert retrieved["irrigation_method"] == "Drip"


def test_get_nonexistent_profile_returns_default(memory_manager: MemoryManager):
    """Test that a missing profile returns sensible defaults."""
    retrieved = memory_manager.get_profile("nonexistent_user")

    assert retrieved["user_id"] == "nonexistent_user"
    assert retrieved["location"] == "Unknown"
    assert retrieved["soil_ph"] == 7.0
    assert retrieved["crops"] == []
    assert retrieved["soil_npk"] == {"N": 0, "P": 0, "K": 0}
    assert retrieved["preferred_language"] == "English"


def test_add_and_get_conversation_history(memory_manager: MemoryManager):
    """Test conversation history storage and retrieval."""
    user_id = "test_farmer_789"
    session_id = "session_xyz"

    memory_manager.add_message(user_id, session_id, "user", "What fertilizer should I use?")
    memory_manager.add_message(user_id, session_id, "assistant", "Use NPK 10-26-26.")

    history = memory_manager.get_conversation_history(user_id, session_id=session_id)

    assert len(history) == 2
    assert history[0]["role"] == "user"
    assert history[0]["content"] == "What fertilizer should I use?"
    assert history[1]["role"] == "assistant"
    assert history[1]["content"] == "Use NPK 10-26-26."
    assert "timestamp" in history[0]


def test_conversation_history_filtered_by_session(memory_manager: MemoryManager):
    """Test that history can be filtered by session_id."""
    user_id = "test_farmer_999"

    memory_manager.add_message(user_id, "session_a", "user", "Question in session A")
    memory_manager.add_message(user_id, "session_b", "user", "Question in session B")
    memory_manager.add_message(user_id, "session_a", "assistant", "Answer in session A")

    history_a = memory_manager.get_conversation_history(user_id, session_id="session_a")
    history_b = memory_manager.get_conversation_history(user_id, session_id="session_b")
    all_history = memory_manager.get_conversation_history(user_id)

    assert len(history_a) == 2
    assert len(history_b) == 1
    assert len(all_history) == 3


def test_clear_history(memory_manager: MemoryManager):
    """Test that conversation history can be cleared for a user."""
    user_id = "test_farmer_clear"
    memory_manager.add_message(user_id, "s1", "user", "Hello")
    memory_manager.add_message(user_id, "s1", "assistant", "Hi there")

    assert len(memory_manager.get_conversation_history(user_id)) == 2

    memory_manager.clear_history(user_id)
    assert len(memory_manager.get_conversation_history(user_id)) == 0
