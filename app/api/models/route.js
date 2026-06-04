import { backendFetch } from "../../../lib/backend";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const r = await backendFetch("/v1/models");
    const body = await r.text();
    return new Response(body, { status: r.status, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return Response.json({ error: { message: `backend unreachable: ${e.message}` } }, { status: 502 });
  }
}
