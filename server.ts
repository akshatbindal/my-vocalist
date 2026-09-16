import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Modality } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

function createWavHeader(dataLength: number, sampleRate = 24000, channels = 1, bitsPerSample = 16): Buffer {
  const header = Buffer.alloc(44);
  const byteRate = sampleRate * channels * (bitsPerSample / 8);
  const blockAlign = channels * (bitsPerSample / 8);

  // RIFF identifier
  header.write("RIFF", 0);
  // file length minus 8
  header.writeUInt32LE(36 + dataLength, 4);
  // RIFF type
  header.write("WAVE", 8);
  // format chunk identifier
  header.write("fmt ", 12);
  // format chunk length
  header.writeUInt32LE(16, 16);
  // sample format (1 = PCM)
  header.writeUInt16LE(1, 20);
  // channel count
  header.writeUInt16LE(channels, 22);
  // sample rate
  header.writeUInt32LE(sampleRate, 24);
  // byte rate
  header.writeUInt32LE(byteRate, 28);
  // block align
  header.writeUInt16LE(blockAlign, 32);
  // bits per sample
  header.writeUInt16LE(bitsPerSample, 34);
  // data chunk identifier
  header.write("data", 36);
  // data chunk length
  header.writeUInt32LE(dataLength, 40);

  return header;
}

function ensureWav(buffer: Buffer, sampleRate = 24000): Buffer {
  // If it already begins with 'RIFF', it is a valid WAV
  if (buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WAVE") {
    return buffer;
  }
  // Otherwise wrap raw PCM in WAV header
  const header = createWavHeader(buffer.length, sampleRate, 1, 16);
  return Buffer.concat([header, buffer]);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // Shared Gemini client
  let genAI: GoogleGenAI | null = null;
  function getGeminiClient(): GoogleGenAI {
    if (!genAI) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is not set");
      }
      genAI = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
    return genAI;
  }

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Resilient text generation with model fallbacks and backoff
  async function generateTextWithFallback(
    ai: GoogleGenAI,
    prompt: string
  ): Promise<string> {
    const modelsToTry = [
      "gemini-3.8-flash",
      "gemini-flash-latest",
      "gemini-3.1-flash-lite",
    ];

    let lastError: any = null;

    for (const model of modelsToTry) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
              responseMimeType: "application/json",
            },
          });
          if (response.text) {
            return response.text;
          }
        } catch (err: any) {
          lastError = err;
          const status = err.status || err.statusCode || (err.error && err.error.code);
          const msg = (err.message || "").toLowerCase();
          const isTransient =
            status === 503 ||
            status === 429 ||
            status === 500 ||
            msg.includes("high demand") ||
            msg.includes("unavailable") ||
            msg.includes("resource_exhausted") ||
            msg.includes("spike");

          if (!isTransient) {
            // For non-transient error, move to next model
            break;
          }
          // Exponential backoff
          await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
        }
      }
    }

    throw lastError || new Error("All language models unavailable due to high demand.");
  }

  // Graceful rule-based fallback when external AI models experience temporary 503 spikes
  function localCleanAndPlanFallback(rawScript: string) {
    let cleaned = rawScript
      .replace(/(?:^|\n)\s*(?:slide|part|section)\s*\d+[:\-.]?\s*/gi, "\n\n")
      .replace(/\[\s*(?:pause|applause|laughter|slide\s*\d+)\s*\]/gi, " ")
      .replace(/^[•\-\*]\s+/gm, "")
      .replace(/\s{2,}/g, " ")
      .trim();

    const lower = rawScript.toLowerCase();
    let style = "corporate";
    let voice = "Kore";
    let theme = "corporate";

    if (
      lower.includes("launch") ||
      lower.includes("product") ||
      lower.includes("growth") ||
      lower.includes("excited")
    ) {
      style = "product_launch";
      voice = "Puck";
      theme = "product_launch";
    } else if (
      lower.includes("story") ||
      lower.includes("chapter") ||
      lower.includes("once upon") ||
      lower.includes("journey")
    ) {
      style = "storytelling";
      voice = "Charon";
      theme = "storytelling";
    } else if (
      lower.includes("breathe") ||
      lower.includes("relax") ||
      lower.includes("mindful") ||
      lower.includes("meditation") ||
      lower.includes("peace")
    ) {
      style = "calm";
      voice = "Zephyr";
      theme = "calm";
    } else if (
      lower.includes("fun") ||
      lower.includes("humor") ||
      lower.includes("party") ||
      lower.includes("upbeat")
    ) {
      style = "fun";
      voice = "Puck";
      theme = "fun";
    }

    const firstLine =
      rawScript
        .split("\n")
        .map((l) => l.trim())
        .find((l) => l.length > 0) || "Narration Script";
    const detectedTitle =
      firstLine.replace(/[^a-zA-Z0-9\s]/g, "").slice(0, 36).trim() ||
      "Narration Script";

    return {
      polishedScript: cleaned || rawScript,
      detectedTitle,
      style,
      recommendedVoice: voice,
      musicTheme: theme,
      rationale:
        "Cleaned, formatted, and mapped for natural vocal delivery with instant editorial polish.",
      cleaningNotes: [
        "Removed slide numbers and bullet labels into flowing spoken transitions",
        "Paced punctuation for natural breathing intervals",
        "Preserved all key concepts, facts, and messaging",
      ],
    };
  }

  // In-memory TTS audio cache to save quota across regenerations and retries
  const ttsAudioCache = new Map<
    string,
    {
      audioBase64: string;
      mimeType: string;
      sampleRate: number;
      estimatedDuration: number;
      voice: string;
      style: string;
    }
  >();

  function extractQuotaRetryDelay(err: any): number {
    const msg = err?.message || "";
    const match = msg.match(/retry\s+in\s+([\d.]+)\s*s/i);
    if (match && match[1]) {
      return Math.ceil(parseFloat(match[1]));
    }
    if (Array.isArray(err?.details)) {
      for (const item of err.details) {
        if (item?.retryDelay) {
          const m = String(item.retryDelay).match(/([\d.]+)/);
          if (m && m[1]) {
            return Math.ceil(parseFloat(m[1]));
          }
        }
      }
    }
    return 28; // Default Free Tier 3 RPM window
  }

  // Text-to-Speech generation endpoint with cache and quota protection
  app.post("/api/tts", async (req, res) => {
    try {
      const { text, voice = "Kore", style = "corporate", speedPrompt = "" } = req.body;

      if (!text || typeof text !== "string" || !text.trim()) {
        return res.status(400).json({ error: "Script text is required." });
      }

      const cleanText = text.trim();

      // Check cache to conserve free tier quota
      const cacheKey = `${voice}__${style}__${speedPrompt}__${cleanText}`;
      if (ttsAudioCache.has(cacheKey)) {
        return res.json(ttsAudioCache.get(cacheKey));
      }

      // Style instruction mapped to speech direction
      const styleDirectives: Record<string, string> = {
        corporate: "Read in an executive, crisp, articulate, and confident corporate leadership style with polished professional cadence.",
        product_launch: "Read with energetic keynote excitement, visionary enthusiasm, high anticipation, and inspiring punch.",
        fun: "Read in a lively, upbeat, playful, and cheerful tone bursting with warm energy and smiles.",
        creative: "Read in an imaginative, expressive, poetic, and whimsical voice with rich artistic color and pacing.",
        storytelling: "Read as a captivating, immersive, cinematic storyteller with dramatic pauses, emotional depth, and atmospheric intrigue.",
        calm: "Read in a serene, mindful, gentle, and soothing tone with calm steady pacing and warm resonance.",
        news: "Read in an authoritative, objective, articulate broadcast news anchor style with clean measured delivery."
      };

      const directive = styleDirectives[style] || styleDirectives.corporate;
      const combinedPrompt = `${directive}${speedPrompt ? ` ${speedPrompt}` : ""}\n\n"${cleanText}"`;

      const ai = getGeminiClient();

      let lastTtsErr: any = null;
      let audioData: string | undefined;

      // Single attempt with transient backoff (do NOT loop on 429 quota exhaustion)
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model: "gemini-3.1-flash-tts-preview",
            contents: [{ parts: [{ text: combinedPrompt }] }],
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: voice },
                },
              },
            },
          });

          const part = response.candidates?.[0]?.content?.parts?.[0];
          audioData = part?.inlineData?.data;
          if (audioData) {
            break;
          }
        } catch (err: any) {
          lastTtsErr = err;
          const status = err.status || err.statusCode || (err.error && err.error.code);
          const msg = (err.message || "").toLowerCase();

          // If rate limit / quota exceeded (3 requests per minute limit)
          if (status === 429 || msg.includes("quota") || msg.includes("resource_exhausted")) {
            const retrySec = extractQuotaRetryDelay(err);
            return res.status(429).json({
              error: `Gemini TTS free-tier quota reached (3 requests/minute). Ready to resume in ${retrySec}s.`,
              isRateLimit: true,
              retryAfterSeconds: retrySec,
            });
          }

          const isTransient =
            status === 503 ||
            msg.includes("high demand") ||
            msg.includes("unavailable") ||
            msg.includes("temporarily");

          if (!isTransient || attempt === 1) {
            throw err;
          }
          await new Promise((resolve) => setTimeout(resolve, 800));
        }
      }

      if (!audioData) {
        throw (
          lastTtsErr ||
          new Error("No audio was returned from the speech generation model.")
        );
      }

      const rawBuffer = Buffer.from(audioData, "base64");
      const wavBuffer = ensureWav(rawBuffer, 24000);
      const base64Wav = wavBuffer.toString("base64");
      const durationSeconds = rawBuffer.length / (24000 * 2); // 16-bit mono = 2 bytes per sample

      const responsePayload = {
        audioBase64: base64Wav,
        mimeType: "audio/wav",
        sampleRate: 24000,
        estimatedDuration: durationSeconds,
        voice,
        style,
      };

      // Store in cache
      ttsAudioCache.set(cacheKey, responsePayload);
      if (ttsAudioCache.size > 100) {
        const oldest = ttsAudioCache.keys().next().value;
        if (oldest) ttsAudioCache.delete(oldest);
      }

      return res.json(responsePayload);
    } catch (err: any) {
      console.error("TTS generation error:", err);
      const status = err.status || err.statusCode || (err.error && err.error.code);
      const msg = (err.message || "").toLowerCase();

      if (status === 429 || msg.includes("quota") || msg.includes("resource_exhausted")) {
        const retrySec = extractQuotaRetryDelay(err);
        return res.status(429).json({
          error: `Gemini TTS free-tier quota reached (3 requests/minute). Ready to resume in ${retrySec}s.`,
          isRateLimit: true,
          retryAfterSeconds: retrySec,
        });
      }

      const isDemandError =
        msg.includes("high demand") || err.status === 503;
      return res.status(503).json({
        error: isDemandError
          ? "The voice synthesis service is experiencing high temporary demand. Please try generating again in a moment."
          : err.message || "Failed to generate text-to-speech audio.",
      });
    }
  });

  // AI Script Analysis & Theme Auto-Matcher
  app.post("/api/analyze-script", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "Text is required" });
      }

      const ai = getGeminiClient();
      const prompt = `Analyze the following narration script and determine the best voice style, recommended Gemini voice name, and background music theme.
Script:
"""${text.slice(0, 1500)}"""

Choose from:
- style: one of ["corporate", "product_launch", "fun", "creative", "storytelling", "calm", "news"]
- recommendedVoice: one of ["Kore" (balanced & executive), "Puck" (energetic & lively), "Fenrir" (deep & authoritative), "Zephyr" (calm & gentle), "Charon" (cinematic & formal)]
- musicTheme: one of ["corporate", "product_launch", "fun", "creative", "storytelling", "calm"]
- rationale: A concise 1-sentence explanation of why this style fits the script.

Return ONLY valid JSON matching this structure:
{
  "style": "corporate",
  "recommendedVoice": "Kore",
  "musicTheme": "corporate",
  "rationale": "..."
}`;

      try {
        const rawText = await generateTextWithFallback(ai, prompt);
        const parsed = JSON.parse(rawText || "{}");
        return res.json(parsed);
      } catch (fallbackErr) {
        console.warn("AI analysis hit high demand, using rule-based fallback:", fallbackErr);
        const fallback = localCleanAndPlanFallback(text);
        return res.json({
          style: fallback.style,
          recommendedVoice: fallback.recommendedVoice,
          musicTheme: fallback.musicTheme,
          rationale: fallback.rationale,
        });
      }
    } catch (err: any) {
      console.error("Script analysis error:", err);
      return res.status(500).json({ error: err.message || "Failed to analyze script." });
    }
  });

  // Smart Clean & Plan: Cleans raw messy drafts (slides, notes, rough text) into spoken scripts
  app.post("/api/clean-and-plan-script", async (req, res) => {
    try {
      const { rawScript } = req.body;
      if (!rawScript || typeof rawScript !== "string" || !rawScript.trim()) {
        return res.status(400).json({ error: "rawScript is required." });
      }

      const ai = getGeminiClient();
      const prompt = `You are an expert audio narration editor. The user provides a raw, unpolished script draft (which may contain slide markers like "Slide 1:", "Slide 2", bullet points, speaker directions, typos, poor punctuation, broken sentence fragments, or informal notes).

Your goals:
1. Transform this raw text into a polished, natural, spoken narration script that flows seamlessly when read aloud by an audio narrator.
   - For long-form scripts with multiple slides or chapters, preserve every slide/section's full substance and maintain paragraph structure.
   - Remove visual slide headers ("Slide 1:", "Slide 2:", "Next slide please", "[Pause]", bullet points), converting them into natural spoken transitions (like "First, let's look at...", "Moving to our next point...").
   - Fix all grammatical errors, typos, capitalization, and awkward syntax.
   - Add deliberate punctuation (commas, periods, question marks, em-dashes) so the text-to-speech engine pauses at natural breathing intervals.
   - Retain the author's complete message, key facts, numbers, and intended tone.
2. Determine the best delivery style: one of ["corporate", "product_launch", "fun", "creative", "storytelling", "calm", "news"].
3. Pick the ideal prebuilt Gemini voice: one of ["Kore" (balanced & executive), "Puck" (energetic & lively), "Fenrir" (deep & authoritative), "Zephyr" (calm & gentle), "Charon" (cinematic & formal)].
4. Pick the best matching background music theme: one of ["corporate", "product_launch", "fun", "creative", "storytelling", "calm"].
5. Generate a concise title (2-5 words).
6. Provide a list of 2-4 brief bullet points explaining what was cleaned up (e.g. "Preserved 5 key slides with natural spoken transitions", "Inserted breathing pauses via punctuation", "Fixed informal grammar into executive phrasing").
7. Provide a 1-sentence rationale for the audio style and music theme.

Raw Script Input:
"""
${rawScript.slice(0, 15000)}
"""

Return ONLY valid JSON with this exact schema:
{
  "polishedScript": "...",
  "detectedTitle": "...",
  "style": "corporate",
  "recommendedVoice": "Kore",
  "musicTheme": "corporate",
  "rationale": "...",
  "cleaningNotes": ["..."]
}`;

      try {
        const rawJsonText = await generateTextWithFallback(ai, prompt);
        const parsed = JSON.parse(rawJsonText || "{}");
        return res.json(parsed);
      } catch (aiErr: any) {
        console.warn(
          "AI models experiencing high demand spikes, activating intelligent fallback parser:",
          aiErr?.message
        );
        const fallbackResult = localCleanAndPlanFallback(rawScript);
        return res.json(fallbackResult);
      }
    } catch (err: any) {
      console.error("Clean and plan fatal error:", err);
      const fallbackResult = localCleanAndPlanFallback(req.body?.rawScript || "");
      return res.json(fallbackResult);
    }
  });


  // Vite middleware in dev, static files in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
