import React, { useState, useRef, useEffect } from 'react';
import { Music, Play, Square, Volume2, CheckCircle2, Sparkles, Sliders } from 'lucide-react';
import { MUSIC_THEMES } from '../data/presets';
import { MusicThemeId } from '../types';
import { synthesizeThematicMusic } from '../services/musicSynthesizer';

interface MusicThemeSelectorProps {
  selectedTheme: MusicThemeId;
  onSelectTheme: (theme: MusicThemeId) => void;
  recommendedTheme?: MusicThemeId;
  autoSyncWithStyle: boolean;
  onToggleAutoSync: (enabled: boolean) => void;
}

export const MusicThemeSelector: React.FC<MusicThemeSelectorProps> = ({
  selectedTheme,
  onSelectTheme,
  recommendedTheme,
  autoSyncWithStyle,
  onToggleAutoSync,
}) => {
  const [playingThemeId, setPlayingThemeId] = useState<MusicThemeId | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const stopPreview = () => {
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
        currentSourceRef.current.disconnect();
      } catch {
        // already stopped
      }
      currentSourceRef.current = null;
    }
    setPlayingThemeId(null);
  };

  const handleTogglePreview = async (themeId: MusicThemeId, e: React.MouseEvent) => {
    e.stopPropagation();

    if (playingThemeId === themeId) {
      stopPreview();
      return;
    }

    stopPreview();

    if (themeId === 'none') return;

    try {
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current.state === 'suspended') {
        await audioCtxRef.current.resume();
      }

      setPlayingThemeId(themeId);

      const buffer = await synthesizeThematicMusic(themeId, 8, audioCtxRef.current.sampleRate);
      
      const source = audioCtxRef.current.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const gain = audioCtxRef.current.createGain();
      gain.gain.setValueAtTime(0.35, audioCtxRef.current.currentTime);

      source.connect(gain);
      gain.connect(audioCtxRef.current.destination);

      source.start();
      currentSourceRef.current = source;
    } catch (err) {
      console.error('Error previewing music:', err);
      setPlayingThemeId(null);
    }
  };

  useEffect(() => {
    return () => {
      stopPreview();
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
            <Music className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
              4. Thematic Background Music
            </h2>
            <p className="text-[11px] text-slate-500">
              Synchronized acoustic soundtrack bed harmonized with the narration
            </p>
          </div>
        </div>

        <button
          type="button"
          id="toggle-auto-sync-music-btn"
          onClick={() => onToggleAutoSync(!autoSyncWithStyle)}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all cursor-pointer font-medium ${
            autoSyncWithStyle
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-slate-100 text-slate-600 border-slate-200 hover:text-slate-900'
          }`}
          title="When enabled, changing narration style automatically selects the matching soundtrack"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Auto-Sync with Style: {autoSyncWithStyle ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {MUSIC_THEMES.map((theme) => {
          const isSelected = selectedTheme === theme.id;
          const isRecommended = recommendedTheme === theme.id;
          const isPreviewing = playingThemeId === theme.id;

          return (
            <div
              key={theme.id}
              id={`music-theme-card-${theme.id}`}
              onClick={() => onSelectTheme(theme.id)}
              className={`p-3.5 rounded-xl border transition-all relative cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-50/80 border-slate-200 text-slate-900'
              }`}
            >
              {isRecommended && theme.id !== 'none' && (
                <span className={`absolute -top-2 right-2 flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full shadow-xs ${
                  isSelected
                    ? 'bg-emerald-400 text-slate-950 font-bold'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}>
                  <Sparkles className="w-2.5 h-2.5" />
                  Theme Match
                </span>
              )}

              <div>
                <div className="flex items-start justify-between gap-1.5 mb-1.5">
                  <div>
                    <h3 className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                      {theme.title}
                    </h3>
                    <span className={`text-[10px] font-medium ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                      {theme.mood}
                    </span>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  )}
                </div>

                <p className={`text-[11px] leading-relaxed mb-3 line-clamp-2 ${isSelected ? 'text-slate-300' : 'text-slate-600'}`}>
                  {theme.subtitle}
                </p>
              </div>

              <div className={`pt-2 border-t flex items-center justify-between gap-2 ${
                isSelected ? 'border-slate-800' : 'border-slate-100'
              }`}>
                {theme.id !== 'none' ? (
                  <>
                    <span className={`text-[10px] font-mono ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>
                      {theme.bpm} BPM
                    </span>

                    <button
                      type="button"
                      id={`preview-music-btn-${theme.id}`}
                      onClick={(e) => handleTogglePreview(theme.id, e)}
                      className={`flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md border transition-all cursor-pointer ${
                        isPreviewing
                          ? 'bg-emerald-600 text-white border-emerald-600 font-semibold shadow-xs'
                          : isSelected
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                      }`}
                      title={isPreviewing ? 'Stop music preview' : 'Preview music loop'}
                    >
                      {isPreviewing ? (
                        <>
                          <Square className="w-3 h-3 fill-current" />
                          <span>Stop</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 fill-current" />
                          <span>Audition</span>
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <span className={`text-[10px] italic ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>
                    Pure vocal track
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
