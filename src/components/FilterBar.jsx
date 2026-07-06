import React, { useState, useMemo, useEffect, useRef } from 'react';

const FACTIONS = [
  { id: 'all', label: '全部', colorClass: '' },
  { id: '魏', label: '魏', colorClass: 'faction-wei' },
  { id: '蜀', label: '蜀', colorClass: 'faction-shu' },
  { id: '吴', label: '吴', colorClass: 'faction-wu-red' },
  { id: '群', label: '群', colorClass: 'faction-qun' },
  { id: '神', label: '神', colorClass: 'faction-shen' },
];

const GENDERS = [
  { id: 'all', label: '全部' },
  { id: 'male', label: '男' },
  { id: 'female', label: '女' },
];

const QUALITIES = [
  { id: 'all', label: '全部' },
  { id: '原画', label: '原画', colorClass: 'quality-yuanhua' },
  { id: '普通', label: '普通', colorClass: 'quality-putong' },
  { id: '稀有', label: '稀有', colorClass: 'quality-xiyou' },
  { id: '史诗', label: '史诗', colorClass: 'quality-shishi' },
  { id: '传说', label: '传说', colorClass: 'quality-chuanshuo' },
  { id: '限定', label: '限定', colorClass: 'quality-xianding' },
  { id: '绝版', label: '绝版', colorClass: 'quality-jueban' },
];

/**
 * FilterBar component — provides faction, pack, collection, quality, gender, and search filters.
 */
export default function FilterBar({
  activeFaction = 'all',
  onFactionChange,
  activeGender = 'all',
  onGenderChange,
  activeQuality = 'all',
  onQualityChange,
  searchQuery = '',
  onSearchChange,
  resultCount = 0,
  packData = null,
  activePack = 'all',
  onPackChange,
  activePackCategory = 'all',
  onPackCategoryChange,
  activeCollection = 'all',
  onCollectionChange,
  collections = [],
}) {
  const [expandedCategory, setExpandedCategory] = useState(null);

  const currentExpanded = activePackCategory !== 'all' ? activePackCategory : expandedCategory;

  const expandedPacks = useMemo(() => {
    if (!packData || !packData.categories || !currentExpanded) return [];
    const cat = packData.categories.find((c) => c.category === currentExpanded);
    return cat ? cat.packs : [];
  }, [packData, currentExpanded]);

  const handleCategoryClick = (category) => {
    if (currentExpanded === category) {
      setExpandedCategory(null);
      onPackCategoryChange('all');
    } else {
      setExpandedCategory(category);
      onPackCategoryChange(category);
    }
  };

  const handlePackClick = (packName) => {
    if (activePack === packName) {
      onPackChange('all');
    } else {
      onPackChange(packName);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 mb-6">
      <div className="bg-antique-card/80 border border-antique-border/40 rounded-lg p-4 md:p-5">
        {/* Search Row */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="搜索武将名..."
              className="w-full md:w-72 px-4 py-2.5 pl-10 bg-antique-bg border border-antique-border/50
                rounded-lg text-antique-text placeholder-antique-muted
                focus:outline-none focus:border-antique-gold focus:ring-1 focus:ring-antique-gold/30
                transition-all duration-300 font-classical text-sm"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-antique-muted"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-antique-muted
                  hover:text-antique-gold transition-colors"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Row 1: Faction */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          <span className="text-antique-muted text-xs tracking-wider mr-2">势力</span>
          {FACTIONS.map((f) => (
            <button
              key={f.id}
              onClick={() => onFactionChange(f.id)}
              className={`
                px-3 py-1.5 rounded-md text-sm font-classical
                border transition-all duration-300
                ${activeFaction === f.id
                  ? f.id === 'all'
                    ? 'bg-antique-gold/20 border-antique-gold text-antique-gold'
                    : `${f.colorClass} border-current`
                  : 'border-transparent text-antique-muted hover:text-antique-text hover:bg-antique-bg/50'
                }
              `}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Row 2: Pack Category + Expandable Pack List */}
        {packData && packData.categories && (
          <div className="pack-filter-row mb-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-antique-muted text-xs tracking-wider mr-2">卡包</span>
              <button
                onClick={() => {
                  setExpandedCategory(null);
                  onPackCategoryChange('all');
                }}
                className={`
                  pack-category-btn px-3 py-1.5 rounded-md text-sm font-classical
                  border transition-all duration-300 whitespace-nowrap
                  ${activePackCategory === 'all'
                    ? 'bg-antique-gold/20 border-antique-gold text-antique-gold active'
                    : 'border-transparent text-antique-muted hover:text-antique-text hover:bg-antique-bg/50'
                  }
                `}
              >
                全部
              </button>
              {packData.categories.map((cat) => (
                <button
                  key={cat.category}
                  onClick={() => handleCategoryClick(cat.category)}
                  className={`
                    pack-category-btn px-3 py-1.5 rounded-md text-sm font-classical
                    border transition-all duration-300 whitespace-nowrap
                    ${activePackCategory === cat.category
                      ? 'bg-antique-gold/20 border-antique-gold text-antique-gold active'
                      : 'border-transparent text-antique-muted hover:text-antique-text hover:bg-antique-bg/50'
                    }
                  `}
                >
                  {cat.category}
                </button>
              ))}
            </div>

            <div className={`pack-list ${currentExpanded ? 'expanded' : ''}`}>
              {expandedPacks.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-2 border-t border-antique-border/20">
                  {expandedPacks.map((pack) => (
                    <button
                      key={pack.name}
                      onClick={() => handlePackClick(pack.name)}
                      className={`
                        pack-item-btn px-2.5 py-1 rounded text-xs font-classical
                        border transition-all duration-300 whitespace-nowrap
                        flex items-center gap-1.5
                        ${activePack === pack.name
                          ? 'bg-antique-gold/20 border-antique-gold text-antique-gold active'
                          : 'border-antique-border/30 text-antique-muted hover:text-antique-text hover:border-antique-gold/40 hover:bg-antique-bg/50'
                        }
                      `}
                    >
                      <span>{pack.name}</span>
                      <span className="text-[10px] opacity-60 bg-antique-bg/60 px-1 rounded">
                        {pack.count}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Row 3: Quality — with matching color classes */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          <span className="text-antique-muted text-xs tracking-wider mr-2">品质</span>
          {QUALITIES.map((q) => (
            <button
              key={q.id}
              onClick={() => onQualityChange(q.id)}
              className={`
                px-3 py-1.5 rounded-md text-sm font-classical
                border transition-all duration-300 whitespace-nowrap
                ${activeQuality === q.id
                  ? q.id === 'all'
                    ? 'bg-antique-gold/20 border-antique-gold text-antique-gold'
                    : `${q.colorClass} border-current`
                  : 'border-transparent text-antique-muted hover:text-antique-text hover:bg-antique-bg/50'
                }
              `}
            >
              {q.label}
            </button>
          ))}
        </div>

        {/* Row 4: Gender + Result Count */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          <span className="text-antique-muted text-xs tracking-wider mr-2">性别</span>
          {GENDERS.map((g) => (
            <button
              key={g.id}
              onClick={() => onGenderChange(g.id)}
              className={`
                px-3 py-1.5 rounded-md text-sm font-classical
                border transition-all duration-300
                ${activeGender === g.id
                  ? 'bg-antique-gold/20 border-antique-gold text-antique-gold'
                  : 'border-transparent text-antique-muted hover:text-antique-text hover:bg-antique-bg/50'
                }
              `}
            >
              {g.label}
            </button>
          ))}

          <div className="ml-auto text-antique-muted text-sm">
            共 <span className="text-antique-gold font-semibold">{resultCount}</span> 个皮肤
          </div>
        </div>

        {/* Row 5: Collection — separate row, button + dropdown pattern */}
        {collections.length > 0 && (
          <CollectionFilter
            activeCollection={activeCollection}
            onCollectionChange={onCollectionChange}
            collections={collections}
          />
        )}
      </div>
    </div>
  );
}

/**
 * CollectionFilter — "全部" button + click-to-show dropdown list.
 * Matches the visual style of faction/pack category buttons.
 */
function CollectionFilter({ activeCollection, onCollectionChange, collections }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const isAll = activeCollection === 'all';
  const activeLabel = isAll ? '选择收藏册' : (activeCollection.length > 12 ? activeCollection.slice(0, 12) + '…' : activeCollection);

  return (
    <div className="flex flex-wrap items-center gap-1.5" ref={ref}>
      <span className="text-antique-muted text-xs tracking-wider mr-2">收藏册</span>
      {/* "全部" button */}
      <button
        onClick={() => { onCollectionChange('all'); setOpen(false); }}
        className={`px-3 py-1.5 rounded-md text-sm font-classical border transition-all duration-300
          ${isAll
            ? 'bg-antique-gold/20 border-antique-gold text-antique-gold'
            : 'border-transparent text-antique-muted hover:text-antique-text hover:bg-antique-bg/50'
          }`}
      >
        全部
      </button>
      {/* Dropdown trigger */}
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className={`px-3 py-1.5 rounded-md text-sm font-classical border transition-all duration-300 flex items-center gap-1
            ${!isAll
              ? 'bg-antique-gold/20 border-antique-gold text-antique-gold'
              : 'border-transparent text-antique-muted hover:text-antique-text hover:bg-antique-bg/50'
            }`}
        >
          {activeLabel}
          <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {/* Dropdown menu */}
        {open && (
          <div className="absolute top-full left-0 mt-1 z-20 bg-antique-card border border-antique-border/60 rounded-lg shadow-xl
            min-w-[11rem] max-h-[15rem] overflow-y-auto py-1"
            style={{ animation: 'fadeIn 0.15s ease-out both' }}>
            {collections.map((c) => (
              <button
                key={c}
                onClick={() => { onCollectionChange(c); setOpen(false); }}
                className={`w-full text-left px-3 py-1.5 text-sm font-classical transition-colors
                  ${activeCollection === c
                    ? 'bg-antique-gold/15 text-antique-gold'
                    : 'text-antique-text hover:bg-antique-bg/50 hover:text-antique-cream'
                  }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
