import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Code2, Eye, EyeOff, ArrowRight, Sun, Moon } from 'lucide-react';
import { signup as apiSignup } from '../api/auth.js';
import { useAuth } from '../hooks/useAuth.js';
import { useTheme } from '../contexts/ThemeContext.jsx';

function Field({ id, label, type='text', placeholder, autoComplete, value, onChange, error }) {
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <input id={id} name={id} type={type} autoComplete={autoComplete} required
        className={`input ${error ? 'border-rose-400 focus:ring-rose-400' : ''}`}
        placeholder={placeholder} value={value} onChange={onChange} />
      {error && <p className="text-rose-500 text-xs mt-1.5 font-medium">{error}</p>}
    </div>
  );
}

export default function SignupPage() {
  const { login }         = useAuth();
  const { theme, toggle } = useTheme();
  const navigate          = useNavigate();

  const [form, setForm]           = useState({ username:'', email:'', password:'', confirm:'' });
  const [showPass, setShowPass]   = useState(false);
  const [error, setError]         = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading]     = useState(false);

  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setFieldErrors(fe => ({ ...fe, [e.target.name]: '' }));
    setError('');
  };

  const validate = () => {
    const errs = {};
    if (form.username.length < 3)  errs.username = 'At least 3 characters.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email.';
    if (form.password.length < 8)  errs.password = 'At least 8 characters.';
    if (form.password !== form.confirm) errs.confirm = 'Passwords do not match.';
    return errs;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setLoading(true); setError('');
    try {
      const { data } = await apiSignup({ username: form.username, email: form.email, password: form.password });
      login(data.accessToken, data.user);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message;
      if (msg?.toLowerCase().includes('email'))    setFieldErrors(fe => ({ ...fe, email: msg }));
      else if (msg?.toLowerCase().includes('username')) setFieldErrors(fe => ({ ...fe, username: msg }));
      else setError(msg || 'Signup failed.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6
                    bg-[#f0f4f8] dark:bg-[#0f1117] transition-colors">
      {/* Theme toggle */}
      <button onClick={toggle}
        className="fixed top-4 right-4 w-9 h-9 rounded-xl flex items-center justify-center
                   bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                   shadow-sm text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors z-10">
        {theme === 'dark' ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-indigo-500" />}
      </button>

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0ea5e9] to-[#3b82f6]
                          items-center justify-center shadow-xl shadow-blue-500/25 mb-4">
            <Code2 size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">Create account</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1.5">Join CollabCode and start building together</p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-[#1e2130] rounded-2xl p-7
                        shadow-[0_8px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.5)]
                        border border-gray-100 dark:border-gray-800">
          {error && (
            <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-900/20 border border-rose-200
                            dark:border-rose-800 text-rose-600 dark:text-rose-300 text-sm rounded-xl px-4 py-3 mb-5">
              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full flex-shrink-0" />{error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Field id="username" label="Username" placeholder="coolcoder"
              autoComplete="username" value={form.username} onChange={handleChange} error={fieldErrors.username} />
            <Field id="email" label="Email" type="email" placeholder="you@example.com"
              autoComplete="email" value={form.email} onChange={handleChange} error={fieldErrors.email} />

            <div>
              <label htmlFor="password" className="label">Password</label>
              <div className="relative">
                <input id="password" name="password" type={showPass ? 'text' : 'password'}
                  autoComplete="new-password" required
                  className={`input pr-10 ${fieldErrors.password ? 'border-rose-400 focus:ring-rose-400':''}`}
                  placeholder="Min 8 characters" value={form.password} onChange={handleChange} />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors"
                  aria-label={showPass ? 'Hide':'Show'}>
                  {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
              {fieldErrors.password && <p className="text-rose-500 text-xs mt-1.5 font-medium">{fieldErrors.password}</p>}
            </div>

            <div>
              <label htmlFor="confirm" className="label">Confirm password</label>
              <input id="confirm" name="confirm" type={showPass ? 'text':'password'}
                autoComplete="new-password" required
                className={`input ${fieldErrors.confirm ? 'border-rose-400 focus:ring-rose-400':''}`}
                placeholder="Repeat password" value={form.confirm} onChange={handleChange} />
              {fieldErrors.confirm && <p className="text-rose-500 text-xs mt-1.5 font-medium">{fieldErrors.confirm}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base mt-2">
              {loading
                ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><span>Create account</span><ArrowRight size={16}/></>}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-5">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-blue-600 dark:text-blue-400 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
