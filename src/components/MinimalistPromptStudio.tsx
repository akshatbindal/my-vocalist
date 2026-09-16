import React, { useState } from 'react';
import {
  Sparkles,
  Wand2,
  Loader2,
  Volume2,
  FileCheck2,
  ArrowRight,
  Music,
  Mic,
  Sliders,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  SlidersHorizontal,
  Layers,
  Clock
} from 'lucide-react';
import {
  CleanedScriptPlan,
  VoiceStyle,
  GeminiVoiceName,
  MusicThemeId
} from '../types';
import { RAW_MESSY_SAMPLES, STYLES, VOICES, MUSIC_THEMES } from '../data/presets';
import { splitScriptIntoChunks, ChunkProgressInfo } from '../services/scriptChunker';

interface MinimalistPromptStudioProps {
  onGenerate: (rawScript: string) => Promise<void>;
  isGenerating: boolean;
  generationStep: string;
  chunkProgress?: ChunkProgressInfo | null;
  lastPlan: CleanedScriptPlan | null;
  rawInput: string;
  onChangeRawInput: (val: string) => void;
  onSwitchToStudio: () => void;
  hasGeneratedAudio: boolean;
}

export const MinimalistPromptStudio: React.FC<MinimalistPromptStudioProps> = ({
  onGenerate,
  isGenerating,
  generationStep,
  chunkProgress,
  lastPlan,
  rawInput,
  onChangeRawInput,
  onSwitchToStudio,
  hasGeneratedAudio,
}) => {
  const [showScriptDiff, setShowScriptDiff] = useState(false);

  const rawWordsCount = rawInput.trim() ? rawInput.trim().split(/\s+/).length : 0;
  const estimatedSeconds = Math.ceil((rawWordsCount / 140) * 60);
  const estimatedChunks = splitScriptIntoChunks(rawInput, 150).length;

  const handleSampleClick = (sampleText: string) => {
    onChangeRawInput(sampleText);
  };

  const getStyleLabel = (styleId?: VoiceStyle) => {
    return STYLES.find((s) => s.id === styleId)?.label || styleId || 'Corporate';
  };

  const getMusicTitle = (musicId?: MusicThemeId) => {
    return MUSIC_THEMES.find((m) => m.id === musicId)?.title || musicId || 'Executive Horizon';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Introduction Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-slate-600" />
              <span>One-Click Smart Narration</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Paste your raw script or slides
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Paste unformatted slides, meeting bullet points, or rough drafts. Gemini 3.8 Flash automatically fixes grammar, formats natural speech pauses, matches the ideal voice, and mixes soundtrack beds in one step.
            </p>
          </div>

          <button
            type="button"
            onClick={onSwitchToStudio}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 transition-colors shrink-0 self-start sm:self-auto cursor-pointer"
            title="Switch to detailed multi-track studio"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600" />
            <span>Open Studio Pro</span>
          </button>
        </div>

        {/* Raw Script Prompt Box */}
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <label htmlFor="minimalist-raw-prompt" className="font-semibold text-slate-800">
              Raw Script Draft
            </label>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-slate-600">Try sample:</span>
              {RAW_MESSY_SAMPLES.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSampleClick(sample.text)}
                  className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium border border-slate-200 transition-colors cursor-pointer"
                >
                  {sample.label}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <textarea
              id="minimalist-raw-prompt"
              value={rawInput}
              onChange={(e) => onChangeRawInput(e.target.value)}
              placeholder="Example: Slide 1: Welcome team, today we are going over our Q3 results. user retention rose 40% but we need to address churn... Slide 2: next steps we gotta optimize signup latency..."
              rows={7}
              className="w-full bg-slate-50/60 border border-slate-200 rounded-xl p-4 text-slate-900 placeholder:text-slate-400 text-sm leading-relaxed focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all resize-y"
            />
          </div>

          {/* Script statistics & chunking indicator */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 px-1 gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span>{rawWordsCount} {rawWordsCount === 1 ? 'word' : 'words'}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                ~{estimatedSeconds < 60 ? `${estimatedSeconds}s` : `${Math.floor(estimatedSeconds / 60)}m ${estimatedSeconds % 60}s`}
              </span>
              {estimatedChunks > 1 && (
                <>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                    <Layers className="w-3 h-3 text-slate-600" />
                    Auto-splits into {estimatedChunks} sections & stitches seamlessly
                  </span>
                </>
              )}
            </div>
            <div className="text-[11px] text-slate-600">
              Supports long multi-slide decks & documents
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="text-xs text-slate-600 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Gemini 3.8 Flash automatically fixes grammar, slide transitions & audio sync</span>
            </div>

            <button
              type="button"
              id="minimalist-generate-btn"
              onClick={() => onGenerate(rawInput)}
              disabled={isGenerating || !rawInput.trim()}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>
                    {generationStep === 'cleaning' && 'Polishing script & matching theme...'}
                    {generationStep === 'generating_voice' && (
                      chunkProgress && chunkProgress.totalChunks > 1
                        ? `Synthesizing section ${chunkProgress.currentChunk} of ${chunkProgress.totalChunks}...`
                        : 'Synthesizing voice narration...'
                    )}
                    {generationStep === 'stitching_audio' && 'Stitching audio sections seamlessly...'}
                    {generationStep === 'mixing_master' && 'Mastering audio mix...'}
                    {!['cleaning', 'generating_voice', 'stitching_audio', 'mixing_master'].includes(generationStep) && 'Producing audio...'}
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-slate-200" />
                  <span>
                    {estimatedChunks > 1 ? `Generate Master Audio (${estimatedChunks} Sections)` : 'Generate Master Audio'}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Progress bar during multi-section synthesis */}
          {isGenerating && chunkProgress && chunkProgress.totalChunks > 1 && (
            <div className="pt-2">
              <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                <span>Rendering section {chunkProgress.currentChunk} of {chunkProgress.totalChunks}</span>
                <span>{Math.round((chunkProgress.currentChunk / chunkProgress.totalChunks) * 100)}%</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="bg-slate-900 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${(chunkProgress.currentChunk / chunkProgress.totalChunks) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Intelligence Card (Rendered when a generation has been planned) */}
      {lastPlan && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs animate-fadeIn space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  AI Editorial Polish
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" />
                  Cleaned & Formatted
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                {lastPlan.detectedTitle || 'Narration Production'}
              </h3>
            </div>

            {/* Badges of auto-detected attributes */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 flex items-center gap-1">
                <span className="text-slate-600">Style:</span>
                <strong>{getStyleLabel(lastPlan.style)}</strong>
              </span>
              <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 flex items-center gap-1">
                <Mic className="w-3 h-3 text-slate-600" />
                <strong>{lastPlan.recommendedVoice}</strong>
              </span>
              <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <Music className="w-3 h-3 text-emerald-600" />
                <strong>{getMusicTitle(lastPlan.musicTheme)}</strong>
              </span>
              {lastPlan.chunksCount && lastPlan.chunksCount > 1 && (
                <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-indigo-600" />
                  <strong>{lastPlan.chunksCount} Sections Stitched</strong>
                </span>
              )}
            </div>
          </div>

          {/* Rationale & Cleaning Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="font-semibold text-slate-700 block mb-1">
                Why this style & soundtrack:
              </span>
              <p className="text-slate-600 leading-relaxed">
                {lastPlan.rationale}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="font-semibold text-slate-700 block mb-1">
                Editorial Corrections:
              </span>
              <ul className="space-y-0.5 text-slate-600 list-disc list-inside">
                {lastPlan.cleaningNotes?.map((note, i) => (
                  <li key={i}>{note}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Toggle Script Comparison */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowScriptDiff(!showScriptDiff)}
              className="text-xs text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>{showScriptDiff ? 'Hide Script Details' : 'View Polished Spoken Script'}</span>
              {showScriptDiff ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showScriptDiff && (
              <div className="mt-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-normal leading-relaxed">
                <div className="font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                  Final Spoken Text (Synthesized by Gemini TTS):
                </div>
                <p className="whitespace-pre-wrap font-sans text-slate-800 bg-white p-3 rounded-lg border border-slate-200/80">
                  {lastPlan.polishedScript}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
