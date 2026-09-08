# Base44 Dev Environment

## What this app is
A Vite + React frontend ("Central Newcastle RLFC") that uses the Base44 SDK (`@base44/sdk`) and `@base44/vite-plugin` to connect to a Base44-hosted backend. There is no local database or backend — all data comes from the Base44 cloud.

## How to run
```bash
docker compose -f docker-compose.base44.yml up -d
```
The app is served on **host port 3000** (mapped to Vite's 5173 inside the container).

## Required credentials
Two env vars are required for the app to connect to its backend:
- `VITE_BASE44_APP_ID` — the Base44 app ID
- `VITE_BASE44_APP_BASE_URL` — the Base44 backend URL (e.g. `https://my-app-xxxx.base44.app`)

These are found in the Base44 Builder dashboard or the project's `.env.local`. Without them, the app boots but cannot authenticate or fetch data. The `@base44/vite-plugin` sets up a dev proxy from `/api` to `VITE_BASE44_APP_BASE_URL`; if that value is not a valid URL, the Vite dev server crashes on first request.

Optional: `VITE_VAPID_PUBLIC_KEY` (web push notifications), `VITE_BASE44_FUNCTIONS_VERSION`.

## Compose notes
- Uses `node:22-slim` with the source bind-mounted at `/app`.
- `node_modules` is in a named volume to avoid host/platform conflicts.
- `npm install` runs on every container start; Vite dev server follows with `--host 0.0.0.0`.
- `.env.base44-defaults` provides placeholder values so the app boots without real credentials.
- Once real credentials are provided via the Base44 dashboard, add `env_file: /run/base44/app.env` back to the compose service (as the LAST entry) so user values override the placeholders.

## Verification
- `curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/` should return `200`.
- The served HTML includes `/@vite/client` and `/@react-refresh` — confirming a live dev server, not a prebuilt bundle.
