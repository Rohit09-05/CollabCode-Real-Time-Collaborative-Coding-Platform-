export default function ConnectionBadge({ connected }) {
  return (
    <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
      connected
        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400'
        : 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 text-rose-500 dark:text-rose-400'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
        connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
      }`} />
      {connected ? 'Connected' : 'Offline'}
    </div>
  );
}
