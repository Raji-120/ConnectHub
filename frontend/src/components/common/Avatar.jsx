import React, { useState } from 'react';
import StatusIndicator from './StatusIndicator';

export const Avatar = ({
  src,
  name = 'User',
  size = 'md',
  status,
  className = '',
  onClick,
}) => {
  const [imgError, setImgError] = useState(false);

  const sizeMap = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-24 h-24 text-3xl',
  };

  const getInitials = (n) => {
    if (!n) return 'U';
    const parts = n.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  };

  const fallbackAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
    name
  )}&backgroundColor=4f46e5,0284c7,7c3aed,db2777`;

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full select-none ${
        onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''
      } ${className}`}
    >
      {!imgError && (src || fallbackAvatar) ? (
        <img
          src={src || fallbackAvatar}
          alt={name}
          onError={() => setImgError(true)}
          className={`${sizeMap[size] || sizeMap.md} rounded-full object-cover ring-1 ring-white/10`}
        />
      ) : (
        <div
          className={`${
            sizeMap[size] || sizeMap.md
          } rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 text-white font-semibold flex items-center justify-center shadow-inner`}
        >
          {getInitials(name)}
        </div>
      )}

      {status && (
        <div className="absolute -bottom-0.5 -right-0.5">
          <StatusIndicator
            status={status}
            size={size === 'xl' || size === '2xl' ? 'lg' : size === 'lg' ? 'md' : 'sm'}
          />
        </div>
      )}
    </div>
  );
};

export default Avatar;
