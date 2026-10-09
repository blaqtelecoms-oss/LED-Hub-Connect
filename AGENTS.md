# AGENTS.md

## Project context

This is a React application backed by Supabase. Keep changes focused, preserve the existing portal UX, and use the existing Supabase client in `src/utils/supabase.ts`.

## Key files

- `src/`: frontend application source.
- `src/utils/supabase.ts`: configured Supabase JavaScript client.
- `supabase/migrations/`: database schema and row-level security migrations.
- `supabase/functions/`: server-side Edge Functions.
- `.env.local`: local-only environment values; never commit secrets.

## Development

- Run `npm run dev` for frontend development against the configured Supabase project.
- Use `npx supabase db push` to apply checked-in migrations to the linked project.
- Deploy Edge Functions with `npx supabase functions deploy <function-name>`.
- Run the relevant checks from `package.json` before finishing code changes.
