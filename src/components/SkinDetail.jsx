import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import CollectionBadge from './CollectionBadge';
import { claimPlayback, releasePlayback } from '../audioController';

/**
 * SkillVoiceButton — small play button next to a skill name.
 * Plays the first available audio file for that skill.
 */
function SkillVoiceButton({ files, label }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);

  // 组件卸载时停掉自己的音频，避免关弹窗后还在响
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        releasePlayback(audioRef.current);
      }
    };
  }, []);

  const handleClick = useCallback((e) => {
    e.stopPropagation();

    const file = files[0];
    if (!file) return;

    if (playing) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setPlaying(false);
      if (audioRef.current) releasePlayback(audioRef.current);
      return;
    }

    const src = file.startsWith('http://') || file.startsWith('https://')
      ? file
      : `/skins/${file}`;

    const audio = new Audio(src);
    audioRef.current = audio;
    const stopSelf = () => {
      audio.pause();
      audio.currentTime = 0;
      setPlaying(false);
    };
    audio.addEventListener('ended', () => {
      setPlaying(false);
      releasePlayback(audio);
    });
    audio.addEventListener('error', () => setPlaying(false));
    // 先让全局正在响的那段停下来，再播自己
    claimPlayback(audio, stopSelf);
    audio.play().catch(() => setPlaying(false));
    setPlaying(true);
  }, [files, playing]);

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs flex-shrink-0
        transition-all duration-200
        ${playing
          ? 'bg-antique-gold/20 text-antique-gold'
          : 'bg-antique-gold/5 text-antique-gold/40 hover:bg-antique-gold/15 hover:text-antique-gold/70'
        }`}
      title={playing ? `停止 ${label}` : `播放 ${label}`}
    >
      <span className="text-sm inline-block">{playing ? '🔊' : '🔈'}</span>
    </button>
  );
}

const FACTION_GRADIENT = {
  '魏': 'from-blue-950/90 via-blue-950/40',
  '蜀': 'from-red-950/90 via-red-950/40',
  '吴': 'from-green-950/90 via-green-950/40',
  '群': 'from-gray-900/90 via-gray-900/40',
  '神': 'from-yellow-950/90 via-yellow-950/40',
  '未知': 'from-gray-950/90 via-gray-950/40',
};

const FACTION_BORDER = {
  '魏': 'border-blue-500/30',
  '蜀': 'border-red-500/30',
  '吴': 'border-green-500/30',
  '群': 'border-gray-500/30',
  '神': 'border-yellow-500/30',
  '未知': 'border-gray-600/30',
};

const FACTION_LABEL = {
  '魏': 'faction-wei',
  '蜀': 'faction-shu',
  '吴': 'faction-wu',
  '群': 'faction-qun',
  '神': 'faction-shen',
  '未知': 'faction-unknown',
};

const QUALITY_BADGE_STYLES = {
  '传说': 'bg-red-900/40 text-red-300 border-red-500/30',
  '史诗': 'bg-amber-900/40 text-amber-300 border-amber-500/30',
  '稀有': 'bg-purple-900/40 text-purple-300 border-purple-500/30',
  '普通': 'bg-green-900/40 text-green-300 border-green-500/30',
  '限定': 'bg-gradient-to-r from-amber-900/40 to-red-900/40 text-amber-200 border-amber-500/30',
  '绝版': 'bg-gradient-to-r from-amber-900/40 to-red-900/40 text-amber-200 border-amber-500/30',
};

/**
 * SkinDetail — full-screen modal showing skin details, images, skills, and voices.
 *
 * @param {Object} props
 * @param {Object} props.general - General data (with skills, title, position, etc.)
 * @param {Object} props.skin - Skin data (with voices, collection, artist, etc.)
 * @param {Function} props.onClose - Close handler
 * @param {boolean} props.isFavorite - Whether skin is favorited
 * @param {Function} props.onToggleFavorite - Toggle favorite
 */
export default function SkinDetail({
  general,
  skin,
  fullData,
  onClose,
  onNavigateSkin = () => {},
  isFavorite,
  onToggleFavorite,
}) {
  const [activeTab, setActiveTab] = useState('large'); // 'large' | 'static' | 'dynamic'
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [skillVersion, setSkillVersion] = useState('经典'); // '经典' | '界限突破' | '国战'

  // 当前武将皮肤列表与序号（仅在该列表内翻页，绝不切换到别的武将）
  const generalSkins = general.skins || [];
  const currentSkinIndex = generalSkins.findIndex((s) => s.id === skin.id);
  const canNavigateSkin = generalSkins.length > 1 && currentSkinIndex !== -1;

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        if (fullscreenImage) {
          setFullscreenImage(null);
        } else {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose, fullscreenImage]);

  // 切换武将或皮肤时：重置技能版本开关 + 图片页签（避免新皮肤缺该页签类型时显示空图）
  useEffect(() => {
    setSkillVersion('经典');
    setActiveTab('large');
  }, [general.id, skin.id]);

  // Lock body scroll — use scrollbar-gutter to prevent layout shift
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = scrollbarWidth + 'px';
    }
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
    };
  }, []);

  const handleOverlayClick = useCallback((e) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  // Skill+quote version labels/order for the detail-panel version switcher.
  // Data source: characters.json `versions` (classic / breakthrough / national_war).
  // 与数据管线统一约定对齐：skillVersions 的键为中文「经典/界限突破/国战」
  const VERSION_LABELS = { 经典: '经典', 界限突破: '界限突破', 国战: '国战' };
  const VERSION_ORDER = ['经典', '界限突破', '国战'];

  // Merge full data when it arrives — stable merge to avoid layout jumps
  const enriched = useMemo(() => {
    if (!fullData) return null;
    const fg = fullData.generals.find((g) => g.id === general.id);
    if (!fg) return null;
    const fs = fg.skins.find((s) => s.id === skin.id);
    return {
      general: { ...fg, skills: fg.skills || general.skills },
      skin: fs ? { ...fs } : null,
    };
  }, [fullData, general.id, skin.id]);

  const detailGeneral = enriched ? enriched.general : general;
  const detailSkin = enriched ? (enriched.skin || skin) : skin;

  // Determine which image to show
  const getDisplayImage = () => {
    switch (activeTab) {
      case 'large': return detailSkin.large || detailSkin.static;
      case 'static': return detailSkin.static;
      case 'dynamic': return detailSkin.dynamic;
      case 'entrance': return detailSkin.dynamicEntrance;
      default: return detailSkin.large || detailSkin.static;
    }
  };

  const displayImage = getDisplayImage();
  const factionGradient = FACTION_GRADIENT[detailGeneral.faction] || FACTION_GRADIENT['未知'];
  const factionBorder = FACTION_BORDER[detailGeneral.faction] || FACTION_BORDER['未知'];
  const factionLabel = FACTION_LABEL[detailGeneral.faction] || FACTION_LABEL['未知'];

  // 当前皮肤可选的形式（大图 / 静态 / 动态 / 动态登场）
  const tabs = useMemo(() => {
    const t = [];
    if (detailSkin.large) t.push({ id: 'large', label: '大图' });
    if (detailSkin.static) t.push({ id: 'static', label: '静态' });
    if (detailSkin.dynamic) t.push({ id: 'dynamic', label: '动态 GIF' });
    if (detailSkin.dynamicEntrance) t.push({ id: 'entrance', label: '动态登场' });
    return t;
  }, [detailSkin.large, detailSkin.static, detailSkin.dynamic, detailSkin.dynamicEntrance]);

  // 键盘操作（放在 tabs 定义之后，避免 TDZ）：
  //  ↑ / ↓ → 在同一武将的不同皮肤间切换（不切到别的武将）
  //  ← / → → 切换同一皮肤的不同形式（大图 / 静态 / 动态…）
  //  全屏看图时不响应任何方向键，先按 Esc 退出大图
  useEffect(() => {
    const handleKey = (e) => {
      if (fullscreenImage) return;
      if (e.key === 'ArrowUp') {
        if (!canNavigateSkin) return;
        e.preventDefault();
        onNavigateSkin('prev');
      } else if (e.key === 'ArrowDown') {
        if (!canNavigateSkin) return;
        e.preventDefault();
        onNavigateSkin('next');
      } else if (e.key === 'ArrowLeft') {
        if (tabs.length <= 1) return;
        e.preventDefault();
        const idx = tabs.findIndex((t) => t.id === activeTab);
        const next = (idx - 1 + tabs.length) % tabs.length;
        setActiveTab(tabs[next].id);
      } else if (e.key === 'ArrowRight') {
        if (tabs.length <= 1) return;
        e.preventDefault();
        const idx = tabs.findIndex((t) => t.id === activeTab);
        const next = (idx + 1) % tabs.length;
        setActiveTab(tabs[next].id);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onNavigateSkin, fullscreenImage, canNavigateSkin, activeTab, tabs, setActiveTab]);

  // Skin quotes (from metadata)
  const skinQuotes = detailSkin.quotes || {};

  // ---- Skill version switching (classic / breakthrough / national_war) ----
  // Pull skill+quote data from characters.json `versions` so the detail panel
  // can switch between the classic / breakthrough / national_war skill sets.
  const skillVersionData = detailGeneral.skillVersions || null;
  const availableVersions = skillVersionData
    ? VERSION_ORDER.filter(
        (v) =>
          skillVersionData[v] &&
          ((skillVersionData[v].skills && skillVersionData[v].skills.length) ||
            (skillVersionData[v].lines && Object.keys(skillVersionData[v].lines).length))
      )
    : [];
  const activeVer = skillVersionData && skillVersionData[skillVersion] ? skillVersion : '经典';
  const vData = skillVersionData ? (skillVersionData[activeVer] || { skills: [], lines: {} }) : null;
  const activeSkills = vData ? (vData.skills || []) : (detailGeneral.skills || []);
  const versionLines = vData ? (vData.lines || {}) : {};
  const normalizeQuote = (raw) => {
    if (raw == null) return null;
    if (Array.isArray(raw)) return raw.join('\n').split('/').join('\n');
    return String(raw);
  };
  const generalSkills = activeSkills;

  // Determine if general has skills to display
  const hasSkills = generalSkills.length > 0;

  // Check if hallOfFame should be shown
  const showHallOfFame = detailGeneral.hallOfFame && detailGeneral.hallOfFame !== '不在内' && detailGeneral.hallOfFame !== '';

  return (
    <div className="detail-overlay" onClick={handleOverlayClick}>
      <div className="detail-panel animate-scale-in" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 flex items-center justify-center
            rounded-full bg-black/40 border border-antique-border/40 text-antique-muted
            hover:text-antique-cream hover:border-antique-gold/60 hover:bg-black/60
            transition-all duration-300 text-lg"
          aria-label="关闭"
        >
          ✕
        </button>

        <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
          {/* Left: Image Display */}
          <div className="md:w-3/5 relative bg-antique-bg flex items-center justify-center min-h-[300px] md:min-h-0">
            {displayImage ? (
              <>
                <img
                  src={`/skins/${displayImage}`}
                  alt={`${detailSkin.name} - ${detailGeneral.name}`}
                  onClick={() => setFullscreenImage(displayImage)}
                  title="点击查看大图"
                  className="peer max-w-full max-h-full object-contain p-4 cursor-zoom-in transition-transform duration-300 hover:scale-[1.02]"
                />
                {/* Zoom hint overlay — only shows when hovering the image itself */}
                <div className="absolute bottom-4 right-4 z-10 bg-black/50 rounded-full p-2
                  opacity-0 peer-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <svg className="w-5 h-5 text-antique-cream" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </div>
              </>
            ) : (
              <div className="text-antique-muted/40 text-center p-8">
                <div className="text-6xl mb-2">🖼</div>
                <p>暂无图片</p>
              </div>
            )}

            {/* Faction gradient overlay */}
            <div className={`absolute inset-0 bg-gradient-to-b ${factionGradient} to-transparent pointer-events-none`} />

            {/* Image tab switcher */}
            {tabs.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      px-3 py-1 rounded-full text-xs font-classical
                      border transition-all duration-300
                      ${activeTab === tab.id
                        ? 'bg-antique-gold/30 border-antique-gold/60 text-antique-gold'
                        : 'bg-black/40 border-white/10 text-antique-muted hover:border-antique-gold/30'
                      }
                    `}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}

            {/* 同武将皮肤切换：计数角标 + 提示文案（↑/↓ 切皮肤，←/→ 切形式，仅在该武将皮肤内） */}
            {canNavigateSkin && (
              <>
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 px-2.5 py-0.5 rounded-full
                  bg-black/40 border border-antique-border/40 text-antique-cream/80 text-xs font-classical
                  pointer-events-none">
                  {currentSkinIndex + 1} / {generalSkins.length}
                </div>
                <div className="absolute bottom-3 left-3 z-10 text-antique-cream/50 text-[11px] leading-relaxed pointer-events-none">
                  ↑ ↓ 切换皮肤
                  <br />
                  ← → 切换形式
                </div>
              </>
            )}
          </div>

          {/* Right: Info Panel */}
          <div className="md:w-2/5 p-6 md:p-8 flex flex-col overflow-y-auto min-h-0">
            {/* Header */}
            <div className="mb-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  {/* General title (称号) as subtitle */}
                  {detailGeneral.title && (
                    <p className="text-antique-gold/70 text-xs font-classical tracking-wide mb-0.5">
                      {detailGeneral.title}
                    </p>
                  )}
                  <h2 className="text-xl md:text-2xl font-bold text-antique-cream leading-tight">
                    {detailSkin.name}
                  </h2>
                  <p className="text-antique-muted text-sm mt-1">
                    {detailGeneral.name}
                  </p>
                </div>
                <CollectionBadge
                  active={isFavorite}
                  onToggle={() => onToggleFavorite(detailGeneral.id, detailSkin.id)}
                  size="md"
                />
              </div>

              {/* Meta badges */}
              <div className="flex flex-wrap gap-2 mt-3">
                <span className={`text-xs px-2.5 py-1 rounded border ${factionLabel}`}>
                  {detailGeneral.faction}
                </span>
                {detailSkin.quality && (
                  <span className={`text-xs px-2.5 py-1 rounded border ${QUALITY_BADGE_STYLES[detailSkin.quality] || 'bg-antique-gold/10 text-antique-gold border-antique-gold/30'}`}>
                    {detailSkin.quality}
                  </span>
                )}
                {/* Position (定位) badge */}
                {detailGeneral.position && (
                  <span className="text-xs px-2.5 py-1 rounded border bg-blue-900/20 text-blue-300/80 border-blue-500/30">
                    {detailGeneral.position}
                  </span>
                )}
                {detailSkin.dynamic && (
                  <span className="text-xs px-2.5 py-1 rounded border bg-cyan-900/20 text-cyan-300 border-cyan-500/30">
                    动态皮肤
                  </span>
                )}
                {/* Hall of Fame badge */}
                {showHallOfFame && (
                  <span className="text-xs px-2.5 py-1 rounded border bg-amber-900/30 text-amber-300 border-amber-500/40">
                    🏆 名将堂
                  </span>
                )}
                {/* Artist badge */}
                {detailSkin.artist && (
                  <span className="text-xs px-2.5 py-1 rounded border bg-purple-900/20 text-purple-300/80 border-purple-500/30">
                    🖌 画师：{detailSkin.artist}
                  </span>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="ornament-divider my-4 text-xs">
              <span>◆</span>
            </div>

            {/* General Skills Block (P0-2) — with skill+quote version switching */}
            {(skillVersionData || hasSkills) && (
              <div className="mb-4">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <h4 className="text-antique-gold text-sm font-semibold tracking-wide">⚔ 武将技能</h4>
                  {availableVersions.length > 1 && (
                    <div className="flex gap-1.5">
                      {availableVersions.map((v) => (
                        <button
                          key={v}
                          onClick={() => setSkillVersion(v)}
                          className={`
                            px-3 py-1 rounded-full text-xs font-classical
                            border transition-all duration-300
                            ${activeVer === v
                              ? 'bg-antique-gold/30 border-antique-gold/60 text-antique-gold'
                              : 'bg-black/30 border-white/10 text-antique-muted hover:border-antique-gold/30'
                            }
                          `}
                        >
                          {VERSION_LABELS[v]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {generalSkills.length > 0 ? (
                  <div className="space-y-2">
                    {generalSkills.map((skill, idx) => {
                      // Find matching quote for this skill (version lines take priority)
                      const rawQuote = versionLines[skill.name] != null
                        ? versionLines[skill.name]
                        : (skinQuotes[skill.name] || null);
                      const quote = normalizeQuote(rawQuote);
                      const quoteLines = quote ? quote.split('\n').filter(Boolean) : [];
                      // Find matching voice group for this skill
                      const voiceMatch = detailSkin.voices
                        ? detailSkin.voices.find(vg => vg.skill === skill.name)
                        : null;
                      return (
                        <div key={idx} className="skill-block">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="skill-name text-sm">{skill.name}</span>
                          </div>
                          <div className="skill-desc">{skill.description}</div>
                          {quoteLines.length > 0 && (
                            <div className="space-y-0.5 mt-0.5">
                              {quoteLines.map((line, li) => (
                                <div key={li} className="skill-quote flex items-start gap-1.5">
                                  {voiceMatch && voiceMatch.files && voiceMatch.files.length > 0 && (
                                    <SkillVoiceButton files={voiceMatch.files} label={line} />
                                  )}
                                  <span>「{line}」</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  skillVersionData && (
                    <p className="text-antique-muted/50 text-sm">该版本暂无技能数据</p>
                  )
                )}

                {/* Show dead quote separately if exists (version lines take priority) */}
                {(() => {
                  const rawDeath = versionLines['阵亡'] != null
                    ? versionLines['阵亡']
                    : (skinQuotes['阵亡'] || null);
                  const deathQuote = normalizeQuote(rawDeath);
                  const deathLines = deathQuote ? deathQuote.split('\n').filter(Boolean) : [];
                  if (deathLines.length === 0) return null;
                  const deathVoice = detailSkin.voices
                    ? detailSkin.voices.find(vg => vg.skill === '阵亡')
                    : null;
                  return (
                    <div className="skill-block mt-2">
                      <div className="skill-name text-sm mb-0.5">💀 阵亡</div>
                      {deathLines.map((line, li) => (
                        <div key={li} className="skill-quote flex items-start gap-1.5">
                          {deathVoice && deathVoice.files && deathVoice.files.length > 0 && (
                            <SkillVoiceButton files={deathVoice.files} label={line} />
                          )}
                          <span>「{line}」</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Story / Description */}
            {detailSkin.story && (
              <div className="mb-4">
                <h4 className="text-antique-gold text-sm font-semibold mb-2 tracking-wide">📖 皮肤故事</h4>
                <div className="text-antique-text/80 text-sm leading-relaxed whitespace-pre-line
                  bg-antique-bg/50 rounded-lg p-3 border border-antique-border/20">
                  {detailSkin.story}
                </div>
              </div>
            )}

            {/* Info Row: release time / acquisition (P1-4) */}
            {(detailSkin.releaseTime || detailSkin.staticAcquisition || (detailSkin.dynamicAcquisition && detailSkin.dynamic)) && (
              <div className="mb-4 info-row space-y-1">
                {detailSkin.releaseTime && (
                  <div>
                    <span className="info-label">上线时间：</span>
                    <span className="info-value">{detailSkin.releaseTime}</span>
                  </div>
                )}
                {detailSkin.staticAcquisition && (
                  <div>
                    <span className="info-label">获取方式：</span>
                    <span className="info-value">{detailSkin.staticAcquisition}</span>
                  </div>
                )}
                {detailSkin.dynamicAcquisition && detailSkin.dynamic && (
                  <div>
                    <span className="info-label">动态获取：</span>
                    <span className="info-value">{detailSkin.dynamicAcquisition}</span>
                  </div>
                )}
              </div>
            )}

            {/* Quotes (legacy display — only show if no skills block) */}
            {detailSkin.quotes && Object.keys(detailSkin.quotes).length > 0 && !hasSkills && !skillVersionData && (
              <div className="mb-4">
                <h4 className="text-antique-gold text-sm font-semibold mb-2 tracking-wide">💬 皮肤台词</h4>
                <div className="space-y-2">
                  {Object.entries(detailSkin.quotes).map(([skill, quote]) => (
                    <div key={skill}
                      className="bg-antique-bg/50 rounded-lg p-3 border border-antique-border/20">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className={`text-xs px-1.5 py-0.5 rounded
                          ${skill === '阵亡'
                            ? 'bg-red-900/20 text-red-300/80'
                            : 'bg-antique-gold/10 text-antique-gold/80'
                          }`}>
                          {skill}
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        {quote.split('\n').filter(Boolean).map((line, li) => (
                          <div key={li} className="text-antique-text/70 text-sm">
                            「{line}」
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No extra info fallback */}
            {!detailSkin.story && !detailSkin.quotes && !hasSkills && (
              <div className="flex-1 flex items-center justify-center text-antique-muted/40 text-sm">
                暂无更多信息
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen Image Lightbox */}
      {fullscreenImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center cursor-zoom-out"
          onClick={() => setFullscreenImage(null)}
          style={{ animation: 'fadeIn 0.2s ease-out both' }}
        >
          <button
            onClick={() => setFullscreenImage(null)}
            className="absolute top-4 right-4 z-10 w-12 h-12 flex items-center justify-center
              rounded-full bg-black/50 border border-white/20 text-white/70
              hover:text-white hover:border-white/40 hover:bg-black/70
              transition-all duration-300 text-2xl"
            aria-label="关闭大图"
          >
            ✕
          </button>
          <img
            src={`/skins/${fullscreenImage}`}
            alt={`${detailSkin.name} - ${detailGeneral.name} (全屏)`}
            className="max-w-[95vw] max-h-[95vh] object-contain"
            style={{ animation: 'scaleIn 0.25s ease-out both' }}
            onClick={(e) => e.stopPropagation()}
          />
          <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/50 text-sm">
            {detailSkin.name} — {detailGeneral.name} · 点击任意处关闭
          </p>
        </div>
      )}
    </div>
  );
}
