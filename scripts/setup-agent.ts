// Creates (or updates) the HerHeart ElevenLabs voice agent and its client
// tools, and saves the IDs to .env.local. Re-run after editing agents/herheart.md.
import { readFile, writeFile } from "node:fs/promises";

async function eleven(path: string, init: RequestInit = {}) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("ELEVENLABS_API_KEY is missing in .env.local");
  const r = await fetch(`https://api.elevenlabs.io/v1${path}`, {
    ...init,
    headers: { "xi-api-key": key, "Content-Type": "application/json" },
  });
  if (!r.ok) throw new Error(`ElevenLabs ${r.status}: ${(await r.text()).slice(0, 500)}`);
  return r.json();
}
async function saveEnv(name: string, value: string) {
  let env = await readFile(".env.local", "utf8").catch(() => "");
  const re = new RegExp(`^${name}=.*$`, "m");
  env = re.test(env) ? env.replace(re, `${name}=${value}`) : env.trimEnd() + `\n${name}=${value}\n`;
  await writeFile(".env.local", env);
  process.env[name] = value;
}
const tools = [
  {
    name: "show_metric",
    description: "Show a metric chart on the user's screen",
    properties: { metric: { type: "string", enum: ["rhr", "hrv", "bp", "sleep"], description: "Metric to show" } },
  },
];

async function main() {
  const toolIds: string[] = [];
  for (const t of tools) {
    const config = {
      tool_config: {
        type: "client",
        name: t.name,
        description: t.description,
        expects_response: true,
        response_timeout_secs: 10,
        parameters: { type: "object", properties: t.properties, required: Object.keys(t.properties) },
      },
    };
    const envKey = `ELEVENLABS_TOOL_${t.name.toUpperCase()}_ID`;
    let id = process.env[envKey];
    if (id) await eleven(`/convai/tools/${id}`, { method: "PATCH", body: JSON.stringify(config) });
    else {
      id = (await eleven("/convai/tools", { method: "POST", body: JSON.stringify(config) })).id as string;
      await saveEnv(envKey, id);
    }
    toolIds.push(id);
  }
  const body = {
    name: "HerHeart",
    conversation_config: {
      agent: {
        first_message: "Hi {{user_name}}. What would you like to know about your heart?",
        language: "en",
        dynamic_variables: {
          dynamic_variable_placeholders: { user_name: "Amara", user_profile: "Amara, 47.", today_context: "No data yet.", health_history: "No history yet." },
        },
        prompt: {
          prompt: await readFile("agents/herheart.md", "utf8"),
          llm: "claude-sonnet-5-5",
          tool_ids: toolIds,
          built_in_tools: {
            skip_turn: { type: "system", name: "skip_turn", description: "Stay quiet when nothing needs saying." },
            end_call: { type: "system", name: "end_call", description: "End only when the user asks." },
          },
        },
      },
      tts: { voice_id: process.env.ELEVENLABS_VOICE_ID || "EXAVITQu4vr4xnSDxMaL", model_id: "eleven_v4_turbo", speed: 1.15 },
      turn: { turn_eagerness: "eager" },
      conversation: { max_duration_seconds: 1200 },
    },
    platform_settings: { privacy: { record_voice: false } },
  };
  let id = process.env.ELEVENLABS_AGENT_ID;
  if (id) await eleven(`/convai/agents/${id}`, { method: "PATCH", body: JSON.stringify(body) });
  else {
    id = (await eleven("/convai/agents/create", { method: "POST", body: JSON.stringify(body) })).agent_id as string;
    await saveEnv("ELEVENLABS_AGENT_ID", id);
  }
  console.log("HerHeart agent ready:", id);
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
