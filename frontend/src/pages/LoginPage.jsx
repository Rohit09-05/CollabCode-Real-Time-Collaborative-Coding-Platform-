import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Code2, Eye, EyeOff, ArrowRight, Sun, Moon } from 'lucide-react';
import { login as apiLogin } from '../api/auth.js';
import { useAuth } from '../hooks/useAuth.js';
import { useTheme } from '../contexts/ThemeContext.jsx';

export default function LoginPage() {
  const { login }      = useAuth();
  const { theme, toggle } = useTheme();
  const navigate       = useNavigate();

  const [form, setForm]       = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => { setForm(f => ({ ...f, [e.target.name]: e.target.value })); setError(''); };

  const handleSubmit = async e => {
    e.preventDefault(); setLoading(true);
    try {
      const { data } = await apiLogin(form);
      login(data.accessToken, data.user);
      navigate('/dashboard', { replace: true });
    } catch (err) { setError(err.response?.data?.message || 'Invalid credentials.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex bg-[#f0f4f8] dark:bg-[#0f1117] transition-colors">
      {/* Theme toggle */}
      <button onClick={toggle}
        className="fixed top-4 right-4 w-9 h-9 rounded-xl flex items-center justify-center
                   bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                   shadow-sm text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors z-10">
        {theme === 'dark' ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-indigo-500" />}
      </button>

      {/* Left panel */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-[#0ea5e9] via-[#3b82f6] to-[#6366f1]
                      flex-col items-center justify-center p-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage:'radial-gradient(circle at 2px 2px,white 1px,transparent 0)', backgroundSize:'28px 28px' }} />
        <div className="relative z-10 max-w-sm text-center text-white">
          <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <Code2 size={38} className="text-white" />
          </div>
          <h1 className="text-5xl font-black mb-4 tracking-tight">CollabCode</h1>
          <p className="text-blue-100 text-lg leading-relaxed mb-10">
            Real-time collaborative coding for teams. Code together, ship faster.
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { dot:'bg-green-400',  label:'Live sync'    },
              { dot:'bg-yellow-400', label:'Multi-cursor' },
              { dot:'bg-pink-400',   label:'Run code'     },
            ].map(f => (
              <div key={f.label} className="bg-white/10 backdrop-blur-sm rounded-2xl px-3 py-3 text-sm font-semibold text-white border border-white/20">
                <span className={`w-2 h-2 ${f.dot} rounded-full inline-block mr-1.5 mb-0.5`} />
                {f.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 items-center justify-center shadow-xl mb-3">
              <Code2 size={24} className="text-white" />
            </div>
            <p className="font-black text-2xl text-gray-900 dark:text-white">CollabCode</p>
          </div>

          <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-1">Sign in</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">Welcome back — let&apos;s get coding.</p>

          {error && (
            <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-900/20 border border-rose-200
                            dark:border-rose-800 text-rose-600 dark:text-rose-300 text-sm rounded-xl px-4 py-3 mb-5">
              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full flex-shrink-0" />{error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="label">Email address</label>
              <input name="email" type="email" autoComplete="email" required
                className="input" placeholder="you@example.com"
                value={form.email} onChange={handleChange} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="label mb-0">Password</label>
                <Link to="/forgot-password"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input name="password" type={showPass ? 'text' : 'password'}
                  autoComplete="current-password" required
                  className="input pr-10" placeholder="••••••••"
                  value={form.password} onChange={handleChange} />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors"
                  aria-label={showPass ? 'Hide' : 'Show'}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading || !form.email || !form.password}
              className="btn-primary w-full py-3 text-base">
              {loading
                ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><span>Sign in</span><ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="font-bold text-blue-600 dark:text-blue-400 hover:underline">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
