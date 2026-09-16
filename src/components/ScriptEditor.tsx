import React from 'react';
import { Sparkles, Trash2, ClipboardPaste, Clock, Type, Wand2, Layers } from 'lucide-react';
import { splitScriptIntoChunks } from '../services/scriptChunker';

interface ScriptEditorProps {
  text: string;
  onChange: (value: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  analysisRationale?: string | null;
}

export const ScriptEditor: React.FC<ScriptEditorProps> = ({
  text,
  onChange,
  onAnalyze,
  isAnalyzing,
  analysisRationale,
}) => {
  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const estimatedSeconds = Math.ceil((wordCount / 140) * 60);
  const chunks = splitScriptIntoChunks(text, 150);
  const chunksCount = chunks.length;

  const formatDuration = (secs: number) => {
    if (secs < 60) return `${secs}s`;
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}m ${rem}s`;
  };

  const handlePaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (clipboardText) {
        onChange(clipboardText);
      }
    } catch {
      // Fallback if clipboard API is restricted in iframe
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
            <Type className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
              1. Narration Script
            </h2>
            <p className="text-[11px] text-slate-500">
              Input or edit the exact text spoken by the narrator
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            id="paste-script-btn"
            onClick={handlePaste}
            className="flex items-center gap-1 text-xs text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer"
            title="Paste from clipboard"
          >
            <ClipboardPaste className="w-3.5 h-3.5 text-slate-500" />
            <span>Paste</span>
          </button>

          {text.length > 0 && (
            <button
              type="button"
              id="clear-script-btn"
              onClick={() => onChange('')}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer"
              title="Clear script"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            id="auto-detect-style-btn"
            onClick={onAnalyze}
            disabled={isAnalyzing || !text.trim()}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200/80 disabled:opacity-40 disabled:pointer-events-none px-3 py-1.5 rounded-lg border border-slate-200 transition-all cursor-pointer"
            title="Auto-detect best voice, style and music"
          >
            <Wand2 className={`w-3.5 h-3.5 text-slate-600 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'Analyzing...' : 'Auto-Match Theme'}</span>
          </button>
        </div>
      </div>

      <div className="relative">
        <textarea
          id="narration-script-textarea"
          value={text}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter or paste your narration script here..."
          rows={5}
          className="w-full bg-slate-50/60 border border-slate-200 rounded-xl p-3.5 text-slate-900 placeholder-slate-400 text-sm leading-relaxed focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all resize-y min-h-[120px]"
        />
      </div>

      {analysisRationale && (
        <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-900">AI Recommendation: </span>
            {analysisRationale}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 mt-2.5 px-1 gap-2">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span>{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
          <span>•</span>
          <span>{charCount} characters</span>
          {chunksCount > 1 && (
            <>
              <span>•</span>
              <span className="inline-flex items-center gap-1 font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                <Layers className="w-3 h-3 text-slate-600" />
                {chunksCount} sections auto-stitched
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-slate-600 font-medium">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Est. Duration: ~{formatDuration(estimatedSeconds)}</span>
        </div>
      </div>
    </div>
  );
};
