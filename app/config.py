import os
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv(override=True)
os.environ.setdefault("GOOGLE_GENAI_USE_VERTEXAI", "False")  # Gemini API key only

@dataclass
class AgentConfig:
    # Reads model from environment GEMINI_MODEL. Default gemini-2.5-flash
    model: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    mcp_server_port: int = 8090
    max_iterations: int = 3
    pii_redaction_enabled: bool = True
    injection_detection_enabled: bool = True
    database_path: str = os.getenv("DATABASE_PATH", "data/krishimitra.db")

config = AgentConfig()

