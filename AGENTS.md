# AGENTS.md

## Project context

This is a React application backed by Supabase. Keep changes focused, preserve the existing portal UX, and use the existing Supabase client in `src/utils/supabase.ts`.

## Key files

- `src/`: frontend application source.
- `src/utils/supabase.ts`: configured Supabase JavaScript client.
- `supabase/migrations/`: database schema and row-level security migrations.
- `supabase/functions/`: server-side Edge Functions.
- `.env.local`: local-only environment values; never commit secrets.

## Base44 dev environment

- `docker-compose.base44.yml` runs the Vite dev server (`npm run dev`) on host port 3000 from the cloned source, with `node_modules` in a named volume.
- The lockfile was out of sync with `package.json`, so the compose startup uses `npm install` (not `npm ci`) to reconcile it.
- Required env vars: `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (delivered via `/run/base44/app.env`). Development placeholders are generated automatically so the app boots; replace them with real Supabase credentials from the Secrets page for full functionality.
- `src/utils/supabase.ts` falls back to a dummy client when the configured URL is not a valid HTTP(S) URL, so the app renders its own error screen instead of white-screening at module load. This does not affect behavior with real credentials.

## Development

- Run `npm run dev` for frontend development against the configured Supabase project.
- Use `npx supabase db push` to apply checked-in migrations to the linked project.
- Deploy Edge Functions with `npx supabase functions deploy <function-name>`.
- Run the relevant checks from `package.json` before finishing code changes.
