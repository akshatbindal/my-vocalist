import React from 'react';
import { Sliders, Volume2, Music2, ShieldAlert, Gauge } from 'lucide-react';
import { AudioMixSettings } from '../types';

interface MixerControlsProps {
  settings: AudioMixSettings;
  onChangeSettings: (settings: AudioMixSettings) => void;
  pacingOption: string;
  onChangePacingOption: (option: string) => void;
  isMusicActive: boolean;
}

export const MixerControls: React.FC<MixerControlsProps> = ({
  settings,
  onChangeSettings,
  pacingOption,
  onChangePacingOption,
  isMusicActive,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
          <Sliders className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
            5. Audio Mixing & Delivery Pacing
          </h2>
          <p className="text-[11px] text-slate-500">
            Balance vocal prominence, soundtrack presence, and speaking tempo
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Voice Volume */}
        <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-slate-800 font-medium flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-slate-700" />
              Voice Level
            </span>
            <span className="text-slate-900 font-mono font-bold">
              {Math.round(settings.voiceVolume * 100)}%
            </span>
          </div>
          <input
            id="voice-volume-slider"
            type="range"
            min="0"
            max="1.5"
            step="0.05"
            value={settings.voiceVolume}
            onChange={(e) =>
              onChangeSettings({ ...settings, voiceVolume: parseFloat(e.target.value) })
            }
            className="w-full accent-slate-900 bg-slate-200 rounded-lg h-1.5 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1.5 font-medium">
            <span>Muted</span>
            <span>Standard (100%)</span>
            <span>Boost (+50%)</span>
          </div>
        </div>

        {/* Music Volume & Ducking */}
        <div className={`p-4 rounded-xl border transition-all ${
          isMusicActive ? 'bg-slate-50/70 border-slate-200' : 'bg-slate-50/30 border-slate-200/60 opacity-50'
        }`}>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-slate-800 font-medium flex items-center gap-1.5">
              <Music2 className="w-3.5 h-3.5 text-emerald-700" />
              Music Level
            </span>
            <span className="text-emerald-800 font-mono font-bold">
              {Math.round(settings.musicVolume * 100)}%
            </span>
          </div>
          <input
            id="music-volume-slider"
            type="range"
            min="0"
            max="0.5"
            step="0.02"
            disabled={!isMusicActive}
            value={settings.musicVolume}
            onChange={(e) =>
              onChangeSettings({ ...settings, musicVolume: parseFloat(e.target.value) })
            }
            className="w-full accent-emerald-700 bg-slate-200 rounded-lg h-1.5 cursor-pointer disabled:cursor-not-allowed"
          />
          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1.5 font-medium">
            <span>Subtle (8%)</span>
            <span className="text-emerald-800 font-semibold">Light (18%)</span>
            <span>Prominent (50%)</span>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between">
            <label htmlFor="ducking-checkbox" className="text-[11px] text-slate-800 font-medium flex items-center gap-1.5 cursor-pointer">
              <input
                id="ducking-checkbox"
                type="checkbox"
                checked={settings.ducking}
                disabled={!isMusicActive}
                onChange={(e) =>
                  onChangeSettings({ ...settings, ducking: e.target.checked })
                }
                className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
              />
              <span>Smart Voice Ducking</span>
            </label>
            <span className="text-[10px] text-slate-500 font-medium">Auto -3dB during speech</span>
          </div>
        </div>

        {/* Narration Pacing */}
        <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-slate-800 font-medium flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-slate-700" />
              Delivery Pacing
            </span>
            <span className="text-slate-900 font-mono text-[11px] capitalize font-bold">
              {pacingOption}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 mt-2.5">
            {[
              { id: 'deliberate', label: 'Deliberate', hint: 'Slow & mindful' },
              { id: 'natural', label: 'Natural', hint: 'Conversational' },
              { id: 'brisk', label: 'Brisk', hint: 'Fast & energetic' },
            ].map((p) => {
              const isPacingSelected = pacingOption === p.id;
              return (
                <button
                  key={p.id}
                  id={`pacing-btn-${p.id}`}
                  type="button"
                  onClick={() => onChangePacingOption(p.id)}
                  className={`py-2 px-2 rounded-lg text-center border transition-all cursor-pointer ${
                    isPacingSelected
                      ? 'bg-slate-900 border-slate-900 text-white font-medium shadow-xs'
                      : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="text-[11px] font-semibold">{p.label}</div>
                  <div className={`text-[9px] truncate ${isPacingSelected ? 'text-slate-300' : 'text-slate-500'}`}>{p.hint}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
