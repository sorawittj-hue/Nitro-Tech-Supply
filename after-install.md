# Nitro Tech Supply Hermes Workspace Installed

This plugin makes Nitro Tech Supply available to Hermes as a company workspace.

What Hermes now receives:

- Nitro company context through the `pre_llm_call` hook.
- `nitro_workspace_status` tool for plugin/source status.
- `nitro_agent_roster` tool for reading the semantic company roster.
- A business dispatch skill and agent role profiles aligned to the Nitro UI.

Restart the Hermes gateway after install:

```bash
sudo systemctl restart hermes-gateway.service
```
