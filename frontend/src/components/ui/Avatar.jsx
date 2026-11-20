import { User } from 'lucide-react';

function Avatar({ src, name, size = 'md', className, fallback = true }) {
  const sizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base',
    xl: 'w-14 h-14 text-xl',
  };

  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  return (
    <div
      className={`
        rounded-full flex items-center justify-center
        bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold shrink-0
        ${sizes[size]} ${className || ''}
      `}
    >
      {src ? (
        <img
          src={src}
          alt={name || 'User'}
          className="w-full h-full object-cover rounded-full"
        />
      ) : fallback ? (
        initials
      ) : (
        <User className="w-4 h-4" />
      )}
    </div>
  );
}

export default Avatar;