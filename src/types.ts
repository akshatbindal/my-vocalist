export type VoiceStyle =
  | 'corporate'
  | 'product_launch'
  | 'fun'
  | 'creative'
  | 'storytelling'
  | 'calm'
  | 'news';

export type GeminiVoiceName = 'Kore' | 'Puck' | 'Fenrir' | 'Zephyr' | 'Charon';

export type MusicThemeId =
  | 'none'
  | 'corporate'
  | 'product_launch'
  | 'fun'
  | 'creative'
  | 'storytelling'
  | 'calm';

export interface StyleOption {
  id: VoiceStyle;
  label: string;
  category: string;
  description: string;
  recommendedVoice: GeminiVoiceName;
  recommendedMusic: MusicThemeId;
  badgeColor: string;
  iconName: string;
  promptDirective: string;
}

export interface VoiceOption {
  id: GeminiVoiceName;
  name: string;
  gender: 'Female / Neutral' | 'Male / Neutral' | 'Dynamic';
  character: string;
  bestFor: string;
}

export interface MusicThemeOption {
  id: MusicThemeId;
  title: string;
  subtitle: string;
  bpm: number;
  mood: string;
  instruments: string[];
}

export interface GenerationResult {
  audioBase64: string;
  mimeType: string;
  sampleRate: number;
  estimatedDuration: number;
  voice: GeminiVoiceName;
  style: VoiceStyle;
  musicTheme: MusicThemeId;
  createdAt: string;
  text: string;
  chunksCount?: number;
}

export interface AudioMixSettings {
  voiceVolume: number; // 0 to 1.5
  musicVolume: number; // 0 to 0.5
  ducking: boolean; // lower music during voice
  musicTheme: MusicThemeId;
}

export type StudioMode = 'minimal' | 'studio';

export interface CleanedScriptPlan {
  polishedScript: string;
  detectedTitle: string;
  style: VoiceStyle;
  recommendedVoice: GeminiVoiceName;
  musicTheme: MusicThemeId;
  rationale: string;
  cleaningNotes: string[];
  chunksCount?: number;
}

