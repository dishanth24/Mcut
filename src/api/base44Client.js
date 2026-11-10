import { createClient } from '@supabase/supabase-js';
import { appParams } from '@/lib/app-params';

const supabaseUrl = appParams.supabaseUrl || import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = appParams.supabaseAnonKey || import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

const TABLE_MAP = {
  Trip: 'trips',
  TripMember: 'trip_members',
  Expense: 'expenses',
  Settlement: 'settlements',
  ActivityEvent: 'activity_events',
  ChatMessage: 'chat_messages',
  ItineraryItem: 'itinerary_items',
  TripInvite: 'trip_invites',
  User: 'profiles',
};

function wrapResult(items) {
  const arr = Array.isArray(items) ? [...items] : [];
  arr.items = arr;
  return arr;
}

function applySort(query, sort) {
  if (!sort) return query;
  const isDesc = typeof sort === 'string' && sort.startsWith('-');
  const column = isDesc ? sort.slice(1) : sort;
  return query.order(column, { ascending: !isDesc });
}

function createEntityHandler(tableName) {
  return {
    async list(options = {}) {
      let query = supabase.from(tableName).select('*');
      if (options.sort) query = applySort(query, options.sort);
      if (typeof options.limit === 'number') query = query.limit(options.limit);

      const { data, error } = await query;
      if (error) {
        console.error(`[base44Client] Query error on ${tableName}.list:`, error);
        throw new Error(error.message);
      }
      return wrapResult(data || []);
    },

    async filter(filters = {}, options = {}) {
      let query = supabase.from(tableName).select('*');
      for (const [key, value] of Object.entries(filters || {})) {
        if (value !== undefined) {
          query = query.eq(key, value);
        }
      }
      if (options.sort) query = applySort(query, options.sort);
      if (typeof options.limit === 'number') query = query.limit(options.limit);

      const { data, error } = await query;
      if (error) {
        console.error(`[base44Client] Query error on ${tableName}.filter:`, error);
        throw new Error(error.message);
      }
      return wrapResult(data || []);
    },

    async get(id) {
      const { data, error } = await supabase.from(tableName).select('*').eq('id', id).maybeSingle();
      if (error) {
        console.error(`[base44Client] Query error on ${tableName}.get:`, error);
        throw error;
      }
      if (!data) {
        const notFound = new Error('Not found');
        notFound.status = 404;
        throw notFound;
      }
      return data;
    },

    async create(payload) {
      const { data, error } = await supabase.from(tableName).insert([payload]).select().single();
      if (error) {
        console.error(`[base44Client] Query error on ${tableName}.create:`, error);
        throw new Error(error.message);
      }
      return data;
    },

    async update(id, payload) {
      const { data, error } = await supabase.from(tableName).update(payload).eq('id', id).select().single();
      if (error) {
        console.error(`[base44Client] Query error on ${tableName}.update:`, error);
        throw new Error(error.message);
      }
      return data;
    },

    async updateMany(match, patch) {
      let query = supabase.from(tableName).update(patch);
      for (const [k, v] of Object.entries(match || {})) {
        query = query.eq(k, v);
      }
      const { data, error } = await query.select();
      if (error) {
        console.error(`[base44Client] Query error on ${tableName}.updateMany:`, error);
        throw new Error(error.message);
      }
      return wrapResult(data || []);
    },

    async delete(id) {
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) {
        console.error(`[base44Client] Query error on ${tableName}.delete:`, error);
        throw new Error(error.message);
      }
      return { id };
    },

    subscribe(callback) {
      const channel = supabase
        .channel(`${tableName}-changes-${Math.random().toString(36).substring(2, 9)}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: tableName },
          (payload) => {
            const type =
              payload.eventType === 'INSERT'
                ? 'create'
                : payload.eventType === 'UPDATE'
                  ? 'update'
                  : 'delete';
            callback({
              type,
              data: payload.new || payload.old,
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    },
  };
}

const entities = new Proxy(
  {},
  {
    get(_target, prop) {
      const tableName = TABLE_MAP[prop] || prop.toLowerCase();
      return createEntityHandler(tableName);
    },
  }
);

export const base44 = {
  auth: {
    async me() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        const err = new Error('Authentication required');
        err.status = 401;
        throw err;
      }

      // Fetch corresponding profile
      let profile = null;
      try {
        const { data, error: profileErr } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
        if (profileErr) {
          console.error('[base44Client] Profile fetch error:', profileErr);
        } else {
          profile = data;
        }
      } catch (e) {
        console.error('[base44Client] Profile query exception:', e);
      }

      const name =
        profile?.display_name ||
        user.user_metadata?.display_name ||
        user.user_metadata?.full_name ||
        (user.email ? user.email.split('@')[0] : 'Traveller');

      // Auto-upsert profile row if missing
      if (!profile) {
        try {
          const { data: newProfile, error: upsertErr } = await supabase
            .from('profiles')
            .upsert(
              {
                id: user.id,
                email: user.email,
                display_name: name,
                role: 'user',
              },
              { onConflict: 'id' }
            )
            .select()
            .maybeSingle();

          if (upsertErr) {
            console.error('[base44Client] Auto profile creation failed:', upsertErr);
          } else if (newProfile) {
            profile = newProfile;
          }
        } catch (e) {
          console.error('[base44Client] Profile upsert exception:', e);
        }
      }

      const onboarded = Boolean(
        profile?.onboarded ??
        user.user_metadata?.onboarded ??
        user.app_metadata?.onboarded ??
        false
      );

      const userData = {
        id: user.id,
        email: user.email,
        full_name: name,
        display_name: name,
        preferred_currency: profile?.preferred_currency || profile?.currency || user.user_metadata?.preferred_currency || 'INR',
        currency: profile?.currency || profile?.preferred_currency || user.user_metadata?.currency || 'INR',
        upi_id: profile?.upi_id || user.user_metadata?.upi_id || '',
        avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url || '',
        role: profile?.role || 'user',
        onboarded,
        created_date: profile?.created_date || user.created_at,
        updated_date: profile?.updated_date || user.updated_at,
      };

      return {
        ...userData,
        data: userData,
      };
    },

    async updateMe(patch = {}) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const profileUpdate = {};
      if (patch.display_name !== undefined) profileUpdate.display_name = patch.display_name;
      if (patch.preferred_currency !== undefined) {
        profileUpdate.preferred_currency = patch.preferred_currency;
        profileUpdate.currency = patch.preferred_currency;
      }
      if (patch.currency !== undefined) {
        profileUpdate.currency = patch.currency;
        profileUpdate.preferred_currency = patch.currency;
      }
      if (patch.upi_id !== undefined) profileUpdate.upi_id = patch.upi_id;
      if (patch.avatar_url !== undefined) profileUpdate.avatar_url = patch.avatar_url;
      if (patch.onboarded !== undefined) profileUpdate.onboarded = patch.onboarded;

      // Always update Supabase auth metadata so onboarding state & profile persist
      try {
        await supabase.auth.updateUser({ data: patch });
      } catch (authErr) {
        console.error('[base44Client] updateUser metadata error:', authErr);
      }

      if (Object.keys(profileUpdate).length > 0) {
        try {
          const { error: profErr } = await supabase.from('profiles').update(profileUpdate).eq('id', user.id);
          if (profErr) {
            console.error('[base44Client] profiles table update error:', profErr);
          }
        } catch (dbErr) {
          console.error('[base44Client] profiles table update exception:', dbErr);
        }
      }

      return base44.auth.me();
    },

    async loginViaEmailPassword(email, password) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('[base44Client] signInWithPassword error:', error);
        throw new Error(error.message);
      }
      if (data?.session?.access_token) {
        window.localStorage.setItem('base44_access_token', data.session.access_token);
        window.localStorage.setItem('token', data.session.access_token);
      }
      return data;
    },

    async register({ email, password }) {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        console.error('[base44Client] signUp error:', error);
        throw new Error(error.message);
      }
      return data;
    },

    async verifyOtp({ email, otpCode }) {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: 'signup',
      });
      if (error) {
        console.error('[base44Client] verifyOtp error:', error);
        throw new Error(error.message);
      }
      if (data?.session?.access_token) {
        window.localStorage.setItem('base44_access_token', data.session.access_token);
        window.localStorage.setItem('token', data.session.access_token);
      }
      return {
        access_token: data.session?.access_token,
        user: data.user,
      };
    },

    async resendOtp(email) {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });
      if (error) {
        console.error('[base44Client] resend error:', error);
        throw new Error(error.message);
      }
      return { success: true };
    },

    async loginWithProvider(provider, returnTo) {
      const redirectTo = returnTo
        ? new URL(returnTo, window.location.origin).href
        : `${window.location.origin}/dashboard`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo },
      });
      if (error) {
        console.error('[base44Client] signInWithOAuth error:', error);
        throw new Error(error.message);
      }
    },

    async resetPasswordRequest(email) {
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) {
        console.error('[base44Client] resetPasswordForEmail error:', error);
        throw new Error(error.message);
      }
      return { success: true };
    },

    async resetPassword({ resetToken, newPassword }) {
      const { data, error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        console.error('[base44Client] updateUser password error:', error);
        throw new Error(error.message);
      }
      return data;
    },

    async logout(redirectUrl) {
      await supabase.auth.signOut();
      window.localStorage.removeItem('base44_access_token');
      window.localStorage.removeItem('token');
      if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    },

    redirectToLogin(redirectUrl) {
      const returnTo = redirectUrl || window.location.pathname;
      window.location.href = `/login?returnTo=${encodeURIComponent(returnTo)}`;
    },

    setToken(token) {
      if (token) {
        window.localStorage.setItem('base44_access_token', token);
        window.localStorage.setItem('token', token);
      }
    },
  },

  entities,
  asServiceRole: { entities },

  integrations: {
    Core: {
      async UploadPublicFile({ file }) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const userId = user?.id || 'anonymous';
        const cleanName = (file.name || 'file').replace(/[^a-zA-Z0-9.-]/g, '_');
        const path = `${userId}/${Date.now()}_${cleanName}`;

        const { error } = await supabase.storage.from('public-avatars').upload(path, file, {
          cacheControl: '3600',
          upsert: true,
        });
        if (error) {
          console.error('[base44Client] UploadPublicFile error:', error);
          throw new Error(error.message);
        }

        const { data: publicData } = supabase.storage.from('public-avatars').getPublicUrl(path);
        return { file_url: publicData.publicUrl };
      },

      async UploadPrivateFile({ file }) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const userId = user?.id || 'anonymous';
        const cleanName = (file.name || 'file').replace(/[^a-zA-Z0-9.-]/g, '_');
        const path = `${userId}/${Date.now()}_${cleanName}`;

        const { error } = await supabase.storage.from('receipts').upload(path, file, {
          cacheControl: '3600',
          upsert: true,
        });
        if (error) {
          console.error('[base44Client] UploadPrivateFile error:', error);
          throw new Error(error.message);
        }

        return { file_uri: path };
      },

      async CreateFileSignedUrl({ file_uri, expires_in = 3600 }) {
        const { data, error } = await supabase.storage.from('receipts').createSignedUrl(file_uri, expires_in);
        if (error) {
          console.error('[base44Client] CreateFileSignedUrl error:', error);
          throw new Error(error.message);
        }
        return { signed_url: data.signedUrl };
      },
    },
  },

  functions: {
    async invoke(functionName, payload = {}) {
      if (functionName === 'joinTrip') {
        const { data, error } = await supabase.rpc('join_trip', { token: payload.token });
        if (!error && data) {
          return { data };
        }
        if (error) {
          console.error('[base44Client] RPC join_trip error:', error);
        }
      }

      // Fallback to Supabase Edge Function invoke
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: payload,
      });
      if (error) {
        console.error(`[base44Client] Edge Function invoke error on ${functionName}:`, error);
        throw new Error(error.message);
      }
      return { data };
    },
  },

  app: {
    async getPublicSettings() {
      return {
        id: 'mcut',
        public_settings: {},
      };
    },
  },
};
