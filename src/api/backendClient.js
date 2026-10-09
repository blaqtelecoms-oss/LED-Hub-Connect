import { supabase } from '@/utils/supabase';

const DOCUMENTS_BUCKET = 'private-documents';
const SIGNED_URL_TTL_SECONDS = 60 * 60;
const edgeFunctionNames = {
  submitVerificationApplication: 'submit-verification-application',
  decideVerificationApplication: 'decide-verification-application',
};

/** @param {string} entityName */
function toTableName(entityName) {
  if (entityName === 'User') return 'users';
  return entityName.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`).replace(/^_/, '');
}

function withOrdering(query, sort) {
  const value = typeof sort === 'string' ? sort : '-created_date';
  const descending = value.startsWith('-');
  const column = descending ? value.slice(1) : value;
  return query.order(column, { ascending: !descending });
}

function withFilters(query, filters = {}) {
  return Object.entries(filters).reduce((result, [column, value]) => {
    if (Array.isArray(value)) {
      return result.in(column, value);
    }
    if (value === null) {
      return result.is(column, null);
    }
    return result.eq(column, value);
  }, query);
}

function throwIfError({ data, error }) {
  if (error) throw error;
  return data;
}

async function currentAppUserId() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user) return null;

  const { data, error: profileError } = await supabase
    .from('users')
    .select('id')
    .eq('auth_user_id', user.id)
    .maybeSingle();
  if (profileError) throw profileError;
  return data?.id ?? user.id;
}

/** @param {string} entityName */
function createEntityClient(entityName) {
  const tableName = toTableName(entityName);

  const withUserProfiles = async (result) => {
    const users = throwIfError(result);
    if (entityName !== 'User' || !users?.length) return users;

    const { data: profiles, error } = await supabase
      .from('user_profile')
      .select('user,full_name,email');
    if (error) throw error;
    const byUserId = new Map((profiles || []).map((profile) => [profile.user, profile]));
    return users.map((appUser) => ({
      ...appUser,
      ...byUserId.get(appUser.id),
    }));
  };

  return {
    async list(sort = '-created_date') {
      return withUserProfiles(await withOrdering(supabase.from(tableName).select('*'), sort));
    },
    async filter(filters = {}, sort = '-created_date') {
      return withUserProfiles(
        await withOrdering(withFilters(supabase.from(tableName).select('*'), filters), sort)
      );
    },
    async get(id) {
      return throwIfError(await supabase.from(tableName).select('*').eq('id', id).single());
    },
    async create(record) {
      const userId = await currentAppUserId();
      const payload = {
        ...record,
        ...(userId && !record.created_by_id ? { created_by_id: userId } : {}),
      };
      return throwIfError(await supabase.from(tableName).insert(payload).select().single());
    },
    async bulkCreate(records) {
      const userId = await currentAppUserId();
      const payload = records.map((record) => ({
        ...record,
        ...(userId && !record.created_by_id ? { created_by_id: userId } : {}),
      }));
      return throwIfError(await supabase.from(tableName).insert(payload).select());
    },
    async update(id, changes) {
      return throwIfError(await supabase.from(tableName).update(changes).eq('id', id).select().single());
    },
    async delete(id) {
      return throwIfError(await supabase.from(tableName).delete().eq('id', id).select().single());
    },
  };
}

/** @type {Record<string, ReturnType<typeof createEntityClient>>} */
const entities = new Proxy({}, {
  get(_target, entityName) {
    if (typeof entityName !== 'string') return undefined;
    return createEntityClient(entityName);
  },
});

const auth = {
  async me() {
    const { data: { user: authUser }, error } = await supabase.auth.getUser();
    if (error) throw error;
    if (!authUser) throw new Error('No authenticated user');

    const { data: appUser, error: appUserError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', authUser.id)
      .maybeSingle();
    if (appUserError) throw appUserError;

    const userId = appUser?.id ?? authUser.id;
    const { data: profile, error: profileError } = await supabase
      .from('user_profile')
      .select('*')
      .eq('user', userId)
      .maybeSingle();
    if (profileError) throw profileError;

    return {
      ...appUser,
      ...profile,
      id: userId,
      email: authUser.email,
      full_name: profile?.full_name ?? authUser.user_metadata?.full_name ?? '',
      account_type: appUser?.role === 'admin'
        ? 'officer'
        : profile?.account_type ?? appUser?.account_type ?? 'member',
    };
  },
  async loginViaEmailPassword(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },
  async register({ email, password }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    if (error) throw error;
    return data;
  },
  async verifyOtp({ email, otpCode }) {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otpCode,
      type: 'signup',
    });
    if (error) throw error;
    return data;
  },
  async resendOtp(email) {
    const { error } = await supabase.auth.resend({ email, type: 'signup' });
    if (error) throw error;
  },
  async loginWithProvider(provider, returnTo = '/') {
    const redirectTo = new URL(returnTo, window.location.origin).toString();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
    if (error) throw error;
    return data;
  },
  async logout(redirectTo) {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    if (typeof redirectTo === 'string') window.location.assign(redirectTo);
  },
  redirectToLogin(returnTo = window.location.href) {
    const path = `${window.location.pathname}${window.location.search}`;
    const destination = path === '/login' ? '/' : path;
    window.location.assign(`/login?returnTo=${encodeURIComponent(destination || returnTo)}`);
  },
  async updateMe(changes) {
    const userId = await currentAppUserId();
    if (!userId) throw new Error('You must be signed in to update your profile.');

    const profileChanges = Object.fromEntries(
      Object.entries(changes).filter(([key]) => key === 'full_name')
    );
    const userChanges = Object.fromEntries(
      Object.entries(changes).filter(([key]) => key !== 'full_name')
    );

    if (Object.keys(userChanges).length > 0) {
      const { error } = await supabase.from('users').update(userChanges).eq('id', userId);
      if (error) throw error;
    }

    if (Object.keys(profileChanges).length > 0) {
      const { data: profile, error: profileError } = await supabase
        .from('user_profile')
        .select('id')
        .eq('user', userId)
        .maybeSingle();
      if (profileError) throw profileError;

      if (profile) {
        const { error } = await supabase.from('user_profile').update(profileChanges).eq('id', profile.id);
        if (error) throw error;
      }
      const { error } = await supabase.auth.updateUser({ data: profileChanges });
      if (error) throw error;
    }
  },
  async resetPasswordRequest(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  },
  async resetPassword({ newPassword }) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  },
};

const storage = {
  async uploadPrivateFile({ file }) {
    const userId = await currentAppUserId();
    if (!userId) throw new Error('You must be signed in to upload a file.');
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${userId}/${crypto.randomUUID()}-${safeName}`;
    const { error } = await supabase.storage.from(DOCUMENTS_BUCKET).upload(path, file);
    if (error) throw error;
    return { file_uri: path };
  },
  async createSignedUrl({ file_uri }) {
    const { data, error } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .createSignedUrl(file_uri, SIGNED_URL_TTL_SECONDS);
    if (error) throw error;
    return { signed_url: data.signedUrl };
  },
};

export const backend = {
  entities,
  auth,
  storage,
  functions: {
    async invoke(name, options) {
      const functionName = edgeFunctionNames[name] ?? name;
      const { data, error } = await supabase.functions.invoke(functionName, { body: options });
      if (error) {
        if (error.context instanceof Response) {
          const responseBody = await error.context.json();
          if (typeof responseBody?.error === 'string') throw new Error(responseBody.error);
        }
        throw error;
      }
      return { data };
    },
  },
};
