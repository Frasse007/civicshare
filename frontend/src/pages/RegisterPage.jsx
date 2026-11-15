import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FormField from '../components/FormField.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { ApiError } from '../api/client.js';
import { validateRegister } from '../utils/validation.js';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    const found = validateRegister(form);
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      await register({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      navigate('/catalog', { replace: true });
    } catch (err) {
      // Server-side field errors (e.g. duplicate email) are shown next to the field when possible.
      if (err instanceof ApiError && err.status === 409) setErrors({ email: err.message });
      else if (err instanceof ApiError && err.details) setErrors(err.fieldErrors);
      else setFormError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-card" aria-labelledby="register-title">
      <h1 id="register-title">Join CivicShare</h1>
      <p className="muted">Free for neighbors. Borrow tools in under a minute.</p>
      <form onSubmit={handleSubmit} noValidate>
        <FormField label="Full name" name="name" autoComplete="name" value={form.name} onChange={update} error={errors.name} />
        <FormField label="Email" name="email" type="email" autoComplete="email" value={form.email} onChange={update} error={errors.email} />
        <FormField label="Password" name="password" type="password" autoComplete="new-password" hint="At least 8 characters with a letter and a number." value={form.password} onChange={update} error={errors.password} />
        {formError && <p className="alert alert--error" role="alert">{formError}</p>}
        <button className="btn btn--primary btn--lg btn--block" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="auth-card__alt">
        Already a member? <Link to="/login">Log in</Link>
      </p>
    </section>
  );
}
