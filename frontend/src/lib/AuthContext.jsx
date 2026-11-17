import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as api from './api.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const DEFAULT_SETTINGS = {
  focusMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15, longBreakInterval: 4,
  soundEnabled: true, notificationsEnabled: false, dailyGoal: 4, theme: 'light',
};

export function AuthProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', user: null }); // loading | ready | offline
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [limits, setLimits] = useState(null);

  const loadSettings = useCallback(async () => {
    const data = await api.get('/settings');
    setSettings(data.settings);
    setLimits(data.limits);
    return data.settings;
  }, []);

  const boot = useCallback(async () => {
    setState((s) => ({ ...s, status: 'loading' }));
    try {
      const me = await api.get('/auth/me');
      api.setCsrfToken(me.csrfToken);
      if (me.user) await loadSettings();
      setState({ status: 'ready', user: me.user });
    } catch (err) {
      if (err.status === 0) setState({ status: 'offline', user: null });
      else setState({ status: 'ready', user: null });
    }
  }, [loadSettings]);

  useEffect(() => { boot(); }, [boot]);

  // Apply the saved theme to the whole page.
  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', settings.theme === 'dark' ? '#17231f' : '#2F5D50');
  }, [settings.theme]);

  const enter = useCallback(async (data) => {
    api.setCsrfToken(data.csrfToken);
    await loadSettings();
    setState({ status: 'ready', user: data.user });
  }, [loadSettings]);

  const value = {
    ...state,
    settings,
    limits,
    retry: boot,
    login: async (email, password) => enter(await api.post('/auth/login', { email, password })),
    register: async (details) => enter(await api.post('/auth/register', details)),
    logout: async () => {
      try { await api.post('/auth/logout'); } catch { /* the cookie is cleared by the next load anyway */ }
      api.setCsrfToken('');
      setSettings(DEFAULT_SETTINGS);
      setState({ status: 'ready', user: null });
    },
    // Called when any request answers 401 (session ended).
    sessionEnded: () => setState((s) => (s.user ? { status: 'ready', user: null, ended: true } : s)),
    saveSettings: async (changes) => {
      const data = await api.put('/settings', changes);
      setSettings(data.settings);
      return data.settings;
    },
    updateUser: (user) => setState((s) => ({ ...s, user })),
    clearEnded: () => setState((s) => ({ ...s, ended: false })),
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
