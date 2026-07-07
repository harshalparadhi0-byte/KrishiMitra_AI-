# krishimitra-ai

## 📖 Overview

**KrishiMitra AI** is a production-ready **Hierarchical Multi-Agent AI System** built using the **Google Agent Development Kit (Google ADK)** to demonstrate how multiple specialized AI agents can collaborate under a central orchestrator to solve complex agricultural problems.

Instead of relying on a single Large Language Model (LLM), the system intelligently analyzes each farmer's query, plans an execution workflow, dynamically invokes only the required specialist agents, and synthesizes their outputs into a single, accurate, and easy-to-understand recommendation. This architecture improves reasoning quality, modularity, scalability, and maintainability while showcasing modern **Agentic AI**, **Workflow Orchestration**, **Streaming AI**, **Session Memory**, and **Production-Grade Backend Design**.

KrishiMitra AI provides intelligent assistance across multiple agricultural domains, including:

- 🌱 Soil Health Analysis
- 🌦️ Weather Intelligence & Forecast-Based Advisory
- 🌾 Crop Recommendation
- 🦠 Disease Diagnosis
- 🧪 Fertilizer Planning
- 💧 Irrigation Advisory
- 📈 Market Intelligence & Price Analysis
- 🏛️ Government Schemes & Subsidies
- 🔔 Proactive Farming Notifications
- 👨‍🌾 Personalized End-to-End Agricultural Guidance

Designed as a complete AI-powered farming assistant, KrishiMitra AI demonstrates how Google ADK can be used to build real-world, production-scale multi-agent systems capable of solving practical problems through intelligent collaboration between autonomous AI agents.

---

## 📂 Project Structure

```text
krishimitra-ai/
│
├── 📁 app/
│   ├── 📄 agent.py                # Main multi-agent workflow & orchestration
│   ├── 📄 fast_api_app.py         # FastAPI backend server
│   ├── 📁 app_utils/              # Shared utilities & helper functions
│   ├── 📄 config.py               # Configuration management
│   ├── 📄 memory.py               # Session & memory handling
│   └── 📄 mcp_server.py           # MCP server integration
│
├── 📁 frontend/
│   ├── React + Vite Application
│   ├── Tailwind CSS UI
│   ├── Chat Interface
│   └── Dashboard Pages
│
├── 📁 tests/
│   ├── Unit Tests
│   ├── Integration Tests
│   └── Workflow Validation
│
├── 📁 deployment/                 # Deployment configuration
├── 📁 data/                       # Project data & resources
├── 📁 scratch/                    # Development utilities
│
├── 📄 pyproject.toml              # Python dependencies
├── 📄 uv.lock                     # Locked dependency versions
├── 📄 GEMINI.md                   # AI development guide
├── 📄 README.md                   # Project documentation
└── 📄 agents-cli-manifest.yaml    # Google Agents CLI configuration
```

# 🏗️ System Architecture

```text
👨‍🌾 Farmer
│
└── 🌐 React + Vite Frontend
    │
    └── ⚡ FastAPI Backend
        │
        └── 🧠 Google ADK Executive Orchestrator
            │
            ├── 💬 Conversation Intelligence Agent
            │
            ├── 🔒 Security Checkpoint Agent
            │
            ├── 📋 Task Planner Agent
            │   │
            │   └── Dynamic Agent Selection
            │
            ├── 🌱 Soil Health Agent
            ├── 🌦️ Weather Intelligence Agent
            ├── 🌾 Crop Recommendation Agent
            ├── 🦠 Disease Diagnosis Agent
            ├── 💧 Irrigation Advisor Agent
            ├── 🧪 Fertilizer Advisor Agent
            ├── 📈 Market Intelligence Agent
            ├── 🏛️ Government Schemes Agent
            ├── 🔔 Proactive Notification Agent
            │
            └── 🧠 Decision Synthesizer Agent
                │
                └── 📤 Final AI Recommendation
                    │
                    └── ⚡ Server-Sent Events (SSE)
                        │
                        └── 👨‍🌾 Farmer
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
