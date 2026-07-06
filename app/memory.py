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

import json
import os
import sqlite3
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from app.config import config

class MemoryManager:
    """Manages persistent storage for farm profiles and conversation logs in SQLite."""
    _initialized_dbs = set()

    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path or config.database_path
        
        # Ensure the directory for the database exists
        dir_name = os.path.dirname(self.db_path)
        if dir_name and not os.path.exists(dir_name):
            os.makedirs(dir_name, exist_ok=True)
            
        if self.db_path not in MemoryManager._initialized_dbs:
            self._init_db()
            MemoryManager._initialized_dbs.add(self.db_path)



    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self._get_connection() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS farm_profiles (
                    user_id TEXT PRIMARY KEY,
                    location TEXT,
                    soil_npk TEXT, -- JSON dict {"N": int, "P": int, "K": int}
                    soil_ph REAL,
                    soil_texture TEXT,
                    crops TEXT, -- JSON list of strings
                    farming_history TEXT, -- JSON list of dicts
                    previous_diseases TEXT, -- JSON list of dicts
                    previous_recommendations TEXT, -- JSON list of dicts
                    preferred_language TEXT,
                    irrigation_method TEXT
                )
            """)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS conversations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT,
                    session_id TEXT,
                    timestamp TEXT,
                    role TEXT,
                    content TEXT
                )
            """)
            conn.commit()

    def get_profile(self, user_id: str) -> Dict[str, Any]:
        """Retrieves the farm profile for a given user. Returns a default dictionary if not found."""
        with self._get_connection() as conn:
            row = conn.execute(
                "SELECT * FROM farm_profiles WHERE user_id = ?", (user_id,)
            ).fetchone()
            
            if row:
                return {
                    "user_id": row["user_id"],
                    "location": row["location"],
                    "soil_npk": json.loads(row["soil_npk"]) if row["soil_npk"] else {"N": 0, "P": 0, "K": 0},
                    "soil_ph": row["soil_ph"],
                    "soil_texture": row["soil_texture"],
                    "crops": json.loads(row["crops"]) if row["crops"] else [],
                    "farming_history": json.loads(row["farming_history"]) if row["farming_history"] else [],
                    "previous_diseases": json.loads(row["previous_diseases"]) if row["previous_diseases"] else [],
                    "previous_recommendations": json.loads(row["previous_recommendations"]) if row["previous_recommendations"] else [],
                    "preferred_language": row["preferred_language"] or "English",
                    "irrigation_method": row["irrigation_method"] or "Unknown"
                }
            
            # Default empty profile
            return {
                "user_id": user_id,
                "location": "Unknown",
                "soil_npk": {"N": 0, "P": 0, "K": 0},
                "soil_ph": 7.0,
                "soil_texture": "Unknown",
                "crops": [],
                "farming_history": [],
                "previous_diseases": [],
                "previous_recommendations": [],
                "preferred_language": "English",
                "irrigation_method": "Unknown"
            }

    def save_profile(self, user_id: str, profile: Dict[str, Any]) -> None:
        """Saves or updates a user's farm profile."""
        soil_npk = json.dumps(profile.get("soil_npk", {"N": 0, "P": 0, "K": 0}))
        crops = json.dumps(profile.get("crops", []))
        farming_history = json.dumps(profile.get("farming_history", []))
        previous_diseases = json.dumps(profile.get("previous_diseases", []))
        previous_recommendations = json.dumps(profile.get("previous_recommendations", []))
        
        with self._get_connection() as conn:
            conn.execute("""
                INSERT INTO farm_profiles (
                    user_id, location, soil_npk, soil_ph, soil_texture, 
                    crops, farming_history, previous_diseases, previous_recommendations,
                    preferred_language, irrigation_method
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(user_id) DO UPDATE SET
                    location = excluded.location,
                    soil_npk = excluded.soil_npk,
                    soil_ph = excluded.soil_ph,
                    soil_texture = excluded.soil_texture,
                    crops = excluded.crops,
                    farming_history = excluded.farming_history,
                    previous_diseases = excluded.previous_diseases,
                    previous_recommendations = excluded.previous_recommendations,
                    preferred_language = excluded.preferred_language,
                    irrigation_method = excluded.irrigation_method
            """, (
                user_id,
                profile.get("location", "Unknown"),
                soil_npk,
                profile.get("soil_ph", 7.0),
                profile.get("soil_texture", "Unknown"),
                crops,
                farming_history,
                previous_diseases,
                previous_recommendations,
                profile.get("preferred_language", "English"),
                profile.get("irrigation_method", "Unknown")
            ))
            conn.commit()

    def add_message(self, user_id: str, session_id: str, role: str, content: str) -> None:
        """Logs a conversation message in the database."""
        timestamp = datetime.now(timezone.utc).isoformat()
        with self._get_connection() as conn:
            conn.execute("""
                INSERT INTO conversations (user_id, session_id, timestamp, role, content)
                VALUES (?, ?, ?, ?, ?)
            """, (user_id, session_id, timestamp, role, content))
            conn.commit()

    def get_conversation_history(self, user_id: str, session_id: Optional[str] = None, limit: int = 20) -> List[Dict[str, Any]]:
        """Retrieves conversation history for a user, optionally filtered by session."""
        query = "SELECT role, content, timestamp FROM conversations WHERE user_id = ?"
        params = [user_id]
        
        if session_id:
            query += " AND session_id = ?"
            params.append(session_id)
            
        query += " ORDER BY id ASC LIMIT ?"
        params.append(limit)
        
        with self._get_connection() as conn:
            rows = conn.execute(query, params).fetchall()
            return [
                {
                    "role": row["role"],
                    "content": row["content"],
                    "timestamp": row["timestamp"]
                }
                for row in rows
            ]

    def clear_history(self, user_id: str) -> None:
        """Clears conversation history for a user."""
        with self._get_connection() as conn:
            conn.execute("DELETE FROM conversations WHERE user_id = ?", (user_id,))
            conn.commit()
