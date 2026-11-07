// Issues a short-lived ElevenLabs conversation token. The API key never
// reaches the browser.
export async function GET() {
  const key = process.env.ELEVENLABS_API_KEY;
  const id = process.env.ELEVENLABS_AGENT_ID;
  if (!key || !id)
    return Response.json(
      { error: "Voice agent not configured: add ELEVENLABS_API_KEY to .env.local and run npm run setup:agent." },
      { status: 503 },
    );
  const r = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${encodeURIComponent(id)}`,
    { headers: { "xi-api-key": key }, cache: "no-store" },
  );
  if (!r.ok)
    return Response.json({ error: `ElevenLabs ${r.status}: ${(await r.text()).slice(0, 200)}` }, { status: 502 });
  return Response.json(await r.json());
}
