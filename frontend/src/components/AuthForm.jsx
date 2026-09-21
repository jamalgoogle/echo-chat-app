import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';

export default function AuthForm({ mode }) {
  const isRegister = mode === 'register';
  const { login, register } = useAuthStore();
  const [form, setForm] = useState({ email: '', username: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await (isRegister ? register(form) : login(form)); // the route gate redirects once the user is set
    } catch (err) {
      setError(err.response?.data?.error || 'Could not reach the server');
      setBusy(false);
    }
  };

  const field = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-harbor focus:ring-2 focus:ring-harbor/25';

  return (
    <div className="grid min-h-full md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <div className="hidden flex-col justify-end bg-ink p-12 text-slate-100 md:flex">
        <h1 className="text-4xl font-bold leading-tight">Talk it through,<br />in real time.</h1>
        <p className="mt-3 max-w-sm text-slate-400">Private messages, group rooms, and file sharing that arrive the moment you hit send.</p>
      </div>

      <div className="grid place-items-center p-6">
        <form onSubmit={submit} className="w-full max-w-sm space-y-4">
          <h2 className="text-2xl font-semibold">{isRegister ? 'Create your account' : 'Log in'}</h2>

          <label className="block text-sm font-medium">Email
            <input className={`${field} mt-1`} type="email" autoComplete="email" required value={form.email} onChange={set('email')} />
          </label>

          {isRegister && (
            <label className="block text-sm font-medium">Username
              <input className={`${field} mt-1`} autoComplete="username" required minLength={3} maxLength={24} value={form.username} onChange={set('username')} />
            </label>
          )}

          <label className="block text-sm font-medium">Password
            <input className={`${field} mt-1`} type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} required minLength={isRegister ? 8 : 1} value={form.password} onChange={set('password')} />
          </label>

          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

          <button disabled={busy} className="w-full rounded-lg bg-harbor py-2.5 font-semibold text-white hover:bg-harbor/90 disabled:opacity-60">
            {busy ? 'Please wait…' : isRegister ? 'Create account' : 'Log in'}
          </button>

          <p className="text-sm text-slate-600">
            {isRegister ? 'Already have an account?' : 'New here?'}{' '}
            <Link className="font-semibold text-harbor underline" to={isRegister ? '/login' : '/register'}>
              {isRegister ? 'Log in' : 'Create an account'}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
