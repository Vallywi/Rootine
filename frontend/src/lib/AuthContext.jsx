import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as api from './api.js';
import { disablePush } from './push.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const DEFAULT_SETTINGS = {
  focusMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15, longBreakInterval: 4,
  soundEnabled: true, notificationsEnabled: false, dailyGoal: 4, theme: 'light', shareProgress: true,
};

export function AuthProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', user: null }); // loading | ready | offline
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [limits, setLimits] = useState(null);
  const [demo, setDemo] = useState(false); // development only: 1 minute sessions and unlocked trees

  const loadSettings = useCallback(async () => {
    const data = await api.get('/settings');
    setSettings(data.settings);
    setLimits(data.limits);
    setDemo(!!data.demo);
    return data.settings;
  }, []);

  const boot = useCallback(async () => {
    setState((s) => ({ ...s, status: 'loading' }));
    try {
      const me = await api.get('/auth/me');
      api.setCsrfToken(me.csrfToken);
      if (me.user) await loadSettings();
      else {
        // Signed out: use the light/dark choice remembered in this browser.
        try {
          const stored = localStorage.getItem('rootine.theme');
          if (stored === 'dark' || stored === 'light') setSettings((s) => ({ ...s, theme: stored }));
        } catch { /* storage may be blocked */ }
      }
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
    demo,
    // One tap light/dark. Saved to the account when signed in, otherwise remembered in this browser.
    toggleTheme: async () => {
      const next = settings.theme === 'dark' ? 'light' : 'dark';
      if (state.user) {
        try { setSettings((await api.put('/settings', { theme: next })).settings); } catch { /* keep the current theme */ }
      } else {
        setSettings((s) => ({ ...s, theme: next }));
        try { localStorage.setItem('rootine.theme', next); } catch { /* ignore */ }
      }
    },
    login: async (email, password) => enter(await api.post('/auth/login', { email, password })),
    register: async (details) => enter(await api.post('/auth/register', details)),
    logout: async () => {
      await disablePush(); // this device must not get the next person's alerts
      try { await api.post('/auth/logout'); } catch { /* the cookie is cleared by the next load anyway */ }
      api.setCsrfToken('');
      setSettings((s) => ({ ...DEFAULT_SETTINGS, theme: s.theme })); // keep the look the user was seeing
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
