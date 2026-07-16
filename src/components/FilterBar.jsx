import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';

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
  activeHallOfFame = 'all',
  onHallOfFameChange,
  hallOfFameNames = [],
}) {
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [inputValue, setInputValue] = useState(searchQuery);
  const debounceRef = useRef(null);
  const isComposingRef = useRef(false); // 是否正在用输入法打拼音（尚未选字落下）

  // Sync external searchQuery changes (e.g. clear) back to local input
  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  // 触发搜索（带 300ms 防抖）：拼音组合中选字前不会走到这里
  const commitSearch = useCallback((value) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onSearchChange(value);
    }, 300);
  }, [onSearchChange]);

  // 输入框内容变化：正在用输入法打拼音（尚未选字落下）时只更新显示，不触发筛选刷新
  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setInputValue(value);
    if (isComposingRef.current || e.nativeEvent.isComposing) return;
    commitSearch(value);
  }, [commitSearch]);

  // 拼音选字落下（组合结束）后，才正式发起搜索
  const handleCompositionEnd = useCallback((e) => {
    isComposingRef.current = false;
    const value = e.target.value;
    setInputValue(value);
    commitSearch(value);
  }, [commitSearch]);

  // 清空搜索
  const handleClearSearch = useCallback(() => {
    setInputValue('');
    isComposingRef.current = false;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    onSearchChange('');
  }, [onSearchChange]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

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
    <div className="max-w-[1600px] 2xl:max-w-[1760px] mx-auto px-4 md:px-8 mb-6">
      <div className="bg-antique-card/80 border border-antique-border/40 rounded-lg p-4 md:p-5">
        {/* Search Row */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              value={inputValue}
              onChange={handleSearchChange}
              onCompositionStart={() => { isComposingRef.current = true; }}
              onCompositionEnd={handleCompositionEnd}
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
            {inputValue && (
              <button
                onClick={handleClearSearch}
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
                  : q.id === 'all'
                    ? 'border-transparent text-antique-muted hover:text-antique-text hover:bg-antique-bg/50'
                    : `${q.colorClass} border-transparent hover:border-current`
                }
              `}
            >
              {q.label}
            </button>
          ))}
        </div>

        {/* Row 4: Gender */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          <span className="text-antique-muted text-xs tracking-wider mr-2">性别</span>
          {GENDERS.map((g) => (
            <button
              key={g.id}
              onClick={() => onGenderChange(g.id)}
              className={[
                'px-3 py-1.5 rounded-md text-sm font-classical',
                'border transition-all duration-300',
                activeGender === g.id
                  ? 'bg-antique-gold/20 border-antique-gold text-antique-gold'
                  : 'border-transparent text-antique-muted hover:text-antique-text hover:bg-antique-bg/50',
              ].join(' ')}
            >
              {g.label}
            </button>
          ))}
        </div>

        {/* Row 5: Collection — separate row, button + dropdown pattern */}
        {collections.length > 0 && (
          <CollectionFilter
            activeCollection={activeCollection}
            onCollectionChange={onCollectionChange}
            collections={collections}
            resultCount={hallOfFameNames.length > 0 ? undefined : resultCount}
          />
        )}

        {/* Row 6: Hall of Fame — same pattern */}
        {hallOfFameNames.length > 0 && (
          <HallOfFameFilter
            activeHallOfFame={activeHallOfFame}
            onHallOfFameChange={onHallOfFameChange}
            hallOfFameNames={hallOfFameNames}
            resultCount={resultCount}
          />
        )}

        {collections.length === 0 && hallOfFameNames.length === 0 && (
          <div className="flex justify-end">
            <div className="text-antique-muted text-sm">
              共 <span className="text-antique-gold font-semibold">{resultCount}</span> 个皮肤
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * CollectionFilter — "全部" button + click-to-show dropdown list.
 * Matches the visual style of faction/pack category buttons.
 */
function CollectionFilter({ activeCollection, onCollectionChange, collections, resultCount }) {
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
    <div className="flex flex-wrap items-center gap-1.5 mb-3" ref={ref}>
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
        {resultCount !== undefined && (
          <div className="ml-auto text-antique-muted text-sm whitespace-nowrap">
            共 <span className="text-antique-gold font-semibold">{resultCount}</span> 个皮肤
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * HallOfFameFilter — "全部" button + click-to-show dropdown list.
 * Same visual pattern as CollectionFilter.
 */
function HallOfFameFilter({ activeHallOfFame, onHallOfFameChange, hallOfFameNames, resultCount }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

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

  const isAll = activeHallOfFame === 'all';
  const activeLabel = isAll ? '选择名将堂' : (activeHallOfFame.length > 12 ? activeHallOfFame.slice(0, 12) + '…' : activeHallOfFame);

  return (
    <div className="flex flex-wrap items-center gap-1.5 mb-3" ref={ref}>
      <span className="text-antique-muted text-xs tracking-wider mr-2">名将堂</span>
      <button
        onClick={() => { onHallOfFameChange('all'); setOpen(false); }}
        className={`px-3 py-1.5 rounded-md text-sm font-classical border transition-all duration-300
          ${isAll
            ? 'bg-antique-gold/20 border-antique-gold text-antique-gold'
            : 'border-transparent text-antique-muted hover:text-antique-text hover:bg-antique-bg/50'
          }`}
      >
        全部
      </button>
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
        {open && (
          <div className="absolute top-full left-0 mt-1 z-20 bg-antique-card border border-antique-border/60 rounded-lg shadow-xl
            min-w-[11rem] max-h-[15rem] overflow-y-auto py-1"
            style={{ animation: 'fadeIn 0.15s ease-out both' }}>
            {hallOfFameNames.map((name) => (
              <button
                key={name}
                onClick={() => { onHallOfFameChange(name); setOpen(false); }}
                className={`w-full text-left px-3 py-1.5 text-sm font-classical transition-colors
                  ${activeHallOfFame === name
                    ? 'bg-antique-gold/15 text-antique-gold'
                    : 'text-antique-text hover:bg-antique-bg/50 hover:text-antique-cream'
                  }`}
              >
                {name}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="ml-auto text-antique-muted text-sm whitespace-nowrap">
        共 <span className="text-antique-gold font-semibold">{resultCount}</span> 个皮肤
      </div>
    </div>
  );
}
