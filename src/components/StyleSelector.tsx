import React from 'react';
import {
  Briefcase,
  Sparkles,
  Smile,
  Palette,
  BookOpen,
  Wind,
  Radio,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import { STYLES } from '../data/presets';
import { VoiceStyle } from '../types';

interface StyleSelectorProps {
  selectedStyle: VoiceStyle;
  onSelectStyle: (style: VoiceStyle) => void;
}

export const StyleSelector: React.FC<StyleSelectorProps> = ({
  selectedStyle,
  onSelectStyle,
}) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Briefcase':
        return <Briefcase className="w-4 h-4" />;
      case 'Sparkles':
        return <Sparkles className="w-4 h-4" />;
      case 'Smile':
        return <Smile className="w-4 h-4" />;
      case 'Palette':
        return <Palette className="w-4 h-4" />;
      case 'BookOpen':
        return <BookOpen className="w-4 h-4" />;
      case 'Wind':
        return <Wind className="w-4 h-4" />;
      case 'Radio':
        return <Radio className="w-4 h-4" />;
      default:
        return <HelpCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
              2. Narration Style
            </h2>
            <p className="text-[11px] text-slate-500">
              Shapes delivery cadence, inflection, and vocal attitude
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {STYLES.map((style) => {
          const isSelected = selectedStyle === style.id;
          return (
            <button
              key={style.id}
              id={`style-btn-${style.id}`}
              type="button"
              onClick={() => onSelectStyle(style.id)}
              className={`group text-left p-3.5 rounded-xl border transition-all relative cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-50/80 border-slate-200 text-slate-900'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`p-1.5 rounded-lg transition-colors ${
                      isSelected
                        ? 'bg-slate-800 text-white'
                        : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                    }`}
                  >
                    {getIcon(style.iconName)}
                  </div>
                  <div>
                    <h3 className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                      {style.label}
                    </h3>
                    <span className={`text-[10px] block ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                      {style.category}
                    </span>
                  </div>
                </div>
                {isSelected && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                )}
              </div>

              <p className={`text-[11px] leading-relaxed line-clamp-2 mb-3 ${isSelected ? 'text-slate-300' : 'text-slate-600'}`}>
                {style.description}
              </p>

              <div className={`flex items-center gap-2 pt-2 border-t text-[10px] ${
                isSelected ? 'border-slate-800 text-slate-300' : 'border-slate-100 text-slate-500'
              }`}>
                <span className="truncate">
                  Voice: <strong className={isSelected ? 'text-white font-medium' : 'text-slate-800 font-medium'}>{style.recommendedVoice}</strong>
                </span>
                <span>•</span>
                <span className="truncate">
                  Music: <strong className={`capitalize font-medium ${isSelected ? 'text-white' : 'text-slate-800'}`}>{style.recommendedMusic.replace('_', ' ')}</strong>
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
