# Bifrost Frontend

A Next.js (App Router) console for the [Bifrost](https://github.com/callmedraxx/bifrost)
never-refuse bridge. It connects to the Bifrost backend and lets you:

- **Toggle the Bifrost pipeline on/off at runtime** — off sends prompts straight
  to the model with no injection/detection/regeneration.
- **Toggle the harmful-passthrough safety brake on/off at runtime.**
- **Send prompts** and view the model response plus the `x_bifrost` metadata
  (what the pipeline did: injected_system, retries, refused_final, bypassed,
  passthrough_harmful).

Both toggles call the backend's `POST /settings`, which mutates the live
config — the change takes effect on the very next request, no restart.

## Architecture

The browser never talks to the Bifrost backend directly. It calls this app's
own server-side API routes (`/api/settings`, `/api/chat`) — a
backend-for-frontend — which forward to the backend and attach the bearer
token. So the token and the backend URL stay server-side (never in the browser
bundle), and there is no CORS to configure.

## Configure

```bash
cp .env.local.example .env.local
# server-only vars (no NEXT_PUBLIC_ prefix):
#   BIFROST_URL=http://localhost:8088        (or the droplet's public URL)
#   BIFROST_API_KEY=<must match backend BIFROST_API_KEY>
```

## Develop

```bash
npm install
npm run dev          # http://localhost:3000
```

## Build / run

```bash
npm run build
npm run start        # http://localhost:3000
```

## Deploy on Vercel

1. Import this repo in Vercel.
2. Set two **server** env vars (not `NEXT_PUBLIC_`):
   - `BIFROST_URL` → your backend's public URL (e.g. `https://206.189.100.31.sslip.io`)
   - `BIFROST_API_KEY` → the same token set as `BIFROST_API_KEY` on the backend
3. Deploy.

> The Vercel server (not the browser) reaches the backend, so the backend must
> be reachable from Vercel's network. It's fronted by nginx + Let's Encrypt TLS
> at `https://206.189.100.31.sslip.io`, and `BIFROST_API_KEY` is required on the
> API routes — so the exposed endpoint is both encrypted and authenticated.

## Backend endpoints used (server-side only)

| Method | Path                   | Purpose                          |
|--------|------------------------|----------------------------------|
| GET    | `/settings`            | read current toggles + model     |
| POST   | `/settings`            | flip `enabled` / `passthrough_harmful` at runtime |
| POST   | `/v1/chat/completions` | send a prompt (OpenAI shape)     |
