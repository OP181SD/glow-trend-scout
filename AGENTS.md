<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- All Oriane API knowledge (URL, request body, response mapping) lives only in `src/lib/oriane.server.ts`; swap providers or formats there. Why: the provider format may change.
- Video search runs as a TanStack server function (`src/lib/search.functions.ts`), not a Supabase Edge Function. Why: this stack forbids new Edge Functions; keys stay server-side.
- Database tables are server-only (RLS on, no anon/authenticated policies); the app reads/writes them through server functions. Why: the app has no sign-in yet.
- Scoring is pure and tested in `src/lib/scoring.ts`. Why: ranking rule must stay verifiable.
- All Anthropic (Claude) API knowledge lives only in `src/lib/claude.server.ts`; AI server functions are in `src/lib/ai.functions.ts`. Why: key stays server-side and provider is swappable.
- AI system prompts live as plain text in `src/prompts/*.system.txt` (imported with `?raw`). Why: editable without touching code.
