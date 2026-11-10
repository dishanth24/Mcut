const isNode = typeof window === 'undefined';

const isClearAccessTokenRequested = () =>
  !isNode && new URLSearchParams(window.location.search).get('clear_access_token') === 'true';

const clearStoredAccessToken = () => {
  if (isNode) return;
  window.localStorage.removeItem('base44_access_token');
  window.localStorage.removeItem('token');
};

const getAccessToken = () => {
  if (isNode) return null;
  // Look for standalone token or Supabase session tokens in localStorage
  const directToken = window.localStorage.getItem('token') || window.localStorage.getItem('base44_access_token');
  if (directToken) return directToken;

  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
      try {
        const parsed = JSON.parse(window.localStorage.getItem(key) || '{}');
        if (parsed?.access_token) return parsed.access_token;
      } catch {}
    }
  }
  return null;
};

const getAppParams = () => {
  if (isClearAccessTokenRequested()) {
    clearStoredAccessToken();
  }
  return {
    appId: import.meta.env.VITE_BASE44_APP_ID || '000000000000000000000000',
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    token: getAccessToken(),
  };
};

export const appParams = {
  ...getAppParams(),
};
