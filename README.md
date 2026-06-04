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

## Configure

```bash
cp .env.local.example .env.local
# point it at your backend:
#   NEXT_PUBLIC_BIFROST_URL=http://localhost:8088
#   NEXT_PUBLIC_BIFROST_URL=http://206.189.100.31:8088
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
2. Set the env var **`NEXT_PUBLIC_BIFROST_URL`** to your backend's public URL.
3. Deploy.

> The backend must be reachable from the browser and send permissive CORS
> headers (it does: `Access-Control-Allow-Origin: *`). If your backend is bound
> to `127.0.0.1` on the droplet, expose it (widen the Docker `ports` mapping)
> before the deployed frontend can reach it.

## Backend endpoints used

| Method | Path                   | Purpose                          |
|--------|------------------------|----------------------------------|
| GET    | `/settings`            | read current toggles + model     |
| POST   | `/settings`            | flip `enabled` / `passthrough_harmful` at runtime |
| POST   | `/v1/chat/completions` | send a prompt (OpenAI shape)     |
