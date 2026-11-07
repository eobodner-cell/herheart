// Pre-renders every story line and stage answer with ElevenLabs into
// public/story/<id>.mp3. Re-running only renders lines that changed.
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { allLines, SPEAKERS, STORY_MODEL } from "../src/lib/story";

const out = "public/story";
async function main() {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("ELEVENLABS_API_KEY is missing in .env.local");
  await mkdir(out, { recursive: true });
  const file = `${out}/manifest.json`;
  const manifest: Record<string, string> = JSON.parse(await readFile(file, "utf8").catch(() => "{}"));
  const force = process.argv.includes("--force");
  for (const line of allLines()) {
    const { voiceId, stability } = SPEAKERS[line.speaker];
    const hash = createHash("sha1").update(`${STORY_MODEL}|${voiceId}|${stability}|${line.text}`).digest("hex");
    if (!force && manifest[line.id] === hash) continue;
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
      method: "POST",
      headers: { "xi-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({ text: line.text, model_id: STORY_MODEL, voice_settings: { stability, similarity_boost: 0.8 } }),
    });
    if (!r.ok) throw new Error(`${line.id}: ElevenLabs ${r.status} ${(await r.text()).slice(0, 300)}`);
    await writeFile(`${out}/${line.id}.mp3`, Buffer.from(await r.arrayBuffer()));
    manifest[line.id] = hash;
    await writeFile(file, JSON.stringify(manifest, null, 2));
    console.log(`rendered ${line.id} (${SPEAKERS[line.speaker].name})`);
  }
  console.log("Audio is up to date.");
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
