import React, { useState, useRef, useEffect } from 'react';
import CollectionBadge from './CollectionBadge';

const FACTION_GRADIENT = {
  '魏': 'from-blue-900/40 via-transparent to-blue-900/40',
  '蜀': 'from-red-900/40 via-transparent to-red-900/40',
  '吴': 'from-green-900/40 via-transparent to-green-900/40',
  '群': 'from-gray-700/40 via-transparent to-gray-700/40',
  '神': 'from-yellow-800/40 via-transparent to-yellow-800/40',
  '未知': 'from-gray-800/40 via-transparent to-gray-800/40',
};

const FACTION_LABEL_COLOR = {
  '魏': 'text-blue-300',
  '蜀': 'text-red-300',
  '吴': 'text-green-300',
  '群': 'text-gray-300',
  '神': 'text-yellow-300',
  '未知': 'text-gray-400',
};

const QUALITY_COLORS = {
  '传说': 'bg-red-900/40 text-red-300 border-red-500/30',
  '史诗': 'bg-amber-900/40 text-amber-300 border-amber-500/30',
  '稀有': 'bg-purple-900/40 text-purple-300 border-purple-500/30',
  '普通': 'bg-green-900/40 text-green-300 border-green-500/30',
  '限定': 'bg-gradient-to-r from-amber-900/40 to-red-900/40 text-amber-200 border-amber-500/30',
  '绝版': 'bg-gradient-to-r from-amber-900/40 to-red-900/40 text-amber-200 border-amber-500/30',
};

/**
 * SkinCard — displays a single skin as an antique-style card.
 * Uses Intersection Observer for lazy loading.
 *
 * @param {Object} props
 * @param {Object} props.skin - Skin data object
 * @param {Object} props.general - Parent general data object
 * @param {Function} props.onClick - Click handler to open detail
 * @param {boolean} props.isFavorite - Whether this skin is favorited
 * @param {Function} props.onToggleFavorite - Favorite toggle handler
 * @param {number} props.index - Index for staggered animation
 */
export default React.memo(function SkinCard({
  skin,
  general,
  onClick,
  isFavorite,
  onToggleFavorite,
  index = 0,
}) {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);
  const cardRef = useRef(null);
  const imgRef = useRef(null);

  // Lazy load via Intersection Observer
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(el);
        }
      },
      {
        rootMargin: '200px',
        threshold: 0.01,
      }
    );

    observer.observe(el);
    return () => observer.unobserve(el);
  }, []);

  const handleImageLoad = () => {
    setLoaded(true);
  };

  const imageSrc = skin.static ? `/skins/${skin.static}` : null;
  const factionGradient = FACTION_GRADIENT[general.faction] || FACTION_GRADIENT['未知'];
  const factionLabelColor = FACTION_LABEL_COLOR[general.faction] || FACTION_LABEL_COLOR['未知'];
  const qualityClass = skin.quality ? QUALITY_COLORS[skin.quality] || '' : '';

  // Determine indicator icons
  const hasLarge = !!skin.large;
  const hasDynamic = !!skin.dynamic;
  const hasDynamicEntrance = !!skin.dynamicEntrance;
  const hasVoices = skin.voices && skin.voices.length > 0;
  // Collection indicator — only show if collection exists and is not "不在收藏册内"
  const hasCollection = skin.collection && skin.collection !== '不在收藏册内' && skin.collection !== 'null';
  // Hall of Fame indicator
  const hasHallOfFame = general.hallOfFame && general.hallOfFame !== '不在内' && general.hallOfFame !== '';

  // Pack category label — only show if exists and not "其他"
  const showPackCategory = general.packCategory && general.packCategory !== '其他' && general.packCategory !== '';

  return (
    <div
      ref={cardRef}
      className="skin-card group animate-fade-in-up cursor-pointer"
      style={{ animationDelay: `${index * 50}ms` }}
      onClick={() => onClick(general, skin)}
    >
      {/* Image area */}
      <div className="relative aspect-[3/4] overflow-hidden bg-antique-bg">
        {inView && imageSrc ? (
          <>
            {!loaded && (
              <div className="absolute inset-0 lazy-image-placeholder" />
            )}
            <img
              ref={imgRef}
              src={imageSrc}
              alt={`${skin.name} - ${general.name}`}
              className={`
                w-full h-full object-cover transition-all duration-500
                group-hover:scale-105
                ${loaded ? 'opacity-100' : 'opacity-0'}
              `}
              onLoad={handleImageLoad}
              loading="lazy"
            />
          </>
        ) : (
          <div className="absolute inset-0 lazy-image-placeholder" />
        )}

        {/* Faction gradient overlay */}
        <div className={`absolute inset-0 bg-gradient-to-b ${factionGradient} opacity-40 pointer-events-none`} />

        {/* Indicators bar */}
        <div className="absolute top-2 right-2 flex gap-1 z-10">
          {hasLarge && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-antique-gold/20 text-antique-gold/80 border border-antique-gold/30"
              title="有大图">
              L
            </span>
          )}
          {hasDynamic && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-cyan-900/30 text-cyan-300/80 border border-cyan-500/30"
              title="动态皮肤">
              ✦
            </span>
          )}
          {hasDynamicEntrance && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-teal-900/30 text-teal-300/80 border border-teal-500/30"
              title="动态登场">
              ◇
            </span>
          )}
          {hasVoices && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-green-900/20 text-green-300/80 border border-green-500/30"
              title="有语音">
              🔊
            </span>
          )}
          {hasCollection && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-amber-900/30 text-amber-300/80 border border-amber-500/30"
              title={`收藏册：${skin.collection}`}>
              📖
            </span>
          )}
          {hasHallOfFame && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-purple-900/30 text-purple-300/80 border border-purple-500/30"
              title={`名将堂：${general.hallOfFame}`}>
              🏆
            </span>
          )}
        </div>

        {/* Favorite button */}
        <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={isFavorite ? { opacity: 1 } : {}}>
          <CollectionBadge
            active={isFavorite}
            onToggle={() => onToggleFavorite(general.id, skin.id)}
            size="sm"
          />
        </div>
      </div>

      {/* Info area */}
      <div className="relative z-10 p-3" onClick={(e) => e.stopPropagation()}>
        {/* Quality badge — only render when quality is present and not a URL/path */}
        {skin.quality && !skin.quality.startsWith('http') && !skin.quality.startsWith('/') && (
          <span className={`inline-block text-xs px-1.5 py-0.5 rounded border mb-1.5 ${qualityClass}`}>
            {skin.quality}
          </span>
        )}

        {/* Skin name */}
        <h3 className="text-antique-cream font-semibold text-sm md:text-base truncate leading-tight">
          {skin.name}
        </h3>

        {/* General name + faction */}
        <div className="flex items-center justify-between mt-1">
          <span className="text-antique-muted text-xs truncate flex-1 mr-2">
            {general.name}
          </span>
          <span className={`text-xs font-semibold ${factionLabelColor} flex-shrink-0`}>
            {general.faction}
          </span>
        </div>

        {/* Pack category tag */}
        {showPackCategory && (
          <div className="mt-1 text-[10px] text-antique-gold/60 font-classical truncate">
            {general.packCategory}
          </div>
        )}
      </div>
    </div>
  );
});
