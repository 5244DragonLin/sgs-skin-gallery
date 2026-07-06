import React, { useState } from 'react';

/**
 * CollectionBadge — heart-shaped favorite toggle button with animation.
 *
 * @param {Object} props
 * @param {boolean} props.active - Whether the item is favorited
 * @param {Function} props.onToggle - Toggle handler
 * @param {string} [props.size='md'] - Button size: 'sm' | 'md' | 'lg'
 */
export default function CollectionBadge({ active, onToggle, size = 'md' }) {
  const [animating, setAnimating] = useState(false);

  const sizeClasses = {
    sm: 'w-7 h-7 text-sm',
    md: 'w-9 h-9 text-lg',
    lg: 'w-12 h-12 text-2xl',
  };

  const handleClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!active) {
      setAnimating(true);
      setTimeout(() => setAnimating(false), 600);
    }
    onToggle();
  };

  return (
    <button
      onClick={handleClick}
      className={`
        fav-btn ${sizeClasses[size]}
        ${active ? 'active' : ''}
        ${animating ? 'animate-heart-beat' : ''}
        z-10
      `}
      title={active ? '取消收藏' : '加入收藏'}
      aria-label={active ? '取消收藏' : '加入收藏'}
    >
      {active ? '❤️' : '🤍'}
    </button>
  );
}
