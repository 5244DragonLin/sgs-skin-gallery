import React from 'react';
import SkinCard from './SkinCard';

const QUALITY_ORDER = ['原画', '普通', '稀有', '史诗', '传说', '限定', '绝版'];

/**
 * SkinGrid — renders a responsive grid of skin cards, sorted by quality.
 *
 * @param {Object} props
 * @param {Array} props.generals - Array of general objects with skins
 * @param {Function} props.onSkinClick - Click handler: (general, skin) => void
 * @param {Function} props.isFavorite - Check if skin is favorite: (generalId, skinId) => boolean
 * @param {Function} props.onToggleFavorite - Toggle favorite: (generalId, skinId) => void
 * @param {boolean} props.showFavoritesOnly - Whether to show only favorites
 * @param {string} props.activeQuality - Current quality filter
 * @param {string} props.activeCollection - Current collection filter
 */
export default function SkinGrid({
  generals = [],
  onSkinClick,
  isFavorite,
  onToggleFavorite,
  showFavoritesOnly = false,
  activeQuality = 'all',
  activeCollection = 'all',
}) {
  // Flatten generals into skin entries, applying quality/collection filter and sorting
  const entries = [];
  for (const general of generals) {
    // Sort skins by quality
    const sortedSkins = [...general.skins].sort((a, b) => {
      const ai = QUALITY_ORDER.indexOf(a.quality);
      const bi = QUALITY_ORDER.indexOf(b.quality);
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });

    for (const skin of sortedSkins) {
      // Favorites filter
      if (showFavoritesOnly && !isFavorite(general.id, skin.id)) {
        continue;
      }
      // Quality filter at skin level
      if (activeQuality !== 'all' && skin.quality !== activeQuality) {
        continue;
      }
      // Collection filter at skin level
      if (activeCollection !== 'all' && skin.collection !== activeCollection) {
        continue;
      }
      entries.push({ general, skin });
    }
  }

  if (entries.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 text-center">
        <div className="text-6xl mb-4 opacity-50">📜</div>
        <p className="text-antique-muted text-lg font-classical">
          {showFavoritesOnly ? '收藏夹为空，快去收藏喜欢的皮肤吧' : '没有找到匹配的皮肤'}
        </p>
        {showFavoritesOnly && (
          <p className="text-antique-muted/60 text-sm mt-2">
            点击皮肤卡片上的 ♡ 按钮即可收藏
          </p>
        )}
      </div>
    );
  }

  return (
      <div className="max-w-[1600px] 2xl:max-w-[1760px] mx-auto px-4 md:px-8 pb-16">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 md:gap-4">
        {entries.map(({ general, skin }, index) => (
          <SkinCard
            key={`${general.id}::${skin.id}`}
            skin={skin}
            general={general}
            onClick={onSkinClick}
            isFavorite={isFavorite(general.id, skin.id)}
            onToggleFavorite={onToggleFavorite}
            index={index}
          />
        ))}
      </div>

      {/* Bottom decoration */}
      <div className="flex items-center justify-center gap-3 mt-12 opacity-30">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-antique-gold to-transparent" />
        <span className="text-antique-gold text-xs tracking-widest">◆ ◇ ◆</span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-antique-gold to-transparent" />
      </div>
    </div>
  );
}
