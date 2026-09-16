import React, { useState } from 'react';
import { Download, FileAudio, Check, Share2, Sparkles, RefreshCw } from 'lucide-react';

interface DownloadSectionProps {
  masterBlobUrl: string | null;
  masterBlob: Blob | null;
  voiceBlobUrl: string | null;
  voiceBlob: Blob | null;
  duration: number;
  voiceName: string;
  styleLabel: string;
  musicThemeTitle: string;
  onReRenderMix: () => Promise<void>;
  isReRendering: boolean;
}

export const DownloadSection: React.FC<DownloadSectionProps> = ({
  masterBlobUrl,
  masterBlob,
  voiceBlobUrl,
  voiceBlob,
  duration,
  voiceName,
  styleLabel,
  musicThemeTitle,
  onReRenderMix,
  isReRendering,
}) => {
  const [downloadedMaster, setDownloadedMaster] = useState(false);
  const [downloadedVoice, setDownloadedVoice] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 KB';
    const kb = bytes / 1024;
    if (kb < 1024) return `${Math.round(kb)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const sanitizeFilename = (str: string) => {
    return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const handleDownloadMaster = () => {
    if (!masterBlobUrl) return;
    const filename = `narration-${sanitizeFilename(styleLabel)}-${sanitizeFilename(voiceName)}-master.wav`;
    const a = document.createElement('a');
    a.href = masterBlobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setDownloadedMaster(true);
    setTimeout(() => setDownloadedMaster(false), 3000);
  };

  const handleDownloadVoice = () => {
    if (!voiceBlobUrl) return;
    const filename = `narration-${sanitizeFilename(styleLabel)}-${sanitizeFilename(voiceName)}-voice-only.wav`;
    const a = document.createElement('a');
    a.href = voiceBlobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setDownloadedVoice(true);
    setTimeout(() => setDownloadedVoice(false), 3000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
            <Download className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
              6. Download Audio Files
            </h2>
            <p className="text-[11px] text-slate-500">
              High-resolution uncompressed broadcast WAV format
            </p>
          </div>
        </div>

        <button
          type="button"
          id="re-render-mix-btn"
          onClick={onReRenderMix}
          disabled={isReRendering}
          className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors disabled:opacity-50 cursor-pointer font-medium"
          title="Re-render audio mix with updated volume sliders"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isReRendering ? 'animate-spin' : ''}`} />
          <span>{isReRendering ? 'Updating...' : 'Update Mix'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        {/* Master Mix Download Button */}
        <button
          type="button"
          id="download-master-audio-btn"
          onClick={handleDownloadMaster}
          disabled={!masterBlobUrl}
          className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between gap-3 group cursor-pointer ${
            downloadedMaster
              ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-300'
              : 'bg-slate-900 hover:bg-slate-800 border-slate-900 text-white shadow-xs'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              downloadedMaster ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-white'
            }`}>
              {downloadedMaster ? (
                <Check className="w-5 h-5" />
              ) : (
                <Download className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className={`text-sm font-bold ${downloadedMaster ? 'text-emerald-950' : 'text-white'}`}>
                  Master Mix (.wav)
                </span>
                <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                  downloadedMaster ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-800 text-slate-300'
                }`}>
                  Vocals + Music
                </span>
              </div>
              <p className={`text-[11px] mt-0.5 ${downloadedMaster ? 'text-emerald-800' : 'text-slate-300'}`}>
                {masterBlob ? formatFileSize(masterBlob.size) : 'Ready'} • 44.1 kHz Stereo PCM
              </p>
            </div>
          </div>
          <span className={`text-xs font-semibold underline underline-offset-2 ${
            downloadedMaster ? 'text-emerald-800' : 'text-slate-200 group-hover:text-white'
          }`}>
            {downloadedMaster ? 'Saved!' : 'Download'}
          </span>
        </button>

        {/* Voice-Only Download Button */}
        <button
          type="button"
          id="download-voice-only-btn"
          onClick={handleDownloadVoice}
          disabled={!voiceBlobUrl}
          className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between gap-3 group cursor-pointer ${
            downloadedVoice
              ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-300'
              : 'bg-white hover:bg-slate-50/80 border-slate-200 text-slate-900'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              downloadedVoice ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}>
              {downloadedVoice ? (
                <Check className="w-5 h-5" />
              ) : (
                <FileAudio className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-slate-900">
                  Voice Only (.wav)
                </span>
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                  Stem
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {voiceBlob ? formatFileSize(voiceBlob.size) : 'Ready'} • 24.0 kHz Vocal Track
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-900 underline underline-offset-2">
            {downloadedVoice ? 'Saved!' : 'Download'}
          </span>
        </button>
      </div>

      {/* Audio File Technical Specifications */}
      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span>Format: <strong className="text-slate-800 font-mono">RIFF WAVE (.wav)</strong></span>
          <span>•</span>
          <span>Sample Rate: <strong className="text-slate-800 font-mono">44.1 kHz</strong></span>
          <span>•</span>
          <span>Bit Depth: <strong className="text-slate-800 font-mono">16-bit PCM</strong></span>
        </div>
        <div className="text-slate-500 font-medium">
          Compatible with Premiere, Final Cut, DaVinci, Audacity, and all video editors.
        </div>
      </div>
    </div>
  );
};
