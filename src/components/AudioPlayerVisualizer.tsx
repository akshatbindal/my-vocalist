import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  FastForward,
  Rewind,
  Radio,
  Music,
  Mic,
} from 'lucide-react';

interface AudioPlayerVisualizerProps {
  analyserNode: AnalyserNode | null;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (seconds: number) => void;
  duration: number;
  currentTime: number;
  voiceName: string;
  styleLabel: string;
  musicThemeTitle: string;
}

export const AudioPlayerVisualizer: React.FC<AudioPlayerVisualizerProps> = ({
  analyserNode,
  isPlaying,
  onPlay,
  onPause,
  onSeek,
  duration,
  currentTime,
  voiceName,
  styleLabel,
  musicThemeTitle,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  // Canvas waveform and frequency bar visualizer in light mode
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let bufferLength = 64;
    let dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animationFrameRef.current = requestAnimationFrame(render);

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Background clean light slate
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, width, height);

      // Subtle center grid line
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      if (analyserNode && isPlaying) {
        bufferLength = analyserNode.frequencyBinCount;
        if (dataArray.length !== bufferLength) {
          dataArray = new Uint8Array(bufferLength);
        }
        analyserNode.getByteFrequencyData(dataArray);

        // Draw frequency spectrum bars
        const barCount = 48;
        const barWidth = width / barCount - 2;
        const step = Math.floor(bufferLength / barCount);

        for (let i = 0; i < barCount; i++) {
          const rawVal = dataArray[i * step] || 0;
          const barHeight = Math.max(3, (rawVal / 255) * (height * 0.85));
          const x = i * (barWidth + 2) + 1;
          const y = (height - barHeight) / 2;

          // Gradient for bars in light theme: deep slate to dark teal/emerald
          const barGrad = ctx.createLinearGradient(0, y, 0, y + barHeight);
          barGrad.addColorStop(0, '#0f172a'); // slate-900
          barGrad.addColorStop(0.5, '#334155'); // slate-700
          barGrad.addColorStop(1, '#0f766e'); // teal-700

          ctx.fillStyle = barGrad;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, 2);
          ctx.fill();
        }
      } else {
        // Idle decorative wave in light mode
        const barCount = 48;
        const barWidth = width / barCount - 2;
        for (let i = 0; i < barCount; i++) {
          const x = i * (barWidth + 2) + 1;
          const normalized = Math.sin((i / barCount) * Math.PI);
          const barHeight = 4 + normalized * 14;
          const y = (height - barHeight) / 2;

          ctx.fillStyle = '#cbd5e1'; // slate-300
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, 2);
          ctx.fill();
        }
      }
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [analyserNode, isPlaying]);

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const fraction = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(fraction * duration);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
              Master Audio Playback
            </h2>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span className="flex items-center gap-1 font-medium text-slate-700">
                <Mic className="w-3 h-3 text-slate-500" />
                {voiceName} ({styleLabel})
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-medium text-emerald-800">
                <Music className="w-3 h-3 text-emerald-600" />
                {musicThemeTitle}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Visualizer Canvas */}
      <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 mb-3 shadow-inner">
        <canvas
          ref={canvasRef}
          width={600}
          height={80}
          className="w-full h-20 block"
        />

        {/* Play overlay indicator */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] font-mono text-slate-700 border border-slate-200 shadow-2xs">
          <span
            className={`w-2 h-2 rounded-full ${
              isPlaying ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
            }`}
          />
          {isPlaying ? 'PLAYING' : 'READY'}
        </div>
      </div>

      {/* Scrubber Progress Bar */}
      <div
        id="audio-progress-bar-container"
        onClick={handleProgressBarClick}
        className="relative w-full h-2.5 bg-slate-100 rounded-full cursor-pointer overflow-hidden mb-4 group border border-slate-200"
        title="Click to seek"
      >
        <div
          className="h-full bg-slate-900 transition-all"
          style={{ width: `${progressPercent}%` }}
        />
        <div
          className="absolute top-0 bottom-0 w-1.5 bg-emerald-500 opacity-0 group-hover:opacity-100 shadow"
          style={{ left: `${progressPercent}%` }}
        />
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            id="rewind-5s-btn"
            onClick={() => onSeek(Math.max(0, currentTime - 5))}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer border border-slate-200"
            title="Rewind 5 seconds"
          >
            <Rewind className="w-4 h-4" />
          </button>

          <button
            type="button"
            id="master-play-pause-btn"
            onClick={isPlaying ? onPause : onPlay}
            className="w-11 h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center shadow-xs transition-transform active:scale-95 cursor-pointer"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          <button
            type="button"
            id="forward-5s-btn"
            onClick={() => onSeek(Math.min(duration, currentTime + 5))}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer border border-slate-200"
            title="Fast-forward 5 seconds"
          >
            <FastForward className="w-4 h-4" />
          </button>

          <button
            type="button"
            id="restart-audio-btn"
            onClick={() => onSeek(0)}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer ml-1 border border-slate-200"
            title="Replay from start"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            id="mute-toggle-btn"
            onClick={() => setIsMuted(!isMuted)}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer border border-slate-200"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-rose-600" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
