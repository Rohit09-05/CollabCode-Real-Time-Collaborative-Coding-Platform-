import { Link } from 'react-router-dom';
import { Code2, LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { useTheme } from '../contexts/ThemeContext.jsx';
import Avatar from './Avatar.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();

  return (
    <header className="h-14 flex items-center px-6 gap-4 flex-shrink-0
                       bg-white dark:bg-[#1a1d27]
                       border-b border-gray-200 dark:border-gray-800
                       shadow-[0_1px_8px_rgba(0,0,0,0.06)] dark:shadow-[0_1px_8px_rgba(0,0,0,0.3)]">
      {/* Logo */}
      <Link to="/dashboard" className="flex items-center gap-2.5 group">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0ea5e9] to-[#3b82f6]
                        flex items-center justify-center shadow-md shadow-blue-500/30
                        group-hover:shadow-lg group-hover:shadow-blue-500/40 transition-shadow">
          <Code2 size={16} className="text-white" />
        </div>
        <span className="font-black text-lg text-gray-900 dark:text-white hidden sm:block tracking-tight">
          CollabCode
        </span>
      </Link>

      <div className="flex-1" />

      {/* Theme toggle */}
      <button
        onClick={toggle}
        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all
                   bg-gray-100 dark:bg-gray-800
                   border border-gray-200 dark:border-gray-700
                   text-gray-500 hover:text-gray-800 dark:hover:text-gray-100
                   hover:bg-gray-200 dark:hover:bg-gray-700"
        title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        aria-label="Toggle theme"
      >
        {theme === 'dark'
          ? <Sun  size={16} className="text-amber-400" />
          : <Moon size={16} className="text-indigo-500" />}
      </button>

      {/* User pill */}
      {user && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl
                          bg-gray-100 dark:bg-gray-800
                          border border-gray-200 dark:border-gray-700">
            <Avatar username={user.username} color={user.avatarColor} size="sm" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 hidden sm:block">
              {user.username}
            </span>
          </div>
          <button
            onClick={logout}
            className="w-9 h-9 rounded-xl flex items-center justify-center
                       bg-gray-100 dark:bg-gray-800
                       border border-gray-200 dark:border-gray-700
                       text-gray-400 hover:text-rose-500 dark:hover:text-rose-400
                       hover:bg-rose-50 dark:hover:bg-rose-900/20
                       hover:border-rose-200 dark:hover:border-rose-800
                       transition-all"
            title="Logout" aria-label="Logout"
          >
            <LogOut size={15} />
          </button>
        </div>
      )}
    </header>
  );
}
