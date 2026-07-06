import React, { useState, useRef, useCallback } from 'react';

/**
 * Resolve an audio source URL.
 * - External URLs (http/https) are used directly for first attempt.
 * - Local paths (relative) are served via the /skins/ Vite proxy.
 * - If an external URL fails, we retry via the /voice/ CORS proxy.
 *
 * @param {string} src - Audio source (external URL or local path)
 * @returns {string} Resolved audio URL
 */
function resolveAudioUrl(src) {
  if (src.startsWith('http://') || src.startsWith('https://')) {
    // External URL — use directly (CORS proxy as fallback handled in error handler)
    return src;
  }
  // Local path — serve via Vite proxy
  return `/skins/${src}`;
}

/**
 * VoiceClip — plays a single audio file with visual feedback.
 *
 * @param {Object} props
 * @param {string} props.src - Audio file source path (external URL or relative to /skins/)
 * @param {string} props.label - Display label for this voice clip
 * @param {number} [props.index] - Index for multi-file voice groups
 */
function VoiceClip({ src, label, index }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(false);
  const [usingProxy, setUsingProxy] = useState(false);
  const audioRef = useRef(null);

  const handlePlay = useCallback(() => {
    if (error) return;

    if (!audioRef.current) {
      const audioUrl = resolveAudioUrl(src);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.addEventListener('ended', () => {
        setIsPlaying(false);
      });

      audio.addEventListener('error', () => {
        // If direct external URL fails, retry via /voice/ CORS proxy
        if (!usingProxy && (src.startsWith('http://') || src.startsWith('https://'))) {
          setUsingProxy(true);
          const proxyUrl = `/voice/${encodeURIComponent(src)}`;
          audioRef.current = null;
          // Retry with proxy URL on next play attempt
          const proxyAudio = new Audio(proxyUrl);
          audioRef.current = proxyAudio;
          proxyAudio.addEventListener('ended', () => setIsPlaying(false));
          proxyAudio.addEventListener('error', () => {
            setIsPlaying(false);
            setError(true);
          });
          proxyAudio.addEventListener('canplaythrough', () => {
            proxyAudio.play().catch(() => {
              setIsPlaying(false);
              setError(true);
            });
          });
          proxyAudio.play().catch(() => {
            setIsPlaying(false);
            setError(true);
          });
        } else {
          setIsPlaying(false);
          setError(true);
        }
      });

      audio.addEventListener('canplaythrough', () => {
        audio.play().catch(() => {
          setIsPlaying(false);
          setError(true);
        });
      });
    }

    const audio = audioRef.current;
    if (isPlaying) {
      audio.pause();
      audio.currentTime = 0;
      setIsPlaying(false);
    } else {
      audio.currentTime = 0;
      audio.play().catch(() => {
        setIsPlaying(false);
        setError(true);
      });
      setIsPlaying(true);
    }
  }, [src, isPlaying, error, usingProxy]);

  if (error) {
    return (
      <span className="text-antique-muted/40 text-xs italic cursor-not-allowed">
        {label}{index !== undefined ? ` #${index}` : ''} (不可用)
      </span>
    );
  }

  return (
    <button
      onClick={handlePlay}
      className={`
        voice-player-btn text-xs md:text-sm
        ${isPlaying ? 'playing' : ''}
      `}
      title={isPlaying ? '停止播放' : '播放语音'}
    >
      <span className="text-base">{isPlaying ? '🔊' : '🔈'}</span>
      <span>
        {label}
        {index !== undefined ? ` #${String(index).padStart(2, '0')}` : ''}
      </span>
      {isPlaying && (
        <span className="flex gap-0.5 ml-1">
          <span className="w-0.5 h-3 bg-antique-gold rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
          <span className="w-0.5 h-3 bg-antique-gold rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
          <span className="w-0.5 h-3 bg-antique-gold rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
        </span>
      )}
    </button>
  );
}

/**
 * VoicePlayer — renders voice clips for a skin, grouped by skill.
 *
 * @param {Object} props
 * @param {Array} props.voices - Array of voice objects: { type, label, skill, files }
 */
export default function VoicePlayer({ voices = [] }) {
  if (!voices || voices.length === 0) {
    return (
      <div className="text-antique-muted/50 text-sm italic py-2">
        此皮肤暂无语音数据
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {voices.map((voiceGroup, gi) => (
        <div key={gi}>
          {/* Group header */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`
              text-xs px-2 py-0.5 rounded
              ${voiceGroup.type === 'dead'
                ? 'bg-red-900/20 text-red-300/80 border border-red-500/20'
                : 'bg-antique-gold/10 text-antique-gold/80 border border-antique-gold/20'
              }
            `}>
              {voiceGroup.type === 'dead' ? '💀 阵亡' : `⚔ ${voiceGroup.label}`}
            </span>
          </div>

          {/* Voice files */}
          <div className="flex flex-wrap gap-2">
            {voiceGroup.files.map((file, fi) => (
              <VoiceClip
                key={fi}
                src={file}
                label={voiceGroup.label}
                index={voiceGroup.files.length > 1 ? fi + 1 : undefined}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
