import { MusicThemeId } from '../types';

// Musical note frequency mapping (Hz)
const NOTE_FREQS: Record<string, number> = {
  C2: 65.41, D2: 73.42, E2: 82.41, F2: 87.31, G2: 98.00, A2: 110.00, B2: 123.47,
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, Bb3: 233.08, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, Bb4: 466.16, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, Bb5: 932.33, B5: 987.77,
  C6: 1046.50, D6: 1174.66, E6: 1318.51
};

/**
 * Creates a piano/chime note in an OfflineAudioContext
 */
function schedulePianoNote(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  freq: number,
  time: number,
  duration: number,
  velocity = 0.5
) {
  if (freq <= 0 || time >= ctx.length / ctx.sampleRate) return;

  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc1.type = 'triangle';
  osc1.frequency.setValueAtTime(freq, time);

  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(freq * 2, time);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(freq * 4, time);
  filter.frequency.exponentialRampToValueAtTime(Math.max(freq, 200), time + duration);

  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.linearRampToValueAtTime(velocity * 0.4, time + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(dest);

  osc1.start(time);
  osc2.start(time);
  osc1.stop(time + duration + 0.05);
  osc2.stop(time + duration + 0.05);
}

/**
 * Creates a warm pad chord note
 */
function schedulePadNote(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  freq: number,
  time: number,
  duration: number,
  velocity = 0.25
) {
  if (freq <= 0 || time >= ctx.length / ctx.sampleRate) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(freq, time);

  // Subtle detune for chorused warmth
  osc.detune.setValueAtTime((Math.random() - 0.5) * 12, time);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(500, time);
  filter.Q.value = 1.2;

  // Swell envelope
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.linearRampToValueAtTime(velocity * 0.18, time + Math.min(1.2, duration * 0.4));
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(dest);

  osc.start(time);
  osc.stop(time + duration + 0.1);
}

/**
 * Creates a punchy sub/synth bass note
 */
function scheduleBassNote(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  freq: number,
  time: number,
  duration: number,
  velocity = 0.4
) {
  if (freq <= 0 || time >= ctx.length / ctx.sampleRate) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, time);

  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.linearRampToValueAtTime(velocity * 0.5, time + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

  osc.connect(gain);
  gain.connect(dest);

  osc.start(time);
  osc.stop(time + duration + 0.05);
}

/**
 * Creates a modern synth pluck note (e.g. for Product Launch / Future)
 */
function schedulePluckNote(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  freq: number,
  time: number,
  duration: number,
  velocity = 0.3
) {
  if (freq <= 0 || time >= ctx.length / ctx.sampleRate) return;

  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(freq, time);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(freq * 6, time);
  filter.frequency.exponentialRampToValueAtTime(freq * 1.5, time + duration);

  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.linearRampToValueAtTime(velocity * 0.35, time + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(dest);

  osc.start(time);
  osc.stop(time + duration + 0.05);
}

/**
 * Generates an acoustic pulse / light beat
 */
function schedulePulse(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  time: number,
  type: 'kick' | 'click' | 'shaker',
  velocity = 0.3
) {
  if (time >= ctx.length / ctx.sampleRate) return;

  if (type === 'kick') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(110, time);
    osc.frequency.exponentialRampToValueAtTime(35, time + 0.12);
    gain.gain.setValueAtTime(velocity * 0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.14);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(time);
    osc.stop(time + 0.15);
  } else if (type === 'click' || type === 'shaker') {
    const node = ctx.createBufferSource();
    const bufferSize = ctx.sampleRate * 0.03;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
    }
    node.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = type === 'click' ? 'bandpass' : 'highpass';
    filter.frequency.value = type === 'click' ? 1800 : 5000;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(velocity * 0.15, time);
    node.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    node.start(time);
  }
}

/**
 * Synthesizes a thematic musical track of a specified duration into an AudioBuffer.
 */
export async function synthesizeThematicMusic(
  theme: MusicThemeId,
  durationSeconds: number,
  sampleRate = 44100
): Promise<AudioBuffer> {
  // Ensure minimum duration
  const duration = Math.max(durationSeconds, 4);
  const length = Math.ceil(duration * sampleRate);
  const offlineCtx = new OfflineAudioContext(2, length, sampleRate);

  // Master bus with limiter/compressor
  const compressor = offlineCtx.createDynamicsCompressor();
  compressor.threshold.setValueAtTime(-12, 0);
  compressor.knee.setValueAtTime(24, 0);
  compressor.ratio.setValueAtTime(4, 0);
  compressor.attack.setValueAtTime(0.003, 0);
  compressor.release.setValueAtTime(0.25, 0);

  const masterGain = offlineCtx.createGain();
  masterGain.gain.setValueAtTime(0.85, 0);

  // Smooth fade-in at start (0.6s) and fade-out at end (1.5s)
  masterGain.gain.setValueAtTime(0.0001, 0);
  masterGain.gain.linearRampToValueAtTime(0.85, 0.6);
  masterGain.gain.setValueAtTime(0.85, Math.max(0, duration - 1.8));
  masterGain.gain.exponentialRampToValueAtTime(0.0001, duration);

  compressor.connect(masterGain);
  masterGain.connect(offlineCtx.destination);

  if (theme === 'none') {
    return await offlineCtx.startRendering();
  }

  // Build the track based on theme
  if (theme === 'corporate') {
    // Executive Horizon: C -> G -> Am -> F (96 BPM)
    const bpm = 96;
    const beatSec = 60 / bpm;
    const barSec = beatSec * 4;
    const chordProgression = [
      { bass: NOTE_FREQS.C2, chord: [NOTE_FREQS.C4, NOTE_FREQS.E4, NOTE_FREQS.G4, NOTE_FREQS.B4] },
      { bass: NOTE_FREQS.G2, chord: [NOTE_FREQS.B3, NOTE_FREQS.D4, NOTE_FREQS.G4, NOTE_FREQS.D5] },
      { bass: NOTE_FREQS.A2, chord: [NOTE_FREQS.A3, NOTE_FREQS.C4, NOTE_FREQS.E4, NOTE_FREQS.G4] },
      { bass: NOTE_FREQS.F2, chord: [NOTE_FREQS.F3, NOTE_FREQS.A3, NOTE_FREQS.C4, NOTE_FREQS.E4] }
    ];

    let t = 0.2;
    while (t < duration) {
      const chordIndex = Math.floor(t / barSec) % chordProgression.length;
      const current = chordProgression[chordIndex];

      // Bass note
      scheduleBassNote(offlineCtx, compressor, current.bass, t, barSec * 0.9, 0.45);

      // Pad chord
      for (const f of current.chord) {
        schedulePadNote(offlineCtx, compressor, f, t, barSec * 0.95, 0.2);
      }

      // Minimalist piano arpeggio
      for (let beat = 0; beat < 4; beat++) {
        const beatTime = t + beat * beatSec;
        const noteIndex = beat % current.chord.length;
        schedulePianoNote(offlineCtx, compressor, current.chord[noteIndex], beatTime, beatSec * 1.5, 0.35);

        if (beat === 0 || beat === 2) {
          schedulePulse(offlineCtx, compressor, beatTime, 'kick', 0.2);
        }
        schedulePulse(offlineCtx, compressor, beatTime + beatSec * 0.5, 'shaker', 0.12);
      }

      t += barSec;
    }
  } else if (theme === 'product_launch') {
    // Future Velocity: Dm -> Bb -> F -> C (122 BPM)
    const bpm = 122;
    const beatSec = 60 / bpm;
    const barSec = beatSec * 4;
    const progression = [
      { bass: NOTE_FREQS.D2, notes: [NOTE_FREQS.D4, NOTE_FREQS.F4, NOTE_FREQS.A4, NOTE_FREQS.D5] },
      { bass: NOTE_FREQS.Bb3, notes: [NOTE_FREQS.D4, NOTE_FREQS.F4, NOTE_FREQS.Bb4, NOTE_FREQS.D5] },
      { bass: NOTE_FREQS.F2, notes: [NOTE_FREQS.C4, NOTE_FREQS.F4, NOTE_FREQS.A4, NOTE_FREQS.C5] },
      { bass: NOTE_FREQS.C3, notes: [NOTE_FREQS.C4, NOTE_FREQS.E4, NOTE_FREQS.G4, NOTE_FREQS.C5] }
    ];

    let t = 0.1;
    while (t < duration) {
      const idx = Math.floor(t / barSec) % progression.length;
      const cur = progression[idx];

      scheduleBassNote(offlineCtx, compressor, cur.bass, t, barSec * 0.85, 0.5);

      for (let i = 0; i < 8; i++) {
        const noteTime = t + i * (beatSec / 2);
        const pitch = cur.notes[i % cur.notes.length];
        schedulePluckNote(offlineCtx, compressor, pitch, noteTime, 0.35, 0.3);

        if (i % 2 === 0) {
          schedulePulse(offlineCtx, compressor, noteTime, 'kick', 0.28);
        } else {
          schedulePulse(offlineCtx, compressor, noteTime, 'click', 0.22);
        }
      }

      for (const n of cur.notes) {
        schedulePadNote(offlineCtx, compressor, n * 0.5, t, barSec * 0.95, 0.18);
      }

      t += barSec;
    }
  } else if (theme === 'fun') {
    // Sunny Bounce: G -> C -> Em -> D (112 BPM)
    const bpm = 112;
    const beatSec = 60 / bpm;
    const barSec = beatSec * 4;
    const chords = [
      { bass: NOTE_FREQS.G2, notes: [NOTE_FREQS.G4, NOTE_FREQS.B4, NOTE_FREQS.D5, NOTE_FREQS.G5] },
      { bass: NOTE_FREQS.C3, notes: [NOTE_FREQS.G4, NOTE_FREQS.C5, NOTE_FREQS.E5, NOTE_FREQS.G5] },
      { bass: NOTE_FREQS.E2, notes: [NOTE_FREQS.G4, NOTE_FREQS.B4, NOTE_FREQS.E5, NOTE_FREQS.B5] },
      { bass: NOTE_FREQS.D3, notes: [NOTE_FREQS.F4, NOTE_FREQS.A4, NOTE_FREQS.D5, NOTE_FREQS.F5] }
    ];

    let t = 0.15;
    while (t < duration) {
      const idx = Math.floor(t / barSec) % chords.length;
      const cur = chords[idx];

      scheduleBassNote(offlineCtx, compressor, cur.bass, t, beatSec * 1.5, 0.4);
      scheduleBassNote(offlineCtx, compressor, cur.bass * 1.5, t + beatSec * 2, beatSec * 1.2, 0.35);

      // Acoustic style strum and marimba notes
      for (let b = 0; b < 4; b++) {
        const beatTime = t + b * beatSec;
        for (let s = 0; s < 3; s++) {
          schedulePluckNote(offlineCtx, compressor, cur.notes[s], beatTime + s * 0.03, 0.3, 0.25);
        }
        if (b === 1 || b === 3) {
          schedulePulse(offlineCtx, compressor, beatTime, 'click', 0.3);
        }
      }

      t += barSec;
    }
  } else if (theme === 'creative') {
    // Curious Sparks: Emaj7 -> C#m7 -> Aadd9 -> B7sus4 (98 BPM)
    const bpm = 98;
    const beatSec = 60 / bpm;
    const barSec = beatSec * 4;
    const chords = [
      { bass: NOTE_FREQS.E2, notes: [NOTE_FREQS.E4, NOTE_FREQS.G4, NOTE_FREQS.B4, NOTE_FREQS.D5] },
      { bass: NOTE_FREQS.C3, notes: [NOTE_FREQS.E4, NOTE_FREQS.G4, NOTE_FREQS.B4, NOTE_FREQS.E5] },
      { bass: NOTE_FREQS.A2, notes: [NOTE_FREQS.E4, NOTE_FREQS.A4, NOTE_FREQS.B4, NOTE_FREQS.E5] },
      { bass: NOTE_FREQS.B2, notes: [NOTE_FREQS.F4, NOTE_FREQS.A4, NOTE_FREQS.B4, NOTE_FREQS.E5] }
    ];

    let t = 0.2;
    while (t < duration) {
      const idx = Math.floor(t / barSec) % chords.length;
      const cur = chords[idx];

      schedulePadNote(offlineCtx, compressor, cur.bass * 2, t, barSec, 0.25);
      for (const n of cur.notes) {
        schedulePianoNote(offlineCtx, compressor, n, t + Math.random() * 0.05, barSec * 0.8, 0.3);
      }

      // Gentle vibraphone bells
      schedulePianoNote(offlineCtx, compressor, cur.notes[2] * 2, t + beatSec * 1.5, beatSec * 2, 0.3);
      schedulePianoNote(offlineCtx, compressor, cur.notes[0] * 2, t + beatSec * 3, beatSec * 1.5, 0.25);

      t += barSec;
    }
  } else if (theme === 'storytelling') {
    // Fireside Strings: Dm -> Bb -> Gm -> A7 (74 BPM)
    const bpm = 74;
    const beatSec = 60 / bpm;
    const barSec = beatSec * 4;
    const chords = [
      { bass: NOTE_FREQS.D2, notes: [NOTE_FREQS.D3, NOTE_FREQS.F3, NOTE_FREQS.A3, NOTE_FREQS.D4] },
      { bass: NOTE_FREQS.Bb3, notes: [NOTE_FREQS.D3, NOTE_FREQS.F3, NOTE_FREQS.Bb3, NOTE_FREQS.D4] },
      { bass: NOTE_FREQS.G2, notes: [NOTE_FREQS.D3, NOTE_FREQS.G3, NOTE_FREQS.Bb3, NOTE_FREQS.D4] },
      { bass: NOTE_FREQS.A2, notes: [NOTE_FREQS.C4, NOTE_FREQS.E4, NOTE_FREQS.G4, NOTE_FREQS.A4] }
    ];

    let t = 0.3;
    while (t < duration) {
      const idx = Math.floor(t / barSec) % chords.length;
      const cur = chords[idx];

      // Deep cello swell
      scheduleBassNote(offlineCtx, compressor, cur.bass, t, barSec * 0.95, 0.5);

      // Warm orchestral pad swell
      for (const n of cur.notes) {
        schedulePadNote(offlineCtx, compressor, n, t, barSec * 0.98, 0.28);
      }

      // Emotional piano droplets
      schedulePianoNote(offlineCtx, compressor, cur.notes[2] * 2, t + beatSec * 1, beatSec * 3, 0.35);
      schedulePianoNote(offlineCtx, compressor, cur.notes[1] * 2, t + beatSec * 2.5, beatSec * 2, 0.3);

      t += barSec;
    }
  } else if (theme === 'calm') {
    // Zen Breath: Csus2 -> Fsus2 -> Gsus4 -> Am7 (60 BPM)
    const barSec = 5.0; // Slow 5-second breath cycles
    const chords = [
      { bass: NOTE_FREQS.C2, notes: [NOTE_FREQS.C4, NOTE_FREQS.D4, NOTE_FREQS.G4, NOTE_FREQS.C5] },
      { bass: NOTE_FREQS.F2, notes: [NOTE_FREQS.C4, NOTE_FREQS.F4, NOTE_FREQS.G4, NOTE_FREQS.C5] },
      { bass: NOTE_FREQS.G2, notes: [NOTE_FREQS.D4, NOTE_FREQS.G4, NOTE_FREQS.C5, NOTE_FREQS.D5] },
      { bass: NOTE_FREQS.A2, notes: [NOTE_FREQS.C4, NOTE_FREQS.E4, NOTE_FREQS.G4, NOTE_FREQS.A4] }
    ];

    let t = 0.4;
    while (t < duration) {
      const idx = Math.floor(t / barSec) % chords.length;
      const cur = chords[idx];

      // Deep meditation drone
      scheduleBassNote(offlineCtx, compressor, cur.bass, t, barSec, 0.35);

      // Singing bowl / gentle pads
      for (const n of cur.notes) {
        schedulePadNote(offlineCtx, compressor, n, t, barSec * 1.05, 0.22);
      }

      // Crystal harmonic chime
      schedulePianoNote(offlineCtx, compressor, cur.notes[0] * 2, t + 0.5, 4.0, 0.2);

      t += barSec;
    }
  }

  return await offlineCtx.startRendering();
}
