import { MusicThemeId, AudioMixSettings } from '../types';
import { synthesizeThematicMusic } from './musicSynthesizer';
export { splitScriptIntoChunks, concatenateAudioBuffers } from './scriptChunker';
export type { ChunkProgressInfo } from './scriptChunker';

/**
 * Converts an AudioBuffer to a standard 16-bit PCM WAV Blob
 */
export function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const numSamples = buffer.length;
  const dataByteLength = numSamples * blockAlign;
  const arrayBuffer = new ArrayBuffer(44 + dataByteLength);
  const view = new DataView(arrayBuffer);

  function writeString(offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  // RIFF chunk descriptor
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataByteLength, true);
  writeString(8, 'WAVE');

  // fmt sub-chunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true); // ByteRate
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  // data sub-chunk
  writeString(36, 'data');
  view.setUint32(40, dataByteLength, true);

  // Interleave channels & write 16-bit samples
  const channels: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    channels.push(buffer.getChannelData(c));
  }

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    for (let c = 0; c < numChannels; c++) {
      const sample = Math.max(-1, Math.min(1, channels[c][i]));
      // Convert float to 16-bit signed integer (-32768 to 32767)
      const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, int16, true);
      offset += 2;
    }
  }

  return new Blob([view], { type: 'audio/wav' });
}

/**
 * Decodes a base64 audio string into an AudioBuffer using the browser AudioContext
 */
export async function decodeBase64Audio(
  base64Data: string,
  audioCtx: AudioContext
): Promise<AudioBuffer> {
  const binaryString = atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Use slice to get a fresh copy of the ArrayBuffer for decodeAudioData
  const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  return await audioCtx.decodeAudioData(arrayBuffer);
}

export interface MasterMixResult {
  mixedBuffer: AudioBuffer;
  wavBlob: Blob;
  downloadUrl: string;
  totalDuration: number;
}

/**
 * Combines voice AudioBuffer with thematic background music into a single polished master track
 */
export async function renderMasterMix(
  voiceBuffer: AudioBuffer,
  settings: AudioMixSettings
): Promise<MasterMixResult> {
  const sampleRate = 44100;
  const voiceDuration = voiceBuffer.duration;
  const preRoll = 0.35; // 350ms of music atmosphere before voice starts
  const postRoll = 1.8; // 1.8s gentle musical fade-out after speech concludes
  const totalDuration = settings.musicTheme === 'none' ? voiceDuration : voiceDuration + preRoll + postRoll;

  const totalLength = Math.ceil(totalDuration * sampleRate);
  const offlineCtx = new OfflineAudioContext(2, totalLength, sampleRate);

  // Master compressor to prevent clipping and deliver broadcast polish
  const limiter = offlineCtx.createDynamicsCompressor();
  limiter.threshold.setValueAtTime(-3, 0);
  limiter.knee.setValueAtTime(10, 0);
  limiter.ratio.setValueAtTime(8, 0);
  limiter.attack.setValueAtTime(0.002, 0);
  limiter.release.setValueAtTime(0.15, 0);
  limiter.connect(offlineCtx.destination);

  // 1. Voice Track
  const voiceSource = offlineCtx.createBufferSource();
  voiceSource.buffer = voiceBuffer;

  const voiceGain = offlineCtx.createGain();
  const targetVoiceVolume = Math.min(1.5, Math.max(0, settings.voiceVolume));
  voiceGain.gain.setValueAtTime(targetVoiceVolume, 0);

  voiceSource.connect(voiceGain);
  voiceGain.connect(limiter);

  // Voice starts at preRoll when music is enabled, or at 0 when no music
  const voiceStartTime = settings.musicTheme === 'none' ? 0 : preRoll;
  voiceSource.start(voiceStartTime);

  // 2. Music Track (if selected)
  if (settings.musicTheme !== 'none' && settings.musicVolume > 0) {
    const musicBuffer = await synthesizeThematicMusic(settings.musicTheme, totalDuration, sampleRate);
    const musicSource = offlineCtx.createBufferSource();
    musicSource.buffer = musicBuffer;

    const musicGain = offlineCtx.createGain();
    const baseMusicVol = Math.min(0.8, Math.max(0, settings.musicVolume));

    // Ducking logic: lower music slightly while voice is active so vocals remain crisp
    if (settings.ducking) {
      const duckedVol = baseMusicVol * 0.7; // -3dB to -4dB attenuation
      musicGain.gain.setValueAtTime(baseMusicVol, 0);
      musicGain.gain.linearRampToValueAtTime(duckedVol, voiceStartTime + 0.1);
      musicGain.gain.setValueAtTime(duckedVol, voiceStartTime + voiceDuration - 0.1);
      musicGain.gain.linearRampToValueAtTime(baseMusicVol, voiceStartTime + voiceDuration + 0.3);
      // Final fade out
      musicGain.gain.setValueAtTime(baseMusicVol, Math.max(0, totalDuration - 1.5));
      musicGain.gain.exponentialRampToValueAtTime(0.0001, totalDuration);
    } else {
      musicGain.gain.setValueAtTime(baseMusicVol, 0);
      musicGain.gain.setValueAtTime(baseMusicVol, Math.max(0, totalDuration - 1.5));
      musicGain.gain.exponentialRampToValueAtTime(0.0001, totalDuration);
    }

    musicSource.connect(musicGain);
    musicGain.connect(limiter);
    musicSource.start(0);
  }

  const mixedBuffer = await offlineCtx.startRendering();
  const wavBlob = audioBufferToWavBlob(mixedBuffer);
  const downloadUrl = URL.createObjectURL(wavBlob);

  return {
    mixedBuffer,
    wavBlob,
    downloadUrl,
    totalDuration
  };
}
