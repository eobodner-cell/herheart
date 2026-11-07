// Renders the demo conversation with ElevenLabs into public/demo/<id>.mp3.
// Re-running only renders lines whose text or voice changed.
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { DEMO, DEMO_MODEL, DEMO_VOICES } from "../src/lib/demo";

const out = "public/demo";
async function main() {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("ELEVENLABS_API_KEY is missing in .env.local");
  await mkdir(out, { recursive: true });
  const file = `${out}/manifest.json`;
  const manifest: Record<string, string> = JSON.parse(await readFile(file, "utf8").catch(() => "{}"));
  for (const line of DEMO) {
    const { voiceId, stability } = DEMO_VOICES[line.who];
    const hash = createHash("sha1").update(`${DEMO_MODEL}|${voiceId}|${stability}|${line.text}`).digest("hex");
    if (manifest[line.id] === hash) continue;
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
      method: "POST",
      headers: { "xi-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({ text: line.text, model_id: DEMO_MODEL, voice_settings: { stability, similarity_boost: 0.8 } }),
    });
    if (!r.ok) throw new Error(`${line.id}: ElevenLabs ${r.status} ${(await r.text()).slice(0, 300)}`);
    await writeFile(`${out}/${line.id}.mp3`, Buffer.from(await r.arrayBuffer()));
    manifest[line.id] = hash;
    await writeFile(file, JSON.stringify(manifest, null, 2));
    console.log(`rendered ${line.id}`);
  }
  console.log("Demo audio is up to date.");
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
