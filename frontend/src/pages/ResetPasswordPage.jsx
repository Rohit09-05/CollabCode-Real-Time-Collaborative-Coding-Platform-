import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Code2, Eye, EyeOff, ArrowLeft, Sun, Moon, CheckCircle, XCircle } from 'lucide-react';
import { resetPassword, verifyResetToken } from '../api/auth.js';
import { useTheme } from '../contexts/ThemeContext.jsx';

export default function ResetPasswordPage() {
  const { theme, toggle }     = useTheme();
  const navigate              = useNavigate();
  const [searchParams]        = useSearchParams();
  const token                 = searchParams.get('token');

  const [tokenValid, setTokenValid]   = useState(null); // null=checking, true, false
  const [password, setPassword]       = useState('');
  const [confirm, setConfirm]         = useState('');
  const [showPass, setShowPass]       = useState(false);
  const [loading, setLoading]         = useState(false);
  const [done, setDone]               = useState(false);
  const [error, setError]             = useState('');

  // Verify token on mount
  useEffect(() => {
    if (!token) { setTokenValid(false); return; }
    verifyResetToken(token)
      .then(({ data }) => setTokenValid(data.valid))
      .catch(() => setTokenValid(false));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }

    setLoading(true);
    try {
      await resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate('/login', { replace: true }), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
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
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Set new password</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1.5">
            Must be at least 8 characters.
          </p>
        </div>

        <div className="bg-white dark:bg-[#1e2130] rounded-2xl p-7
                        shadow-[0_8px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.5)]
                        border border-gray-100 dark:border-gray-800">

          {/* Checking token */}
          {tokenValid === null && (
            <div className="text-center py-8">
              <span className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin inline-block" />
              <p className="text-gray-500 text-sm mt-3">Verifying your link…</p>
            </div>
          )}

          {/* Invalid token */}
          {tokenValid === false && (
            <div className="text-center py-4">
              <div className="inline-flex w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-900/20
                              items-center justify-center mb-4">
                <XCircle size={32} className="text-rose-500" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                Link expired or invalid
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                This password reset link is invalid or has expired.
                Please request a new one.
              </p>
              <Link to="/forgot-password" className="btn-primary w-full justify-center">
                Request new link
              </Link>
            </div>
          )}

          {/* Success */}
          {done && (
            <div className="text-center py-4">
              <div className="inline-flex w-16 h-16 rounded-full bg-green-50 dark:bg-green-900/20
                              items-center justify-center mb-4">
                <CheckCircle size={32} className="text-green-500" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                Password updated!
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
                Your password has been reset successfully.
              </p>
              <p className="text-gray-400 text-xs">Redirecting to sign in…</p>
            </div>
          )}

          {/* Form */}
          {tokenValid === true && !done && (
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
                <label htmlFor="password" className="label">New password</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPass ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    className="input pr-10"
                    placeholder="Min 8 characters"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); }}
                  />
                  <button type="button" onClick={() => setShowPass(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors"
                    aria-label={showPass ? 'Hide' : 'Show'}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {/* Strength bar */}
                {password && (
                  <div className="mt-2 flex gap-1">
                    {[1,2,3,4].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                        password.length >= i * 4
                          ? i <= 1 ? 'bg-rose-400'
                          : i <= 2 ? 'bg-amber-400'
                          : i <= 3 ? 'bg-blue-400'
                          : 'bg-green-500'
                          : 'bg-gray-200 dark:bg-gray-700'
                      }`} />
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="confirm" className="label">Confirm new password</label>
                <input
                  id="confirm"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  className={`input ${confirm && confirm !== password ? 'border-rose-400 focus:ring-rose-400' : ''}`}
                  placeholder="Repeat password"
                  value={confirm}
                  onChange={e => { setConfirm(e.target.value); setError(''); }}
                />
                {confirm && confirm !== password && (
                  <p className="text-rose-500 text-xs mt-1 font-medium">Passwords do not match.</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !password || !confirm}
                className="btn-primary w-full py-3 text-base"
              >
                {loading
                  ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : 'Reset password'}
              </button>
            </form>
          )}
        </div>

        {!done && (
          <Link to="/login"
            className="flex items-center justify-center gap-2 text-sm text-gray-500
                       dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200
                       transition-colors mt-5 font-medium">
            <ArrowLeft size={15} /> Back to sign in
          </Link>
        )}
      </div>
    </div>
  );
}
