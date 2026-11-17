import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext.jsx';
import { Field, FormError } from '../components/ui.jsx';
import Plant from '../components/Plant.jsx';

function PasswordInput({ show, ...props }) {
  return <input type={show ? 'text' : 'password'} {...props} />;
}

function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className="auth">
      <div className="card auth__card">
        <div className="auth__mascot"><Plant type="sunflower" stage="full" size={96} title="" /></div>
        <h1>{title}</h1>
        <p className="muted">{subtitle}</p>
        {children}
        <p className="auth__footer">{footer}</p>
      </div>
    </div>
  );
}

export function LoginPage() {
  const { login, ended, clearEnded } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [fields, setFields] = useState({});
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setFields({}); clearEnded();
    setBusy(true);
    try { await login(form.email, form.password); navigate('/', { replace: true }); }
    catch (err) { setError(err.fields && Object.keys(err.fields).length ? '' : err.message); setFields(err.fields || {}); }
    finally { setBusy(false); }
  };

  return (
    <AuthCard title="Welcome back" subtitle="Log in to keep growing your garden."
      footer={<>New here? <Link to="/register">Create account</Link></>}>
      {ended && <p className="notice" role="status">Your session ended. Log in again to continue.</p>}
      <form onSubmit={submit} noValidate>
        <Field label="Email" error={fields.email}>
          {(p) => <input {...p} type="email" autoComplete="email" inputMode="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />}
        </Field>
        <Field label="Password" error={fields.password}>
          {(p) => <PasswordInput {...p} show={show} autoComplete="current-password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />}
        </Field>
        <label className="check"><input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} /> Show password</label>
        <FormError>{error}</FormError>
        <button className="btn btn--block" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
      </form>
    </AuthCard>
  );
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '' });
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [fields, setFields] = useState({});
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const local = {};
    if (form.confirmPassword && form.password !== form.confirmPassword) local.confirmPassword = 'Passwords do not match.';
    if (!form.confirmPassword) local.confirmPassword = 'Confirm your password.';
    if (Object.keys(local).length) { setFields(local); return; }
    setFields({});
    setBusy(true);
    try { await register(form.email, form.password, form.confirmPassword); navigate('/', { replace: true }); }
    catch (err) { setFields(err.fields || {}); setError(err.fields && Object.keys(err.fields).length ? '' : err.message); }
    finally { setBusy(false); }
  };

  return (
    <AuthCard title="Plant your first seed" subtitle="Create an account. It only takes a moment."
      footer={<>Already have an account? <Link to="/login">Log in</Link></>}>
      <form onSubmit={submit} noValidate>
        <Field label="Email" error={fields.email}>
          {(p) => <input {...p} type="email" autoComplete="email" inputMode="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />}
        </Field>
        <Field label="Password" hint="At least 8 characters." error={fields.password}>
          {(p) => <PasswordInput {...p} show={show} autoComplete="new-password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />}
        </Field>
        <Field label="Confirm password" error={fields.confirmPassword}>
          {(p) => <PasswordInput {...p} show={show} autoComplete="new-password" required value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />}
        </Field>
        <label className="check"><input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} /> Show passwords</label>
        <FormError>{error}</FormError>
        <button className="btn btn--block" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
      </form>
    </AuthCard>
  );
}
