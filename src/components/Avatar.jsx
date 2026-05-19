import React from 'react';

/**
 * Reusable Avatar component with online status indicators.
 * Supports image URLs, local presets (rendered as SVGs), and text/emoji fallbacks.
 *
 * @param {Object} props
 * @param {string} [props.src] - Image URL for the avatar
 * @param {string} [props.fallback] - Fallback emoji, initial, or preset name/URL
 * @param {boolean} [props.isOnline] - Whether the user is currently online
 * @param {'sm' | 'md' | 'lg' | 'xl'} [props.size='md'] - Size of the avatar
 * @param {string} [props.className] - Additional CSS classes
 */
const Avatar = ({ src, fallback, isOnline, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-3xl',
  };

  const isSvgUrl =
    typeof fallback === 'string' &&
    (fallback.startsWith('/') || fallback.startsWith('http') || fallback.includes('.svg'));

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Online Glow Effect */}
      {isOnline && (
        <div className="absolute inset-0 rounded-full animate-pulse bg-primary/30 blur-md" />
      )}
      <div
        className={`
          ${sizeClasses[size]}
          rounded-full border-2 overflow-hidden flex items-center justify-center bg-brand-surface
          ${isOnline ? 'border-primary grayscale-0' : 'border-slate-600 grayscale'}
          transition-all duration-500 shadow-lg relative z-10
        `}
      >
        {src || isSvgUrl ? (
          <img src={src || fallback} alt="User Avatar" className="w-full h-full object-cover" />
        ) : (
          <span className="select-none">{fallback || '👤'}</span>
        )}
      </div>
    </div>
  );
};

export default Avatar;
