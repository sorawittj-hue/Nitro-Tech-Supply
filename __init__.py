"""Nitro Tech Supply Hermes plugin.

This plugin turns the Nitro Tech Supply repository into an active Hermes
workspace package. It injects the company operating context before LLM calls
and exposes lightweight tools for reading the company roster and workspace
contract.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

PLUGIN_ROOT = Path(__file__).resolve().parent
CONTEXT_PATH = PLUGIN_ROOT / "hermes" / "nitro-company-context.md"
SWARM_PATH = PLUGIN_ROOT / "swarm.yaml"
AGENTS_CONTRACT_PATH = PLUGIN_ROOT / "AGENTS.md"


def _read_text(path: Path, *, max_chars: int = 12_000) -> str:
    try:
        content = path.read_text(encoding="utf-8").strip()
    except FileNotFoundError:
        logger.warning("Nitro plugin context file missing: %s", path)
        return ""
    except OSError as exc:
        logger.warning("Nitro plugin failed to read %s: %s", path, exc)
        return ""
    return content[:max_chars]


def _load_workspace_context() -> str:
    parts = [
        _read_text(CONTEXT_PATH, max_chars=10_000),
        "Source of truth files available in this plugin:",
        "- AGENTS.md: Hermes operating contract for Nitro Tech Supply.",
        "- swarm.yaml: semantic company roster and routing map.",
        "- skills/nitro-business-dispatch/SKILL.md: mission dispatch rules.",
    ]
    return "\n\n".join(part for part in parts if part)


def _pre_llm_call(**_kwargs: object) -> dict[str, str] | None:
    context = _load_workspace_context()
    if not context:
        return None
    return {
        "context": (
            "Nitro Tech Supply Hermes Workspace Context\n\n"
            f"{context}\n\n"
            "Use this context as the company brain for Nitro Tech Supply. "
            "Reply as the most appropriate agent from the roster, preserve "
            "CEO Jay's final approval gates, and keep business actions "
            "decision-oriented."
        )
    }


NITRO_WORKSPACE_STATUS_SCHEMA: dict[str, Any] = {
    "name": "nitro_workspace_status",
    "description": "Return the Nitro Tech Supply Hermes workspace/plugin status and source-of-truth files.",
    "parameters": {
        "type": "object",
        "properties": {},
        "additionalProperties": False,
    },
}

NITRO_AGENT_ROSTER_SCHEMA: dict[str, Any] = {
    "name": "nitro_agent_roster",
    "description": "Return the Nitro Tech Supply semantic AI company roster from swarm.yaml.",
    "parameters": {
        "type": "object",
        "properties": {},
        "additionalProperties": False,
    },
}


def handle_workspace_status(_args: dict[str, Any] | None = None, **_kwargs: object) -> str:
    files = {
        "context": CONTEXT_PATH.exists(),
        "agents_contract": AGENTS_CONTRACT_PATH.exists(),
        "swarm": SWARM_PATH.exists(),
        "dispatch_skill": (PLUGIN_ROOT / "skills" / "nitro-business-dispatch" / "SKILL.md").exists(),
    }
    payload = {
        "ok": all(files.values()),
        "plugin": "nitro-tech-supply",
        "company": "Nitro Tech Supply",
        "mode": "Hermes workspace brain",
        "files": files,
    }
    return json.dumps(payload, ensure_ascii=False)


def handle_agent_roster(_args: dict[str, Any] | None = None, **_kwargs: object) -> str:
    content = _read_text(SWARM_PATH, max_chars=20_000)
    payload = {
        "ok": bool(content),
        "source": "swarm.yaml",
        "content": content,
    }
    return json.dumps(payload, ensure_ascii=False)


def register(ctx: Any) -> None:
    ctx.register_tool(
        name="nitro_workspace_status",
        toolset="nitro_tech_supply",
        schema=NITRO_WORKSPACE_STATUS_SCHEMA,
        handler=handle_workspace_status,
        emoji="🏢",
    )
    ctx.register_tool(
        name="nitro_agent_roster",
        toolset="nitro_tech_supply",
        schema=NITRO_AGENT_ROSTER_SCHEMA,
        handler=handle_agent_roster,
        emoji="👥",
    )
    ctx.register_hook("pre_llm_call", _pre_llm_call)
