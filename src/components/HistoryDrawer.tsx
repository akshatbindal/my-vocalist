import React from 'react';
import { History, Play, Trash2, Clock, Music } from 'lucide-react';
import { GenerationResult } from '../types';

interface HistoryDrawerProps {
  history: GenerationResult[];
  onSelectHistoryItem: (item: GenerationResult) => void;
  onClearHistory: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  history,
  onSelectHistoryItem,
  onClearHistory,
}) => {
  if (history.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs mt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
              Recent Generations
            </h2>
            <p className="text-[11px] text-slate-500">
              Switch between previous audio takes and compare vocal styles
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClearHistory}
          className="text-xs text-slate-500 hover:text-rose-600 transition-colors flex items-center gap-1 cursor-pointer font-medium"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear</span>
        </button>
      </div>

      <div className="space-y-2">
        {history.map((item, idx) => (
          <div
            key={idx}
            onClick={() => onSelectHistoryItem(item)}
            className="p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 transition-all flex items-center justify-between gap-3 cursor-pointer group"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="text-xs font-bold text-slate-900 capitalize">
                  {item.style.replace('_', ' ')}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 font-mono font-medium">
                  {item.voice}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1 font-medium">
                  <Music className="w-2.5 h-2.5" />
                  {item.musicTheme.replace('_', ' ')}
                </span>
                <span className="text-[10px] text-slate-500 ml-auto flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {item.createdAt}
                </span>
              </div>
              <p className="text-xs text-slate-600 truncate font-normal">
                "{item.text}"
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-slate-900 group-hover:text-slate-950 flex items-center gap-1 font-semibold">
                <Play className="w-3.5 h-3.5 fill-current" />
                Load
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
