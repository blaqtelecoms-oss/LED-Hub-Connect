import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export function handleOptions(request: Request) {
  return request.method === 'OPTIONS'
    ? new Response('ok', { headers: corsHeaders })
    : null;
}

export async function getCaller(request: Request) {
  const authorization = request.headers.get('Authorization');
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return { error: 'Unauthorized' as const };

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase server environment is not configured.');
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: { user }, error: authError } = await admin.auth.getUser(token);
  if (authError || !user) return { error: 'Unauthorized' as const };

  const { data: appUser, error: appUserError } = await admin
    .from('users')
    .select('*')
    .eq('auth_user_id', user.id)
    .maybeSingle();
  if (appUserError) throw appUserError;

  const appUserId = appUser?.id ?? user.id;
  const { data: profile, error: profileError } = await admin
    .from('user_profile')
    .select('account_type,full_name')
    .eq('user', appUserId)
    .maybeSingle();
  if (profileError) throw profileError;

  return {
    admin,
    user: {
      ...appUser,
      ...profile,
      id: appUserId,
      email: user.email,
      full_name: profile?.full_name ?? user.user_metadata?.full_name ?? '',
      account_type: profile?.account_type ?? appUser?.account_type ?? 'member',
    },
  };
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unexpected server error';
}
