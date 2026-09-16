/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ChunkProgressInfo {
  currentChunk: number;
  totalChunks: number;
  snippet: string;
}

/**
 * Splits a long script into natural, coherent chunks suitable for Gemini TTS.
 * Gemini TTS (gemini-3.1-flash-tts-preview) natively supports up to 3-4 minutes of speech (~500-600 words) per call.
 * To respect the Free Tier rate limit of 3 requests per minute (3 RPM) and ensure instant delivery,
 * we pack natural sections (slides, paragraphs) into chunks of up to 550 words.
 * Only truly long-form documents (>550 words) are split into multiple chunks and stitched.
 */
export function splitScriptIntoChunks(text: string, maxWordsPerChunk = 550): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const allWords = trimmed.split(/\s+/);
  // If the total text is already under threshold, return as 1 chunk directly
  if (allWords.length <= maxWordsPerChunk) {
    return [trimmed];
  }

  // 1. Split into natural sections (by slide markers, chapters, or paragraphs)
  const slideRegex = /(?:^|\n)(?=(?:Slide\s+\d+|\[Slide\s+\d+\]|Chapter\s+\d+|Scene\s+\d+|Section\s+\d+|Part\s+\d+|---))/i;
  let rawSections = trimmed.split(slideRegex).map((s) => s.trim()).filter(Boolean);

  if (rawSections.length <= 1) {
    rawSections = trimmed.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
  }

  // 2. Pack sections together up to maxWordsPerChunk so we make the minimum necessary TTS requests
  const chunks: string[] = [];
  let currentAccumulated = '';

  for (const section of rawSections) {
    const sectionWords = section.split(/\s+/).length;

    // If a single section alone exceeds maxWordsPerChunk, split it by sentence
    if (sectionWords > maxWordsPerChunk) {
      if (currentAccumulated.trim()) {
        chunks.push(currentAccumulated.trim());
        currentAccumulated = '';
      }

      const sentences = section.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g) || [section];
      let sentenceChunk = '';

      for (const sent of sentences) {
        const sTrim = sent.trim();
        if (!sTrim) continue;
        const testWords = (sentenceChunk ? `${sentenceChunk} ${sTrim}` : sTrim).split(/\s+/).length;
        if (testWords > maxWordsPerChunk && sentenceChunk.trim()) {
          chunks.push(sentenceChunk.trim());
          sentenceChunk = sTrim;
        } else {
          sentenceChunk = sentenceChunk ? `${sentenceChunk} ${sTrim}` : sTrim;
        }
      }
      if (sentenceChunk.trim()) {
        chunks.push(sentenceChunk.trim());
      }
      continue;
    }

    // Check if adding this section to currentAccumulated exceeds maxWordsPerChunk
    const combinedCandidate = currentAccumulated ? `${currentAccumulated}\n\n${section}` : section;
    const candidateWords = combinedCandidate.split(/\s+/).length;

    if (candidateWords > maxWordsPerChunk && currentAccumulated.trim()) {
      chunks.push(currentAccumulated.trim());
      currentAccumulated = section;
    } else {
      currentAccumulated = combinedCandidate;
    }
  }

  if (currentAccumulated.trim()) {
    chunks.push(currentAccumulated.trim());
  }

  return chunks.filter((c) => c.trim().length > 0);
}

/**
 * Seamlessly stitches multiple AudioBuffers into a single unified AudioBuffer.
 * Adds a natural breath/pause interval between sections (default: 350ms)
 * and micro-fades (5ms) at junctions to prevent pops, clicks, or abrupt cuts.
 */
export function concatenateAudioBuffers(
  buffers: AudioBuffer[],
  audioCtx: AudioContext | BaseAudioContext,
  pauseSeconds = 0.35
): AudioBuffer {
  if (buffers.length === 0) {
    throw new Error('No audio buffers provided for stitching.');
  }
  if (buffers.length === 1) {
    return buffers[0];
  }

  const sampleRate = buffers[0].sampleRate;
  const numChannels = Math.max(...buffers.map((b) => b.numberOfChannels));
  const pauseSamples = Math.floor(pauseSeconds * sampleRate);

  // Calculate total length: sum of all buffer sample lengths + pauses between them
  const totalLength =
    buffers.reduce((acc, b) => acc + b.length, 0) + (buffers.length - 1) * pauseSamples;

  const resultBuffer = audioCtx.createBuffer(numChannels, totalLength, sampleRate);

  // 5ms micro-fade window to eliminate acoustic boundary artifacts
  const microFadeSamples = Math.min(Math.floor(0.005 * sampleRate), 250);

  for (let c = 0; c < numChannels; c++) {
    const channelData = resultBuffer.getChannelData(c);
    let writeOffset = 0;

    for (let bIndex = 0; bIndex < buffers.length; bIndex++) {
      const srcBuffer = buffers[bIndex];
      // If source buffer has fewer channels, duplicate channel 0 (mono -> stereo expansion)
      const srcChannel = Math.min(c, srcBuffer.numberOfChannels - 1);
      const srcData = srcBuffer.getChannelData(srcChannel);

      // Copy samples with micro-fades at boundaries
      for (let s = 0; s < srcData.length; s++) {
        let sample = srcData[s];

        // Fade-in during first 5ms (except for very start of overall audio)
        if (s < microFadeSamples && bIndex > 0) {
          sample *= s / microFadeSamples;
        }

        // Fade-out during last 5ms (except for very end of overall audio)
        if (s > srcData.length - microFadeSamples && bIndex < buffers.length - 1) {
          sample *= (srcData.length - s) / microFadeSamples;
        }

        channelData[writeOffset + s] = sample;
      }

      writeOffset += srcData.length;

      // Add silence gap between sections (already zeroes in Float32Array)
      if (bIndex < buffers.length - 1) {
        writeOffset += pauseSamples;
      }
    }
  }

  return resultBuffer;
}
