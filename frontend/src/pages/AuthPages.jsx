import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext.jsx';
import { Field, FormError } from '../components/ui.jsx';
import GrowingPlant from '../components/GrowingPlant.jsx';

export const GENDER_OPTIONS = [
  { value: 'female', label: 'Female', emoji: '🌸' },
  { value: 'male', label: 'Male', emoji: '🌵' },
  { value: 'non_binary', label: 'Non-binary', emoji: '🌈' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say', emoji: '🍃' },
];

function PasswordInput({ show, ...props }) {
  return <input type={show ? 'text' : 'password'} {...props} />;
}

function AuthCard({ title, subtitle, children, footer, growth = 1 }) {
  return (
    <div className="auth">
      <Link to="/" className="auth__home brand"><span aria-hidden="true">🌿</span> Rootine</Link>
      <div className="card auth__card">
        <div className="auth__mascot"><GrowingPlant type="sunflower" progress={growth} size={104} title="" /></div>
        <h1>{title}</h1>
        <p className="muted auth__subtitle">{subtitle}</p>
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
    <AuthCard title="Welcome back!" subtitle="Your garden missed you. Log in to keep growing."
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

const STEP1 = ['displayName', 'fullName', 'age', 'gender'];

// Same rules as the server. The server checks again.
function checkAbout(f) {
  const e = {};
  if (!f.displayName.trim()) e.displayName = 'Enter the name you want us to call you.';
  else if (f.displayName.trim().length > 40) e.displayName = 'Use at most 40 characters.';
  const full = f.fullName.trim();
  if (full.length < 2) e.fullName = 'Enter your full name.';
  else if (full.length > 100) e.fullName = 'Use at most 100 characters.';
  else if (!/^[\p{L}\p{M}][\p{L}\p{M}\s.'\u2019-]*$/u.test(full)) e.fullName = "Use letters, spaces, and . ' - only.";
  const age = Number(f.age);
  if (f.age === '' || !Number.isInteger(age)) e.age = 'Enter your age as a whole number.';
  else if (age < 5 || age > 120) e.age = 'Age must be between 5 and 120.';
  if (!f.gender) e.gender = 'Choose one of the options.';
  return e;
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ displayName: '', fullName: '', age: '', gender: '', email: '', password: '', confirmPassword: '' });
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [fields, setFields] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const next = (e) => {
    e.preventDefault();
    const problems = checkAbout(form);
    setFields(problems);
    if (!Object.keys(problems).length) setStep(2);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const local = {};
    if (!form.confirmPassword) local.confirmPassword = 'Confirm your password.';
    else if (form.password !== form.confirmPassword) local.confirmPassword = 'Passwords do not match.';
    if (Object.keys(local).length) { setFields(local); return; }
    setFields({});
    setBusy(true);
    try {
      await register({ ...form, displayName: form.displayName.trim(), fullName: form.fullName.trim(), age: Number(form.age) });
      navigate('/', { replace: true });
    } catch (err) {
      const f = err.fields || {};
      setFields(f);
      setError(Object.keys(f).length ? '' : err.message);
      if (STEP1.some((k) => f[k])) setStep(1); // show the problem where it is
    } finally { setBusy(false); }
  };

  return (
    <AuthCard
      growth={step === 1 ? 0.35 : 0.8}
      title={step === 1 ? 'Let’s get to know you!' : 'Almost there!'}
      subtitle={step === 1 ? 'Tell us a little about yourself.' : 'Set up your login and start growing.'}
      footer={<>Already have an account? <Link to="/login">Log in</Link></>}>
      <p className="steps-dots" aria-label={`Step ${step} of 2`}>
        <span className={`dot ${step >= 1 ? 'is-on' : ''}`} />
        <span className={`dot ${step >= 2 ? 'is-on' : ''}`} />
        <span className="small muted">Step {step} of 2</span>
      </p>

      {step === 1 && (
        <form onSubmit={next} noValidate>
          <Field label="What should we call you?" hint="Your nickname. We show this in the app." error={fields.displayName}>
            {(p) => <input {...p} autoComplete="nickname" maxLength={40} value={form.displayName} onChange={set('displayName')} />}
          </Field>
          <Field label="Full name" error={fields.fullName}>
            {(p) => <input {...p} autoComplete="name" maxLength={100} value={form.fullName} onChange={set('fullName')} />}
          </Field>
          <Field label="Age" error={fields.age}>
            {(p) => <input {...p} type="number" inputMode="numeric" min="5" max="120" value={form.age} onChange={set('age')} />}
          </Field>
          <fieldset className="chips" aria-describedby={fields.gender ? 'gender-err' : undefined}>
            <legend>Gender</legend>
            {GENDER_OPTIONS.map((g) => (
              <label key={g.value} className={`chip-option ${form.gender === g.value ? 'is-selected' : ''}`}>
                <input type="radio" name="gender" value={g.value} checked={form.gender === g.value} onChange={set('gender')} />
                <span aria-hidden="true">{g.emoji}</span> {g.label}
              </label>
            ))}
            {fields.gender && <p className="error" id="gender-err" role="alert"><span aria-hidden="true">⚠ </span>{fields.gender}</p>}
          </fieldset>
          <button className="btn btn--block">Next</button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={submit} noValidate>
          <Field label="Email" error={fields.email}>
            {(p) => <input {...p} type="email" autoComplete="email" inputMode="email" required value={form.email} onChange={set('email')} autoFocus />}
          </Field>
          <Field label="Password" hint="At least 8 characters." error={fields.password}>
            {(p) => <PasswordInput {...p} show={show} autoComplete="new-password" required value={form.password} onChange={set('password')} />}
          </Field>
          <Field label="Confirm password" error={fields.confirmPassword}>
            {(p) => <PasswordInput {...p} show={show} autoComplete="new-password" required value={form.confirmPassword} onChange={set('confirmPassword')} />}
          </Field>
          <label className="check"><input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} /> Show passwords</label>
          <FormError>{error}</FormError>
          <div className="row">
            <button type="button" className="btn btn--ghost" onClick={() => { setStep(1); setFields({}); }}>Back</button>
            <button className="btn grow-btn" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
          </div>
        </form>
      )}
    </AuthCard>
  );
}
