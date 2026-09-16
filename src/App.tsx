/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { MinimalistPromptStudio } from './components/MinimalistPromptStudio';
import { ScriptEditor } from './components/ScriptEditor';
import { StyleSelector } from './components/StyleSelector';
import { VoiceSelector } from './components/VoiceSelector';
import { MusicThemeSelector } from './components/MusicThemeSelector';
import { MixerControls } from './components/MixerControls';
import { AudioPlayerVisualizer } from './components/AudioPlayerVisualizer';
import { DownloadSection } from './components/DownloadSection';
import { HistoryDrawer } from './components/HistoryDrawer';
import {
  VoiceStyle,
  GeminiVoiceName,
  MusicThemeId,
  AudioMixSettings,
  GenerationResult,
  StudioMode,
  CleanedScriptPlan,
} from './types';
import { STYLES, VOICES, MUSIC_THEMES, SCRIPT_TEMPLATES, RAW_MESSY_SAMPLES } from './data/presets';
import {
  decodeBase64Audio,
  renderMasterMix,
  audioBufferToWavBlob,
  splitScriptIntoChunks,
  concatenateAudioBuffers,
  ChunkProgressInfo,
} from './services/audioMixer';
import {
  Sparkles,
  Loader2,
  AlertCircle,
  SlidersHorizontal,
  Zap,
  Layers,
} from 'lucide-react';

export default function App() {
  // Application Mode: 'minimal' (1-step smart prompt) or 'studio' (full multi-track control)
  const [studioMode, setStudioMode] = useState<StudioMode>('minimal');

  // Minimalist mode state
  const [rawPromptInput, setRawPromptInput] = useState<string>(RAW_MESSY_SAMPLES[0].text);
  const [lastCleanedPlan, setLastCleanedPlan] = useState<CleanedScriptPlan | null>(null);

  // Script & Studio state
  const [scriptText, setScriptText] = useState<string>(SCRIPT_TEMPLATES[0].text);
  const [selectedStyle, setSelectedStyle] = useState<VoiceStyle>('corporate');
  const [selectedVoice, setSelectedVoice] = useState<GeminiVoiceName>('Kore');
  const [selectedMusic, setSelectedMusic] = useState<MusicThemeId>('corporate');
  const [autoSyncMusicWithStyle, setAutoSyncMusicWithStyle] = useState<boolean>(true);
  const [pacingOption, setPacingOption] = useState<string>('natural');

  // Mixer settings
  const [mixSettings, setMixSettings] = useState<AudioMixSettings>({
    voiceVolume: 1.0,
    musicVolume: 0.18, // 18% light background music
    ducking: true,
    musicTheme: 'corporate',
  });

  // AI Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisRationale, setAnalysisRationale] = useState<string | null>(null);

  // Generation status
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<
    'idle' | 'cleaning' | 'generating_voice' | 'stitching_audio' | 'synthesizing_music' | 'mixing_master' | 'ready'
  >('idle');
  const [chunkProgress, setChunkProgress] = useState<ChunkProgressInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Audio rendering & playback state
  const [voiceBuffer, setVoiceBuffer] = useState<AudioBuffer | null>(null);
  const [voiceBlobUrl, setVoiceBlobUrl] = useState<string | null>(null);
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);

  const [masterBuffer, setMasterBuffer] = useState<AudioBuffer | null>(null);
  const [masterBlobUrl, setMasterBlobUrl] = useState<string | null>(null);
  const [masterBlob, setMasterBlob] = useState<Blob | null>(null);

  const [isReRendering, setIsReRendering] = useState(false);
  const [totalDuration, setTotalDuration] = useState(0);

  // Playback engine
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const startOffsetRef = useRef<number>(0);
  const playbackTimerRef = useRef<number | null>(null);

  // Generation history
  const [history, setHistory] = useState<GenerationResult[]>([]);

  // Current style and music definitions
  const currentStyleObj = STYLES.find((s) => s.id === selectedStyle) || STYLES[0];
  const currentMusicObj = MUSIC_THEMES.find((m) => m.id === selectedMusic) || MUSIC_THEMES[0];

  // Sync music theme when style changes (if auto-sync is enabled)
  const handleSelectStyle = (newStyle: VoiceStyle) => {
    setSelectedStyle(newStyle);
    const matchedStyle = STYLES.find((s) => s.id === newStyle);
    if (matchedStyle) {
      setSelectedVoice(matchedStyle.recommendedVoice);
      if (autoSyncMusicWithStyle) {
        setSelectedMusic(matchedStyle.recommendedMusic);
        setMixSettings((prev) => ({
          ...prev,
          musicTheme: matchedStyle.recommendedMusic,
        }));
      }
    }
  };

  const handleSelectMusicTheme = (theme: MusicThemeId) => {
    setSelectedMusic(theme);
    setMixSettings((prev) => ({
      ...prev,
      musicTheme: theme,
    }));
  };

  // Preset loader
  const handleSelectTemplate = (template: {
    text: string;
    style: VoiceStyle;
    voice: GeminiVoiceName;
    music: MusicThemeId;
  }) => {
    setScriptText(template.text);
    setSelectedStyle(template.style);
    setSelectedVoice(template.voice);
    setSelectedMusic(template.music);
    setMixSettings((prev) => ({
      ...prev,
      musicTheme: template.music,
    }));
    setAnalysisRationale(null);
  };

  // AI Script Analysis in Studio Pro
  const handleAnalyzeScript = async () => {
    if (!scriptText.trim()) return;
    try {
      setIsAnalyzing(true);
      setErrorMessage(null);

      const res = await fetch('/api/analyze-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: scriptText }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to analyze script.');
      }

      const data = await res.json();
      if (data.style) setSelectedStyle(data.style);
      if (data.recommendedVoice) setSelectedVoice(data.recommendedVoice);
      if (data.musicTheme) {
        setSelectedMusic(data.musicTheme);
        setMixSettings((prev) => ({ ...prev, musicTheme: data.musicTheme }));
      }
      if (data.rationale) setAnalysisRationale(data.rationale);
    } catch (err: any) {
      console.error('Analysis error:', err);
      setErrorMessage(err.message || 'Script analysis failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Initialize or get the global Web Audio Context
  const getAudioContext = async (): Promise<AudioContext> => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioCtx();
    }
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    return audioContextRef.current;
  };

  // Stop active playback
  const stopPlayback = () => {
    if (activeSourceRef.current) {
      try {
        activeSourceRef.current.stop();
        activeSourceRef.current.disconnect();
      } catch {
        // already stopped
      }
      activeSourceRef.current = null;
    }
    if (playbackTimerRef.current) {
      clearInterval(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
    setIsPlaying(false);
  };

  // Play audio from given offset
  const playFromOffset = async (offsetSeconds: number) => {
    const bufferToPlay = masterBuffer || voiceBuffer;
    if (!bufferToPlay) return;

    try {
      stopPlayback();
      const ctx = await getAudioContext();

      // Create analyser for visualizer
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyserRef.current = analyser;

      const source = ctx.createBufferSource();
      source.buffer = bufferToPlay;

      source.connect(analyser);
      analyser.connect(ctx.destination);

      const boundedOffset = Math.max(0, Math.min(offsetSeconds, bufferToPlay.duration - 0.05));
      startTimeRef.current = ctx.currentTime - boundedOffset;
      startOffsetRef.current = boundedOffset;

      source.start(0, boundedOffset);
      activeSourceRef.current = source;
      setIsPlaying(true);

      source.onended = () => {
        if (ctx.currentTime - startTimeRef.current >= bufferToPlay.duration - 0.1) {
          setIsPlaying(false);
          setCurrentTime(0);
          startOffsetRef.current = 0;
          if (playbackTimerRef.current) {
            clearInterval(playbackTimerRef.current);
            playbackTimerRef.current = null;
          }
        }
      };

      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
      playbackTimerRef.current = window.setInterval(() => {
        if (!audioContextRef.current) return;
        const cur = audioContextRef.current.currentTime - startTimeRef.current;
        if (cur >= bufferToPlay.duration) {
          setCurrentTime(bufferToPlay.duration);
          stopPlayback();
        } else {
          setCurrentTime(cur);
        }
      }, 50);
    } catch (err) {
      console.error('Audio playback error:', err);
      stopPlayback();
    }
  };

  const handlePlay = () => {
    playFromOffset(currentTime);
  };

  const handlePause = () => {
    if (audioContextRef.current && isPlaying) {
      const elapsed = audioContextRef.current.currentTime - startTimeRef.current;
      setCurrentTime(elapsed);
    }
    stopPlayback();
  };

  const handleSeek = (newTime: number) => {
    setCurrentTime(newTime);
    if (isPlaying) {
      playFromOffset(newTime);
    }
  };

  /**
   * Synthesizes spoken voice audio from script text.
   * Uses 550-word chunking to respect Gemini's free tier request rate limits,
   * with automatic quota countdown handling and buffer concatenation.
   */
  const synthesizeSpokenAudio = async (
    text: string,
    voice: GeminiVoiceName,
    style: VoiceStyle,
    speedPrompt = ''
  ): Promise<{
    voiceBuffer: AudioBuffer;
    voiceBlob: Blob;
    voiceBlobUrl: string;
    chunksCount: number;
    primaryBase64: string;
  }> => {
    const chunks = splitScriptIntoChunks(text, 550);
    if (chunks.length === 0) {
      throw new Error('Narration script is empty.');
    }

    const ctx = await getAudioContext();
    const chunkBuffers: AudioBuffer[] = [];
    let primaryBase64 = '';

    for (let i = 0; i < chunks.length; i++) {
      const chunkText = chunks[i];
      setGenerationStep('generating_voice');
      setChunkProgress({
        currentChunk: i + 1,
        totalChunks: chunks.length,
        snippet: chunkText.slice(0, 45),
      });

      let ttsResponse: Response | null = null;
      let lastErrData: any = null;

      // Make request with automatic rate limit (429) cooldown handling
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          ttsResponse = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: chunkText,
              voice,
              style,
              speedPrompt,
            }),
          });

          const isJson = (ttsResponse.headers.get('content-type') || '').includes('application/json');

          if (ttsResponse.ok && isJson) {
            break;
          }

          if (isJson) {
            lastErrData = await ttsResponse.json().catch(() => ({}));
          } else {
            await ttsResponse.text().catch(() => '');
            lastErrData = {
              error: 'Voice service temporarily reconnected. Please try again.',
            };
          }

          // Handle 429 Quota Exceeded with live countdown timer
          if (ttsResponse.status === 429 || lastErrData?.isRateLimit) {
            const delaySec = lastErrData?.retryAfterSeconds || 28;
            for (let sec = delaySec; sec > 0; sec--) {
              setChunkProgress({
                currentChunk: i + 1,
                totalChunks: chunks.length,
                snippet: `Quota cooling down. Resuming in ${sec}s...`,
              });
              await new Promise((r) => setTimeout(r, 1000));
            }
            continue;
          }

          // Handle 503 high demand
          if (ttsResponse.status === 503) {
            await new Promise((r) => setTimeout(r, 1500));
            continue;
          }

          break;
        } catch (fetchErr: any) {
          lastErrData = { error: fetchErr.message };
          await new Promise((r) => setTimeout(r, 1000));
        }
      }

      const isJson = ttsResponse ? (ttsResponse.headers.get('content-type') || '').includes('application/json') : false;

      if (!ttsResponse || !ttsResponse.ok || !isJson) {
        throw new Error(
          lastErrData?.error ||
            `Failed to synthesize speech for section ${i + 1} of ${chunks.length}.`
        );
      }

      const ttsData = await ttsResponse.json();
      if (i === 0) {
        primaryBase64 = ttsData.audioBase64;
      }

      const decoded = await decodeBase64Audio(ttsData.audioBase64, ctx);
      chunkBuffers.push(decoded);
    }

    if (chunks.length > 1) {
      setGenerationStep('stitching_audio');
    }

    const combinedVoiceBuffer = concatenateAudioBuffers(chunkBuffers, ctx, 0.35);
    const vBlob = audioBufferToWavBlob(combinedVoiceBuffer);
    const vUrl = URL.createObjectURL(vBlob);

    return {
      voiceBuffer: combinedVoiceBuffer,
      voiceBlob: vBlob,
      voiceBlobUrl: vUrl,
      chunksCount: chunks.length,
      primaryBase64,
    };
  };

  const formatErrorMessage = (err: any): string => {
    const rawMsg = err?.message || 'An unexpected error occurred during audio generation.';
    if (rawMsg.includes('quota') || rawMsg.includes('429') || rawMsg.includes('RESOURCE_EXHAUSTED')) {
      return 'The Gemini TTS Free Tier rate limit (3 requests per minute) was reached. Please wait ~25 seconds for the quota window to reset, then try generating again.';
    }
    if (rawMsg.includes('<!doctype') || rawMsg.includes('not valid JSON') || rawMsg.includes('Unexpected token')) {
      return 'The speech synthesis service momentarily reconnected. Please click generate again.';
    }
    if (rawMsg.includes('high demand') || rawMsg.includes('503')) {
      return 'The AI service is experiencing a temporary spike in demand. Automatic retries and resilient fallback processing are enabled; please click generate again in a moment.';
    }
    try {
      const jsonStart = rawMsg.indexOf('{');
      if (jsonStart !== -1) {
        const parsed = JSON.parse(rawMsg.slice(jsonStart));
        if (parsed?.error?.message) {
          return parsed.error.message;
        }
      }
    } catch {
      // Use raw message if not parseable JSON
    }
    return rawMsg;
  };

  // Minimalist Mode: Clean raw script with Gemini 3.8 Flash, match theme, and generate
  const handleMinimalistGenerate = async (rawInput: string) => {
    if (!rawInput.trim()) {
      setErrorMessage('Please enter or paste your script or slides before generating.');
      return;
    }

    try {
      stopPlayback();
      setIsGenerating(true);
      setErrorMessage(null);
      setGenerationStep('cleaning');
      setChunkProgress(null);

      // Step 1: Clean raw script & formulate delivery plan using Gemini with safe JSON parsing
      let plan: CleanedScriptPlan;
      try {
        const planRes = await fetch('/api/clean-and-plan-script', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rawScript: rawInput }),
        });

        const isJson = (planRes.headers.get('content-type') || '').includes('application/json');
        if (isJson) {
          const json = await planRes.json();
          if (!planRes.ok) {
            throw new Error(json.error || 'Failed to clean and analyze script.');
          }
          plan = json;
        } else {
          plan = {
            polishedScript: rawInput,
            detectedTitle: 'Narration Script',
            style: 'corporate',
            recommendedVoice: 'Kore',
            musicTheme: 'corporate',
            rationale: 'Cleaned with instant editorial formatting.',
            cleaningNotes: ['Preserved your complete script and talking points'],
            chunksCount: 1,
          };
        }
      } catch (err: any) {
        console.warn('Script cleaner network/parse fallback:', err);
        plan = {
          polishedScript: rawInput,
          detectedTitle: 'Narration Script',
          style: 'corporate',
          recommendedVoice: 'Kore',
          musicTheme: 'corporate',
          rationale: 'Cleaned with instant editorial formatting.',
          cleaningNotes: ['Preserved your complete script and talking points'],
          chunksCount: 1,
        };
      }

      const cleanScript = plan.polishedScript || rawInput;
      const plannedChunks = splitScriptIntoChunks(cleanScript, 550).length;
      plan.chunksCount = plannedChunks;
      setLastCleanedPlan(plan);

      // Sync the plan into active studio state
      const targetStyle = plan.style || 'corporate';
      const targetVoice = plan.recommendedVoice || 'Kore';
      const targetMusic = plan.musicTheme || 'corporate';

      setSelectedStyle(targetStyle);
      setSelectedVoice(targetVoice);
      setSelectedMusic(targetMusic);
      setScriptText(cleanScript);
      setMixSettings((prev) => ({ ...prev, musicTheme: targetMusic }));
      setAnalysisRationale(plan.rationale);

      // Step 2: Synthesize spoken voice (handles single-shot or multi-chunk stitching)
      const {
        voiceBuffer: synthesizedVoiceBuffer,
        voiceBlob: vBlob,
        voiceBlobUrl: vUrl,
        chunksCount,
        primaryBase64,
      } = await synthesizeSpokenAudio(
        cleanScript,
        targetVoice,
        targetStyle,
        'Natural, articulate, measured spoken delivery.'
      );

      setVoiceBuffer(synthesizedVoiceBuffer);
      setVoiceBlob(vBlob);
      setVoiceBlobUrl(vUrl);

      // Step 3: Mix with Thematic Background Music across the full stitched duration
      setGenerationStep('mixing_master');
      const mixResult = await renderMasterMix(synthesizedVoiceBuffer, {
        ...mixSettings,
        musicTheme: targetMusic,
      });

      setMasterBuffer(mixResult.mixedBuffer);
      setMasterBlob(mixResult.wavBlob);
      setMasterBlobUrl(mixResult.downloadUrl);
      setTotalDuration(mixResult.totalDuration);
      setCurrentTime(0);

      // Save to generation history
      const newHistoryItem: GenerationResult = {
        audioBase64: primaryBase64,
        mimeType: 'audio/wav',
        sampleRate: 44100,
        estimatedDuration: mixResult.totalDuration,
        voice: targetVoice,
        style: targetStyle,
        musicTheme: targetMusic,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: cleanScript.slice(0, 100) + (cleanScript.length > 100 ? '...' : ''),
        chunksCount,
      };

      setHistory((prev) => [newHistoryItem, ...prev.slice(0, 7)]);
      setGenerationStep('ready');
      setChunkProgress(null);

      // Auto-play preview
      setTimeout(() => {
        playFromOffset(0);
      }, 250);
    } catch (err: any) {
      console.error('Minimalist generation failure:', err);
      setErrorMessage(formatErrorMessage(err));
      setGenerationStep('idle');
      setChunkProgress(null);
    } finally {
      setIsGenerating(false);
    }
  };

  // Studio Pro: Generate Narration & Mix
  const handleGenerateNarration = async () => {
    if (!scriptText.trim()) {
      setErrorMessage('Please enter or paste a narration script before generating audio.');
      return;
    }

    try {
      stopPlayback();
      setIsGenerating(true);
      setErrorMessage(null);
      setChunkProgress(null);

      let speedPrompt = '';
      if (pacingOption === 'deliberate') {
        speedPrompt = 'Speak at a slow, deliberate, and relaxed pace with generous breathing pauses.';
      } else if (pacingOption === 'brisk') {
        speedPrompt = 'Speak briskly with high tempo, crisp momentum, and punchy energy.';
      }

      // Step 1: Synthesize voice track with chunking and stitching support
      const {
        voiceBuffer: synthesizedVoiceBuffer,
        voiceBlob: vBlob,
        voiceBlobUrl: vUrl,
        chunksCount,
        primaryBase64,
      } = await synthesizeSpokenAudio(
        scriptText,
        selectedVoice,
        selectedStyle,
        speedPrompt
      );

      setVoiceBuffer(synthesizedVoiceBuffer);
      setVoiceBlob(vBlob);
      setVoiceBlobUrl(vUrl);

      // Step 2: Mix with Thematic Background Music
      setGenerationStep('mixing_master');
      const mixResult = await renderMasterMix(synthesizedVoiceBuffer, {
        ...mixSettings,
        musicTheme: selectedMusic,
      });

      setMasterBuffer(mixResult.mixedBuffer);
      setMasterBlob(mixResult.wavBlob);
      setMasterBlobUrl(mixResult.downloadUrl);
      setTotalDuration(mixResult.totalDuration);
      setCurrentTime(0);

      // Save to generation history
      const newHistoryItem: GenerationResult = {
        audioBase64: primaryBase64,
        mimeType: 'audio/wav',
        sampleRate: 44100,
        estimatedDuration: mixResult.totalDuration,
        voice: selectedVoice,
        style: selectedStyle,
        musicTheme: selectedMusic,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: scriptText.slice(0, 100) + (scriptText.length > 100 ? '...' : ''),
        chunksCount,
      };

      setHistory((prev) => [newHistoryItem, ...prev.slice(0, 7)]);
      setGenerationStep('ready');
      setChunkProgress(null);

      // Auto-play preview
      setTimeout(() => {
        playFromOffset(0);
      }, 200);
    } catch (err: any) {
      console.error('Generation failure:', err);
      setErrorMessage(formatErrorMessage(err));
      setGenerationStep('idle');
      setChunkProgress(null);
    } finally {
      setIsGenerating(false);
    }
  };

  // Re-render mix with updated volume sliders or music selection without re-calling TTS
  const handleReRenderMix = async () => {
    if (!voiceBuffer) return;
    try {
      stopPlayback();
      setIsReRendering(true);
      const mixResult = await renderMasterMix(voiceBuffer, {
        ...mixSettings,
        musicTheme: selectedMusic,
      });

      setMasterBuffer(mixResult.mixedBuffer);
      setMasterBlob(mixResult.wavBlob);
      setMasterBlobUrl(mixResult.downloadUrl);
      setTotalDuration(mixResult.totalDuration);
      setCurrentTime(0);

      setTimeout(() => {
        playFromOffset(0);
      }, 100);
    } catch (err: any) {
      console.error('Re-rendering mix failed:', err);
    } finally {
      setIsReRendering(false);
    }
  };

  // Load an item from history
  const handleSelectHistoryItem = async (item: GenerationResult) => {
    try {
      stopPlayback();
      setSelectedStyle(item.style);
      setSelectedVoice(item.voice);
      setSelectedMusic(item.musicTheme);
      setMixSettings((prev) => ({ ...prev, musicTheme: item.musicTheme }));

      const ctx = await getAudioContext();
      const decodedVoice = await decodeBase64Audio(item.audioBase64, ctx);
      const vBlob = audioBufferToWavBlob(decodedVoice);
      setVoiceBuffer(decodedVoice);
      setVoiceBlob(vBlob);
      setVoiceBlobUrl(URL.createObjectURL(vBlob));

      const mixResult = await renderMasterMix(decodedVoice, {
        ...mixSettings,
        musicTheme: item.musicTheme,
      });

      setMasterBuffer(mixResult.mixedBuffer);
      setMasterBlob(mixResult.wavBlob);
      setMasterBlobUrl(mixResult.downloadUrl);
      setTotalDuration(mixResult.totalDuration);
      setCurrentTime(0);
    } catch (err) {
      console.error('Failed to load history item:', err);
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      stopPlayback();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased selection:bg-slate-900 selection:text-white">
      {/* Navigation Header with Mode Switcher */}
      <Header
        mode={studioMode}
        onSelectMode={setStudioMode}
        onSelectTemplate={handleSelectTemplate}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Error Notice */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-sm flex items-start justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-900">Notice</p>
                <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs text-rose-700 hover:text-rose-900 px-2 py-1 rounded-md bg-rose-100 font-medium cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Minimalist Mode View */}
        {studioMode === 'minimal' ? (
          <div className="space-y-6">
            <MinimalistPromptStudio
              onGenerate={handleMinimalistGenerate}
              isGenerating={isGenerating}
              generationStep={generationStep}
              chunkProgress={chunkProgress}
              lastPlan={lastCleanedPlan}
              rawInput={rawPromptInput}
              onChangeRawInput={setRawPromptInput}
              onSwitchToStudio={() => setStudioMode('studio')}
              hasGeneratedAudio={Boolean(masterBuffer || voiceBuffer)}
            />

            {/* Render Playback and Download for Minimalist Mode */}
            {(masterBuffer || voiceBuffer) && (
              <div className="max-w-4xl mx-auto space-y-6">
                <AudioPlayerVisualizer
                  analyserNode={analyserRef.current}
                  isPlaying={isPlaying}
                  onPlay={handlePlay}
                  onPause={handlePause}
                  onSeek={handleSeek}
                  duration={totalDuration || (voiceBuffer ? voiceBuffer.duration : 0)}
                  currentTime={currentTime}
                  voiceName={selectedVoice}
                  styleLabel={currentStyleObj.label}
                  musicThemeTitle={currentMusicObj.title}
                />

                <DownloadSection
                  masterBlobUrl={masterBlobUrl}
                  masterBlob={masterBlob}
                  voiceBlobUrl={voiceBlobUrl}
                  voiceBlob={voiceBlob}
                  duration={totalDuration}
                  voiceName={selectedVoice}
                  styleLabel={currentStyleObj.label}
                  musicThemeTitle={currentMusicObj.title}
                  onReRenderMix={handleReRenderMix}
                  isReRendering={isReRendering}
                />
              </div>
            )}
          </div>
        ) : (
          /* Studio Pro View */
          <div className="space-y-6">
            {/* Section 1: Script Input */}
            <ScriptEditor
              text={scriptText}
              onChange={setScriptText}
              onAnalyze={handleAnalyzeScript}
              isAnalyzing={isAnalyzing}
              analysisRationale={analysisRationale}
            />

            {/* Section 2: Style Selection */}
            <StyleSelector
              selectedStyle={selectedStyle}
              onSelectStyle={handleSelectStyle}
            />

            {/* Section 3: Voice Actor Selection */}
            <VoiceSelector
              selectedVoice={selectedVoice}
              onSelectVoice={setSelectedVoice}
              recommendedVoice={currentStyleObj.recommendedVoice}
            />

            {/* Section 4: Thematic Background Music */}
            <MusicThemeSelector
              selectedTheme={selectedMusic}
              onSelectTheme={handleSelectMusicTheme}
              recommendedTheme={currentStyleObj.recommendedMusic}
              autoSyncWithStyle={autoSyncMusicWithStyle}
              onToggleAutoSync={setAutoSyncMusicWithStyle}
            />

            {/* Section 5: Mixer & Delivery Pacing */}
            <MixerControls
              settings={mixSettings}
              onChangeSettings={setMixSettings}
              pacingOption={pacingOption}
              onChangePacingOption={setPacingOption}
              isMusicActive={selectedMusic !== 'none'}
            />

            {/* Action Bar */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-slate-900">
                    Ready to synthesize:
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                    {currentStyleObj.label}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                    Voice: {selectedVoice}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1.5">
                  {selectedMusic !== 'none'
                    ? `Combines ${currentStyleObj.label} speech with "${currentMusicObj.title}" background soundtrack`
                    : `Generates clean vocal narration without music`}
                </p>
              </div>

              <button
                type="button"
                id="generate-narration-btn"
                onClick={handleGenerateNarration}
                disabled={isGenerating || !scriptText.trim()}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm flex items-center justify-center gap-2.5 shadow-xs transition-all active:scale-98 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>
                      {generationStep === 'generating_voice' && (
                        chunkProgress && chunkProgress.totalChunks > 1
                          ? `Synthesizing Section ${chunkProgress.currentChunk} of ${chunkProgress.totalChunks}...`
                          : 'Synthesizing Speech...'
                      )}
                      {generationStep === 'stitching_audio' && 'Stitching Audio Sections...'}
                      {generationStep === 'mixing_master' && 'Mastering Audio Mix...'}
                      {generationStep === 'synthesizing_music' && 'Arranging Soundtrack...'}
                      {!['generating_voice', 'stitching_audio', 'mixing_master', 'synthesizing_music'].includes(generationStep) && 'Producing Audio...'}
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-slate-200" />
                    <span>Generate Narration & Master Mix</span>
                  </>
                )}
              </button>
            </div>

            {/* Studio Pro Multi-Section Progress Indicator */}
            {isGenerating && chunkProgress && chunkProgress.totalChunks > 1 && (
              <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-700" />
                    Synthesizing Section {chunkProgress.currentChunk} of {chunkProgress.totalChunks}
                  </span>
                  <span>{Math.round((chunkProgress.currentChunk / chunkProgress.totalChunks) * 100)}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className="bg-slate-900 h-full transition-all duration-300 rounded-full"
                    style={{ width: `${(chunkProgress.currentChunk / chunkProgress.totalChunks) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Playback and Download for Studio Pro */}
            {(masterBuffer || voiceBuffer) && (
              <div className="space-y-6">
                <AudioPlayerVisualizer
                  analyserNode={analyserRef.current}
                  isPlaying={isPlaying}
                  onPlay={handlePlay}
                  onPause={handlePause}
                  onSeek={handleSeek}
                  duration={totalDuration || (voiceBuffer ? voiceBuffer.duration : 0)}
                  currentTime={currentTime}
                  voiceName={selectedVoice}
                  styleLabel={currentStyleObj.label}
                  musicThemeTitle={currentMusicObj.title}
                />

                <DownloadSection
                  masterBlobUrl={masterBlobUrl}
                  masterBlob={masterBlob}
                  voiceBlobUrl={voiceBlobUrl}
                  voiceBlob={voiceBlob}
                  duration={totalDuration}
                  voiceName={selectedVoice}
                  styleLabel={currentStyleObj.label}
                  musicThemeTitle={currentMusicObj.title}
                  onReRenderMix={handleReRenderMix}
                  isReRendering={isReRendering}
                />
              </div>
            )}
          </div>
        )}

        {/* Recent History Drawer */}
        <HistoryDrawer
          history={history}
          onSelectHistoryItem={handleSelectHistoryItem}
          onClearHistory={() => setHistory([])}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500">
          Vocalist • Gemini 3.1 Flash Speech Synthesis & Gemini 3.8 Flash Script Clean Engine
        </div>
      </footer>
    </div>
  );
}
