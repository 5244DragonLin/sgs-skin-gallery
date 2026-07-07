import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Header from './components/Header';
import FilterBar from './components/FilterBar';
import SkinGrid from './components/SkinGrid';
import SkinDetail from './components/SkinDetail';
import useFavorites from './hooks/useFavorites';

/**
 * App — root component managing view state, filters, and data loading.
 *
 * View states:
 *   'loading' - Initial data load
 *   'gallery' - Main grid view
 *   'detail'  - Skin detail modal
 *   'error'   - Data load failure
 */
export default function App() {
  // Data
  const [data, setData] = useState(null);
  const [fullData, setFullData] = useState(null); // lazily loaded full skin-data.json for detail
  const [packData, setPackData] = useState(null);
  const [genderMap, setGenderMap] = useState({});
  const [viewState, setViewState] = useState('loading'); // 'loading' | 'gallery' | 'detail'
  const [errorMsg, setErrorMsg] = useState('');

  // Current detail selection
  const [selectedGeneral, setSelectedGeneral] = useState(null);
  const [selectedSkin, setSelectedSkin] = useState(null);

  // Filters
  const [activeFaction, setActiveFaction] = useState('all');
  const [activeGender, setActiveGender] = useState('all');
  const [activeQuality, setActiveQuality] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // New filters: pack category, pack, collection, hallOfFame
  const [activePackCategory, setActivePackCategory] = useState('all');
  const [activePack, setActivePack] = useState('all');
  const [activeCollection, setActiveCollection] = useState('all');
  const [activeHallOfFame, setActiveHallOfFame] = useState('all');

  // 返回顶部按钮显隐
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Favorites
  const { toggleFavorite, isFavorite } = useFavorites();

  // Load data on mount
  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        // Load skins data (public/skin-data.json，由 npm run scan 生成)
        const skinsRes = await fetch('/skin-data.json');
        if (!skinsRes.ok) {
          throw new Error(`skin-data.json 加载失败 (HTTP ${skinsRes.status})。请先运行: npm run scan`);
        }
        const skinsData = await skinsRes.json();
        if (cancelled) return;

        // Load pack data
        let packDataResult = null;
        try {
          const packRes = await fetch('/pack-data.json');
          if (packRes.ok) {
            packDataResult = await packRes.json();
          }
        } catch {
          console.warn('pack-data.json 未找到，卡包筛选将不可用');
        }

        // Load gender map
        let genderData = {};
        try {
          const genderRes = await fetch('/gender-map.json');
          if (genderRes.ok) {
            genderData = await genderRes.json();
          }
        } catch {
          console.warn('gender-map.json 未找到，性别筛选将不可用');
        }

        if (!cancelled) {
          setData(skinsData);
          setPackData(packDataResult);
          setGenderMap(genderData);
          // 初始加载已是完整 skin-data.json，直接作为详情数据，避免重复请求
          setFullData(skinsData);
          setViewState('gallery');
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMsg(err.message || '数据加载失败');
          setViewState('error');
        }
      }
    }

    loadData();
    return () => { cancelled = true; };
  }, []);

  // 滚动监听：下滑超过阈值时显示返回顶部按钮
  useEffect(() => {
    const onScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Build collections list from all skins (deduplicated + sorted)
  const collections = useMemo(() => {
    if (!data || !data.generals) return [];
    const set = new Set();
    for (const g of data.generals) {
      for (const s of g.skins) {
        if (s.collection && s.collection !== '不在收藏册内' && s.collection !== 'null') {
          set.add(s.collection);
        }
      }
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'zh'));
  }, [data]);

  // Build hallOfFame list from all generals
  const hallOfFameNames = useMemo(() => {
    if (!data || !data.generals) return [];
    const set = new Set();
    for (const g of data.generals) {
      const hof = g.hallOfFame;
      if (hof && hof !== '不在内' && hof !== '') {
        // Split on '、' for multi-value fields
        const parts = hof.split('、').map(s => s.trim());
        for (const p of parts) {
          if (p) set.add(p);
        }
      }
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'zh'));
  }, [data]);

  // Filter and search logic
  const filteredGenerals = useMemo(() => {
    if (!data || !data.generals) return [];

    let generals = data.generals;

    // Faction filter
    if (activeFaction !== 'all') {
      generals = generals.filter((g) => g.faction === activeFaction);
    }

    // Pack category filter
    if (activePackCategory !== 'all') {
      generals = generals.filter((g) => g.packCategory === activePackCategory);
    }

    // Pack filter
    if (activePack !== 'all') {
      generals = generals.filter((g) => g.pack === activePack);
    }

    // Collection filter (general must have at least one skin in this collection)
    if (activeCollection !== 'all') {
      generals = generals.filter((g) =>
        g.skins.some((s) => s.collection === activeCollection)
      );
    }

    // Hall of Fame filter（名将堂）
    if (activeHallOfFame !== 'all') {
      generals = generals.filter((g) => {
        const hof = g.hallOfFame;
        if (!hof || hof === '不在内' || hof === '') return false;
        const parts = hof.split('、').map(s => s.trim());
        return parts.includes(activeHallOfFame);
      });
    }

    // Gender filter
    if (activeGender !== 'all') {
      const targetGender = activeGender === 'male' ? '男' : '女';
      generals = generals.filter((g) => {
        // Prefer gender from skin-data.json, fallback to genderMap
        const gender = g.gender || genderMap[g.id] || genderMap[g.name];
        if (!gender) return activeGender === 'all';
        return gender === targetGender;
      });
    }

    // Quality filter
    if (activeQuality !== 'all') {
      generals = generals.filter((g) =>
        g.skins.some((s) => s.quality === activeQuality)
      );
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      generals = generals.filter((g) =>
        g.name.toLowerCase().includes(query) ||
        g.id.toLowerCase().includes(query) ||
        g.skins.some((s) =>
          s.name.toLowerCase().includes(query) ||
          s.id.toLowerCase().includes(query)
        )
      );
    }

    return generals;
  }, [data, activeFaction, activePackCategory, activePack, activeCollection, activeHallOfFame, activeGender, activeQuality, searchQuery, genderMap]);

  // Count total visible skins
  const visibleSkinCount = useMemo(() => {
    let count = 0;
    for (const g of filteredGenerals) {
      for (const s of g.skins) {
        if (showFavoritesOnly && !isFavorite(g.id, s.id)) continue;
        if (activeQuality !== 'all' && s.quality !== activeQuality) continue;
        if (activeCollection !== 'all' && s.collection !== activeCollection) continue;
        count++;
      }
    }
    return count;
  }, [filteredGenerals, showFavoritesOnly, activeQuality, activeCollection, isFavorite]);

  // Handlers
  const handleSkinClick = useCallback((general, skin) => {
    setSelectedGeneral(general);
    setSelectedSkin(skin);
    setViewState('detail');

    // Preload full data in the background
    if (!fullData) {
      fetch('/skin-data.json')
        .then(r => r.ok ? r.json() : null)
        .then(full => { if (full) setFullData(full); })
        .catch(err => console.warn('Full data lazy load failed:', err));
    }
  }, [fullData]);

  const handleCloseDetail = useCallback(() => {
    setViewState('gallery');
    setSelectedGeneral(null);
    setSelectedSkin(null);
  }, []);

  const handleToggleFavorite = useCallback((generalId, skinId) => {
    toggleFavorite(generalId, skinId);
  }, [toggleFavorite]);

  const handleShowFavorites = useCallback(() => {
    setShowFavoritesOnly((prev) => !prev);
  }, []);

  // Pack category change handler — also resets active pack
  const handlePackCategoryChange = useCallback((category) => {
    setActivePackCategory(category);
    setActivePack('all');
  }, []);

  // ----- Render: Loading -----
  if (viewState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-6 animate-pulse">📜</div>
          <div className="flex items-center justify-center gap-1 mb-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-antique-gold animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
          <p className="text-antique-muted text-lg font-classical">翻阅中...</p>
          <p className="text-antique-muted/50 text-sm mt-2">正在加载皮肤数据</p>
        </div>
      </div>
    );
  }

  // ----- Render: Error -----
  if (viewState === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6 opacity-50">📜</div>
          <h2 className="text-antique-cream text-xl font-bold mb-3">数据加载失败</h2>
          <p className="text-antique-muted text-sm mb-4">{errorMsg}</p>
          <div className="bg-antique-card border border-antique-border/40 rounded-lg p-4 text-left text-xs text-antique-muted font-mono mb-4">
            <p>请先运行扫描脚本生成数据：</p>
            <p className="text-antique-gold mt-1">npm run scan</p>
          </div>
          <button
            onClick={() => {
              setViewState('loading');
              setErrorMsg('');
              window.location.reload();
            }}
            className="px-4 py-2 bg-antique-gold/20 border border-antique-gold/50
              text-antique-gold rounded-lg hover:bg-antique-gold/30 transition-all duration-300"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  // ----- Render: Gallery -----
  return (
    <div className="min-h-screen">
      <Header
        favCount={visibleSkinCount}
        onShowFavorites={handleShowFavorites}
        showFavoritesOnly={showFavoritesOnly}
      />

      <FilterBar
        activeFaction={activeFaction}
        onFactionChange={(f) => {
          setActiveFaction(f);
          setShowFavoritesOnly(false);
        }}
        activeGender={activeGender}
        onGenderChange={setActiveGender}
        activeQuality={activeQuality}
        onQualityChange={setActiveQuality}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        resultCount={visibleSkinCount}
        packData={packData}
        activePack={activePack}
        onPackChange={setActivePack}
        activePackCategory={activePackCategory}
        onPackCategoryChange={handlePackCategoryChange}
        activeCollection={activeCollection}
        onCollectionChange={setActiveCollection}
        collections={collections}
        activeHallOfFame={activeHallOfFame}
        onHallOfFameChange={setActiveHallOfFame}
        hallOfFameNames={hallOfFameNames}
      />

      <SkinGrid
        generals={filteredGenerals}
        onSkinClick={handleSkinClick}
        isFavorite={isFavorite}
        onToggleFavorite={handleToggleFavorite}
        showFavoritesOnly={showFavoritesOnly}
        activeQuality={activeQuality}
        activeCollection={activeCollection}
      />

      {/* Detail Modal */}
      {viewState === 'detail' && selectedGeneral && selectedSkin && (
        <SkinDetail
          general={selectedGeneral}
          skin={selectedSkin}
          fullData={fullData}
          onClose={handleCloseDetail}
          isFavorite={isFavorite(selectedGeneral.id, selectedSkin.id)}
          onToggleFavorite={handleToggleFavorite}
        />
      )}

      {/* 返回顶部按钮（仅画廊视图、下滑后显示） */}
      {showBackToTop && viewState !== 'detail' && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 right-8 z-40 w-12 h-12 rounded-full
            bg-antique-gold/90 hover:bg-antique-gold text-stone-900
            shadow-lg shadow-black/30 flex items-center justify-center
            transition-all duration-300 hover:scale-110
            active:scale-95"
          aria-label="返回顶部"
          title="返回顶部"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
            <path d="M12 4 L20 18 L4 18 Z" />
          </svg>
        </button>
      )}
    </div>
  );
}
