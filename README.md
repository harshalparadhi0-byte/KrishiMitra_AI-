# krishimitra-ai

ReAct agent
Agent generated with `agents-cli` version `1.0.0`

# 📖 Overview
KrishiMitra AI is a production-ready **multi-agent AI platform** designed to help farmers make intelligent agricultural decisions using Google ADK.
Instead of relying on a single LLM, the platform uses an **Executive Orchestrator** that coordinates multiple specialist AI agents. Each agent solves a specific agricultural problem, while the orchestrator combines their outputs into one farmer-friendly recommendation.
The system supports:

- Soil Health Analysis
- Weather Intelligence
- Crop Recommendation
- Disease Diagnosis
- Fertilizer Planning
- Irrigation Advisory
- Market Intelligence
- Government Schemes
- Personalized Farming Guidance
---

## Project Structure
krishimitra-ai/
├── app/         # Core agent code
│   ├── agent.py               # Main agent logic
│   ├── fast_api_app.py        # FastAPI Backend server
│   └── app_utils/             # App utilities and helpers
├── tests/                     # Unit, integration, and load tests
├── GEMINI.md                  # AI-assisted development guide
└── pyproject.toml             # Project dependencies
```

## System Architecture

                    🌾 Farmer
                         │
                         ▼
                React + Vite Frontend
                         │
              REST API + SSE Streaming
                         │
                         ▼
                  FastAPI Backend
                         │
                         ▼
          Executive Orchestrator (Google ADK)
                         │
     ┌───────────────────┴────────────────────┐
     │                                        │
     ▼                                        ▼
Conversation Intelligence           Security Checkpoint
     │                                        │
     └───────────────────┬────────────────────┘
                         ▼
                  Task Planner Agent
                         │
 ┌────────────────────────────────────────────────────┐
 │                                                    │
 ▼                                                    ▼
Weather      Soil      Crop      Disease      Irrigation
Market     Fertilizer  Govt Schemes   Notifications
 └────────────────────────────────────────────────────┘
                         │
                         ▼
              Decision Synthesizer Agent
                         │
                         ▼
          Farmer Friendly Final Recommendation
```
> 💡 **Tip:** Use [Antigravity CLI](https://antigravity.google/) for AI-assisted development - project context is pre-configured in `GEMINI.md`.

## Requirements

Before you begin, ensure you have:
- **uv**: Python package manager (used for all dependency management in this project) - [Install](https://docs.astral.sh/uv/getting-started/installation/) ([add packages](https://docs.astral.sh/uv/concepts/dependencies/) with `uv add <package>`)
- **agents-cli**: Agents CLI - Install with `uv tool install google-agents-cli`
- **Google Cloud SDK**: For GCP services - [Install](https://cloud.google.com/sdk/docs/install)

# 🛠 Technology Stack
## Backend

- Python
- Google Agent Development Kit (ADK)
- FastAPI
- Gemini 2.5 Flash
- AsyncIO
- Server Sent Events (SSE)

## Frontend

- React
- TypeScript
- Vite
- Tailwind CSS

## Development

- Git
- GitHub
- MCP
- Pytest
---

## Quick Start

Install `agents-cli` and its skills if not already installed:

```bash
uvx google-agents-cli setup
```

Install required packages:

```bash
agents-cli install
```

Test the agent with a local web server:

```bash
agents-cli playground
```

You can also use features from the [ADK](https://adk.dev/) CLI with `uv run adk`.

## Commands

| Command              | Description                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------- |
| `agents-cli install` | Install dependencies using uv                                                         |
| `agents-cli playground` | Launch local development environment                                                  |
| `agents-cli lint`    | Run code quality checks                                                               |
| `agents-cli eval`    | Evaluate agent behavior (generate, grade, analyze, and more — see `agents-cli eval --help`) |
| `uv run pytest tests/unit tests/integration` | Run unit and integration tests                                                        |
| `agents-cli deploy`  | Deploy agent to Agent Runtime                                                                |
| `agents-cli publish gemini-enterprise` | Register deployed agent to Gemini Enterprise                    || [A2A Inspector](https://github.com/a2aproject/a2a-inspector) | Launch A2A Protocol Inspector                                                        |

## 🛠️ Project Management

| Command | What It Does |
|---------|--------------|
| `agents-cli scaffold enhance` | Add CI/CD pipelines and Terraform infrastructure |
| `agents-cli infra cicd` | One-command setup of entire CI/CD pipeline + infrastructure |
| `agents-cli scaffold upgrade` | Auto-upgrade to latest version while preserving customizations |

---
# 🚀 Running the Project

## Backend
```bash
.\.venv\Scripts\python.exe -m uvicorn app.fast_api_app:app --reload
```
## Frontend
```bash
cd frontend
npm install
npm run dev
```
## Development

Edit your agent logic in `app/agent.py` and test with `agents-cli playground` - it auto-reloads on save.

## Deployment

```bash
gcloud config set project <your-project-id>
agents-cli deploy
```

To add CI/CD and Terraform, run `agents-cli scaffold enhance`.
To set up your production infrastructure, run `agents-cli infra cicd`.

## Observability

Built-in telemetry exports to Cloud Trace, BigQuery, and Cloud Logging.

## A2A Inspector

This agent supports the [A2A Protocol](https://a2a-protocol.org/). Use the [A2A Inspector](https://github.com/a2aproject/a2a-inspector) to test interoperability.
See the [A2A Inspector docs](https://github.com/a2aproject/a2a-inspector) for details.
# 👨‍💻 Author
**Harshal Paradhi**
