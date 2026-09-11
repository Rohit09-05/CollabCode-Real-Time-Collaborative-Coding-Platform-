export default function Avatar({ username, color, size = 'md', className = '' }) {
  const sizes = { sm: 'w-6 h-6 text-xs', md: 'w-8 h-8 text-sm', lg: 'w-10 h-10 text-base' };
  const initial = username ? username[0].toUpperCase() : '?';
  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0 ${className}`}
      style={{ backgroundColor: color || '#60A5FA' }}
      title={username}
    >
      {initial}
    </div>
  );
}
