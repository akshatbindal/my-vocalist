import React from 'react';
import { Mic, User, CheckCircle2, Star } from 'lucide-react';
import { VOICES } from '../data/presets';
import { GeminiVoiceName } from '../types';

interface VoiceSelectorProps {
  selectedVoice: GeminiVoiceName;
  onSelectVoice: (voice: GeminiVoiceName) => void;
  recommendedVoice?: GeminiVoiceName;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  selectedVoice,
  onSelectVoice,
  recommendedVoice,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
              3. Voice Actor
            </h2>
            <p className="text-[11px] text-slate-500">
              Select vocal timbre and acoustic delivery
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {VOICES.map((voice) => {
          const isSelected = selectedVoice === voice.id;
          const isRecommended = recommendedVoice === voice.id;

          return (
            <button
              key={voice.id}
              id={`voice-btn-${voice.id}`}
              type="button"
              onClick={() => onSelectVoice(voice.id)}
              className={`text-left p-3.5 rounded-xl border transition-all relative cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-50/80 border-slate-200 text-slate-900'
              }`}
            >
              {isRecommended && (
                <span className={`absolute -top-2 right-2 flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full shadow-xs ${
                  isSelected
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-amber-50 text-amber-900 border border-amber-200'
                }`}>
                  <Star className="w-2.5 h-2.5 fill-current" />
                  Recommended
                </span>
              )}

              <div className="flex items-center justify-between gap-1 mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold ${
                      isSelected
                        ? 'bg-slate-800 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                      {voice.name}
                    </h3>
                    <span className={`text-[10px] block ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                      {voice.gender}
                    </span>
                  </div>
                </div>
                {isSelected && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
              </div>

              <p className={`text-[11px] font-medium leading-snug mb-1 ${isSelected ? 'text-slate-200' : 'text-slate-800'}`}>
                {voice.character}
              </p>
              <p className={`text-[10px] leading-tight ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>
                {voice.bestFor}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
