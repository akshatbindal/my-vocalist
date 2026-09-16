import React from 'react';
import { Sparkles, SlidersHorizontal, Wand2, Volume2, LayoutGrid, Zap } from 'lucide-react';
import { SCRIPT_TEMPLATES } from '../data/presets';
import { VoiceStyle, GeminiVoiceName, MusicThemeId, StudioMode } from '../types';

interface HeaderProps {
  mode: StudioMode;
  onSelectMode: (mode: StudioMode) => void;
  onSelectTemplate: (template: {
    text: string;
    style: VoiceStyle;
    voice: GeminiVoiceName;
    music: MusicThemeId;
  }) => void;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  onSelectMode,
  onSelectTemplate,
}) => {
  return (
    <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Brand & Identity */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs font-semibold">
              <Volume2 className="w-5 h-5 text-slate-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Vocalist
                </h1>
                <span className="text-[10px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  Gemini TTS
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Expressive narration styles with synchronized soundtrack beds & master WAV export
              </p>
            </div>
          </div>

          {/* Mode Switcher & Presets */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Minimalist vs Studio Segmented Control */}
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-medium">
              <button
                type="button"
                id="mode-minimal-btn"
                onClick={() => onSelectMode('minimal')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  mode === 'minimal'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Minimalist</span>
              </button>

              <button
                type="button"
                id="mode-studio-btn"
                onClick={() => onSelectMode('studio')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  mode === 'studio'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600" />
                <span>Studio Pro</span>
              </button>
            </div>

            {/* Quick Presets for Studio Mode */}
            {mode === 'studio' && (
              <div className="hidden lg:flex items-center gap-1.5 pl-2 border-l border-slate-200">
                <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
                  Presets:
                </span>
                {SCRIPT_TEMPLATES.slice(0, 3).map((tpl) => (
                  <button
                    key={tpl.id}
                    id={`preset-btn-${tpl.id}`}
                    onClick={() => onSelectTemplate(tpl)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    {tpl.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
