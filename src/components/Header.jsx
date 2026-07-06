import React from 'react';

/**
 * Header component — displays the title bar with antique styling.
 *
 * @param {Object} props
 * @param {number} props.favCount - Number of favorited/visible skins
 * @param {Function} props.onShowFavorites - Toggle favorites-only filter
 * @param {boolean} props.showFavoritesOnly - Whether favorites filter is active
 */
export default function Header({ favCount = 0, onShowFavorites, showFavoritesOnly }) {
  return (
    <header className="relative w-full py-6 px-4 md:py-8 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Decorative top border */}
        <div className="flex items-center justify-center gap-3 mb-3 opacity-50">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-antique-gold to-transparent" />
          <span className="text-antique-gold text-xs tracking-widest">◆ ◇ ◆</span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-antique-gold to-transparent" />
        </div>

        {/* Title */}
        <div className="text-center mb-2">
          <h1 className="text-3xl md:text-5xl font-bold text-antique-cream tracking-wider"
            style={{ textShadow: '0 2px 12px rgba(201, 164, 75, 0.4)' }}>
            三国杀皮肤画廊
          </h1>
          <p className="text-antique-muted text-sm md:text-base mt-2 tracking-wide">
            珍藏版 · 古董收藏册
          </p>
        </div>

        {/* Quick actions */}
        <div className="flex justify-center items-center gap-4 mt-4">
          <button
            onClick={onShowFavorites}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-full text-sm
              border transition-all duration-300 font-classical
              ${showFavoritesOnly
                ? 'bg-red-900/30 border-red-500/50 text-red-300'
                : 'border-antique-border/50 text-antique-muted hover:border-antique-gold/50 hover:text-antique-gold'
              }
            `}
            title={showFavoritesOnly ? '显示全部' : '仅显示收藏'}
          >
            <span className={showFavoritesOnly ? 'text-red-400' : ''}>
              {showFavoritesOnly ? '❤️' : '🤍'}
            </span>
            <span>收藏夹</span>
            {favCount > 0 && (
              <span className={`
                text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center
                ${showFavoritesOnly
                  ? 'bg-red-500/30 text-red-300'
                  : 'bg-antique-gold/20 text-antique-gold'
                }
              `}>
                {favCount}
              </span>
            )}
          </button>
        </div>

        {/* Decorative bottom border */}
        <div className="flex items-center justify-center gap-3 mt-4 opacity-50">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-antique-gold to-transparent" />
          <span className="text-antique-gold text-xs tracking-widest">◆ ◇ ◆</span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-antique-gold to-transparent" />
        </div>
      </div>
    </header>
  );
}
