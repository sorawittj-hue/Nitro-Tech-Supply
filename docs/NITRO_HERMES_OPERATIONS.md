# Nitro Tech Supply Hermes Operations

Nitro Tech Supply is installed into Hermes as the `nitro-tech-supply` plugin.
The React dashboard remains the UI. Hermes is the company brain loaded from
`plugin.yaml`, `__init__.py`, `AGENTS.md`, `swarm.yaml`, `hermes/`, `skills/`,
and `agents/`.

## Daily Use

1. Open the Nitro dashboard URL.
2. Use Team Chat or Telegram as CEO Jay.
3. Ask business commands naturally, for example:
   - "Atlas, check low stock and tell me what to reorder."
   - "Vega, summarize cashflow risk today."
   - "Max, prepare a wholesale quote but wait for approval before sending."
4. Hermes should answer as the relevant Nitro agent and keep approval gates.

## Updating GitHub And AWS

After pushing changes to `main`, update both the AWS dashboard and Hermes plugin:

```bash
bash /home/ubuntu/Nitro-Tech-Supply/ops/nitro-aws-update.sh
```

This script pulls GitHub, installs dependencies, builds the frontend, reinstalls
the Hermes plugin from GitHub, and restarts Nitro/Hermes services.

## Permanent Cloudflare URL

The current quick tunnel URL is temporary. For a permanent URL, your domain must
be managed in Cloudflare and the AWS server must be logged in once:

```bash
bash /home/ubuntu/Nitro-Tech-Supply/ops/setup-cloudflare-named-tunnel.sh nitro.yourdomain.com
```

Open the login URL shown by `cloudflared`, choose the domain, then rerun the
same command if the script asks you to. When complete, the app will be available
at:

```text
https://nitro.yourdomain.com
```
