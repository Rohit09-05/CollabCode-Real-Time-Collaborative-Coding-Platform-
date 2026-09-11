import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Code2, Mail, ArrowLeft, Sun, Moon, CheckCircle } from 'lucide-react';
import { forgotPassword } from '../api/auth.js';
import { useTheme } from '../contexts/ThemeContext.jsx';

export default function ForgotPasswordPage() {
  const { theme, toggle } = useTheme();
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true); setError('');
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6
                    bg-[#f0f4f8] dark:bg-[#0f1117] transition-colors">
      {/* Theme toggle */}
      <button onClick={toggle}
        className="fixed top-4 right-4 w-9 h-9 rounded-xl flex items-center justify-center
                   bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                   shadow-sm text-gray-400 hover:text-gray-700 dark:hover:text-gray-200
                   transition-colors z-10">
        {theme === 'dark' ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-indigo-500" />}
      </button>

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0ea5e9] to-[#3b82f6]
                          items-center justify-center shadow-xl shadow-blue-500/25 mb-4">
            <Code2 size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Forgot password?</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1.5">
            No worries — we'll send you reset instructions.
          </p>
        </div>

        <div className="bg-white dark:bg-[#1e2130] rounded-2xl p-7
                        shadow-[0_8px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.5)]
                        border border-gray-100 dark:border-gray-800">

          {sent ? (
            /* ── Success state ── */
            <div className="text-center py-4">
              <div className="inline-flex w-16 h-16 rounded-full bg-green-50 dark:bg-green-900/20
                              items-center justify-center mb-4">
                <CheckCircle size={32} className="text-green-500" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                Check your email
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">
                We sent a password reset link to
              </p>
              <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm mb-6">
                {email}
              </p>
              <p className="text-gray-400 text-xs mb-6">
                Didn't receive it? Check your spam folder or{' '}
                <button
                  onClick={() => setSent(false)}
                  className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                >
                  try again
                </button>
              </p>
              <Link to="/login" className="btn-primary w-full justify-center">
                Back to sign in
              </Link>
            </div>
          ) : (
            /* ── Form state ── */
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {error && (
                <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-900/20
                                border border-rose-200 dark:border-rose-800
                                text-rose-600 dark:text-rose-300 text-sm rounded-xl px-4 py-3">
                  <span className="w-1.5 h-1.5 bg-rose-500 rounded-full flex-shrink-0" />
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="label">Email address</label>
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="off"
                    required
                    className="input pl-10"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); }}
                  />
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="btn-primary w-full py-3 text-base"
              >
                {loading
                  ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : 'Send reset link'}
              </button>
            </form>
          )}
        </div>

        <Link
          to="/login"
          className="flex items-center justify-center gap-2 text-sm text-gray-500
                     dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200
                     transition-colors mt-5 font-medium"
        >
          <ArrowLeft size={15} /> Back to sign in
        </Link>
      </div>
    </div>
  );
}
