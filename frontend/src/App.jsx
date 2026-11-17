import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext.jsx';
import { TimerProvider } from './lib/TimerContext.jsx';
import Layout from './components/Layout.jsx';
import { LoginPage, RegisterPage } from './pages/AuthPages.jsx';
import FocusPage from './pages/FocusPage.jsx';
import TasksPage from './pages/TasksPage.jsx';
import GardenPage from './pages/GardenPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import YardPage from './pages/YardPage.jsx';
import FriendsPage from './pages/FriendsPage.jsx';
import Plant from './components/Plant.jsx';
import Backdrop from './components/Backdrop.jsx';
import Landing from './pages/Landing.jsx';

function Splash({ children }) {
  return (
    <div className="auth"><div className="card auth__card center">
      <Plant type="sunflower" stage="sprout" size={96} title="" />
      {children}
    </div></div>
  );
}

function Gate() {
  const { status, user, retry } = useAuth();
  if (status === 'loading') return <Splash><p role="status">Loading…</p></Splash>;
  if (status === 'offline') {
    return (
      <Splash>
        <h1>You are offline</h1>
        <p className="muted">Rootine needs the internet to keep your timer and garden in sync.</p>
        <button className="btn" onClick={retry}>Retry</button>
      </Splash>
    );
  }
  return (
    <>
    <Backdrop variant={user ? 'soft' : 'full'} />
    <Routes>
      {user ? (
        <Route element={<TimerProvider><Layout /></TimerProvider>}>
          <Route index element={<FocusPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="garden" element={<GardenPage />} />
          <Route path="yard" element={<YardPage />} />
          <Route path="friends" element={<FriendsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      ) : (
        <>
          <Route index element={<Landing />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      )}
    </Routes>
    </>
  );
}

// Shown when a new version of the app has been downloaded.
function UpdateBanner() {
  const [update, setUpdate] = useState(null);
  useEffect(() => {
    import('virtual:pwa-register').then(({ registerSW }) => {
      const run = registerSW({ onNeedRefresh: () => setUpdate(() => () => run(true)) });
    }).catch(() => { /* service workers are optional */ });
  }, []);
  if (!update) return null;
  return (
    <div className="update-banner" role="status">
      New version available.
      <button className="btn btn--small" onClick={update}>Reload</button>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Gate />
        <UpdateBanner />
      </AuthProvider>
    </BrowserRouter>
  );
}
