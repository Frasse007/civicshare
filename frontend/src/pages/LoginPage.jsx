import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import FormField from '../components/FormField.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { validateLogin } from '../utils/validation.js';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // Form state is local (useState): nothing else in the app needs to know about it.
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    const found = validateLogin(form);
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      await login({ email: form.email.trim(), password: form.password });
      navigate(location.state?.from ?? '/catalog', { replace: true });
    } catch (err) {
      setFormError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-card" aria-labelledby="login-title">
      <h1 id="login-title">Welcome back</h1>
      <p className="muted">Log in to manage your loans and tools.</p>
      <form onSubmit={handleSubmit} noValidate>
        <FormField label="Email" name="email" type="email" autoComplete="email" value={form.email} onChange={update} error={errors.email} />
        <FormField label="Password" name="password" type="password" autoComplete="current-password" value={form.password} onChange={update} error={errors.password} />
        {formError && <p className="alert alert--error" role="alert">{formError}</p>}
        <button className="btn btn--primary btn--lg btn--block" disabled={submitting}>
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <p className="auth-card__alt">
        New here? <Link to="/register">Create an account</Link>
      </p>
      <p className="demo-note">
        Demo: <code>member@civicshare.dev</code> / <code>Member123!</code> &middot; Admin: <code>admin@civicshare.dev</code> / <code>Admin123!</code>
      </p>
    </section>
  );
}
