// Seul fichier qui connaît l'API Anthropic. La clé est lue côté serveur uniquement.
const URL = "https://api.anthropic.com/v1/messages";

async function callClaude(system: string, user: string): Promise<string> {
  const key = process.env["ANTHROPIC_API_KEY"];
  if (!key) throw new Error("ANTHROPIC_API_KEY manquante");
  const model = process.env["ANTHROPIC_MODEL"] || "claude-sonnet-5-5";
  let res: Response;
  try {
    res = await fetch(URL, {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model, max_tokens: 4096, system, messages: [{ role: "user", content: user }] }),
    });
  } catch {
    throw new Error("Claude injoignable");
  }
  if (!res.ok) {
    console.error("Claude HTTP", res.status);
    throw new Error(`Claude a répondu ${res.status}`);
  }
  const json = (await res.json()) as { content?: { type: string; text?: string }[] };
  return (json.content ?? []).filter((c) => c.type === "text").map((c) => c.text ?? "").join("");
}

function parseJson(text: string): unknown {
  const t = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
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
