// Seul fichier qui sait appeler Claude (via la passerelle IA intégrée, côté serveur uniquement).
import { generateMessage } from "@lovable.dev/ai-gateway";

const MODEL = "anthropic/claude-sonnet-5" as const;

async function callClaude(system: string, user: string): Promise<string> {
  const res = await generateMessage({
    model: MODEL,
    max_tokens: 4096,
    system,
    messages: [{ role: "user", content: user }],
  });
  return res.content.map((c) => (c.type === "text" ? c.text : "")).join("");
}

function parseJson(text: string): unknown {
  const t = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  return JSON.parse(t);
}

/** Appelle Claude et valide le JSON ; une seule nouvelle tentative si invalide. */
export async function claudeJson<T>(system: string, user: string, validate: (v: unknown) => T): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    const text = await callClaude(system, attempt === 0 ? user : `${user}\n\nTa réponse précédente n'était pas un JSON valide. Réponds uniquement avec le JSON.`);
    try {
      return validate(parseJson(text));
    } catch (e) {
      lastErr = e;
      console.error("JSON Claude invalide, tentative", attempt + 1);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("JSON invalide");
}
