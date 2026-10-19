/// <reference types="vite/client" />

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY environment variable.'
  );
}

// When the configured URL is not a valid HTTP(S) URL (e.g. a development
// placeholder), createClient throws at module load and crashes the entire
// app before its own connection-error screen can render. Fall back to a
// dummy client so the app degrades gracefully; real credentials work as-is.
let supabase;
try {
  supabase = createClient(supabaseUrl, supabasePublishableKey);
} catch {
  supabase = createClient('https://placeholder.supabase.co', 'placeholder-anon-key');
}
export { supabase };
