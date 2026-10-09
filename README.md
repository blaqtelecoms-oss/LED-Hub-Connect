# LED Hub Connect

LED Hub Connect is a React application backed by Supabase for authentication, database access, private file storage, and Edge Functions.

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local` in the repository root:

   ```env
   VITE_SUPABASE_URL=https://<project-ref>.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
   ```

   The publishable key is intended for browser use. Never put a Supabase service-role key in a `VITE_` variable or commit it.

3. Start the frontend against the configured Supabase project:

   ```bash
   npm run dev
   ```

## Supabase project setup

The checked-in migration creates the application tables, row-level security policies, private document bucket, and auth-user mapping trigger:

```bash
npx supabase login
npx supabase link --project-ref jokehbloiyybtorjxyhw
npx supabase db push
npx supabase functions deploy submit-verification-application
npx supabase functions deploy decide-verification-application
```

VS Code's Supabase MCP server is configured in `.vscode/mcp.json` and scoped to this project with read-only access. Open the workspace and authenticate with Supabase when VS Code prompts you. Keep the server read-only unless you explicitly need MCP to make database changes.

Configure Supabase Auth to allow email/password sign-up and set the site's redirect URLs to include the deployed app URL and `/reset-password`. For Google sign-in, configure the Google provider and its Supabase callback URL in the provider console and Supabase dashboard.

The first migration is based on the repository's existing entity definitions. Import exported rows after applying the migration, preserving each row's `id`, `created_by_id`, `created_date`, and `updated_date`. Import `users` and `user_profile` before Auth users where possible: database triggers link Supabase accounts to imported user records by matching the email in `user_profile`. Users must register or set a new password in Supabase because Base44 passwords cannot be transferred. Private files must also be copied into the `private-documents` bucket while preserving their storage paths.

## Build and checks

```bash
npm run build
npm run lint
npm run typecheck
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in the production frontend environment as well as in local development. Keep server-only credentials, including the service-role key used by Edge Functions, in Supabase's server-side secrets.
