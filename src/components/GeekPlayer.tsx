import { useEffect, useRef, useState } from 'react';
import { convertFileSrc } from '@tauri-apps/api/core';
import { 
  Player, 
  Video, 
  Ui, 
  Controls, 
  PlaybackControl, 
  ScrubberControl, 
  TimeProgress, 
  VolumeControl,
} from '@vime/react';

import '@vime/core/themes/default.css';
import { RotateCw, FastForward } from 'lucide-react';

interface PlayerProps {
  videoPath: string | null;
}

export default function GeekPlayer({ videoPath }: PlayerProps) {
  const playerRef = useRef<HTMLVmPlayerElement>(null);
  const [rotation, setRotation] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);

  // 快捷键逻辑适配 Vime API
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const player = playerRef.current;
      if (!player) return;

      switch (e.key.toLowerCase()) {
        case ']': // 加速
          setPlaybackRate(prev => {
            const next = Math.min(prev + 0.25, 4.0);
            player.playbackRate = next; // Vime 属性同步
            return next;
          });
          break;
        case '[': // 减速
          setPlaybackRate(prev => {
            const next = Math.max(prev - 0.25, 0.25);
            player.playbackRate = next;
            return next;
          });
          break;
        case 'r': // 旋转
          setRotation(prev => (prev + 90) % 360);
          break;
        case ' ': // 播放/暂停
          e.preventDefault();
          player.paused ? player.play() : player.pause();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!videoPath) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-slate-900/50 rounded-2xl border border-slate-800">
        <div className="text-slate-500 font-mono tracking-widest animate-pulse">AWAITING_SIGNAL...</div>
      </div>
    );
  }

  const assetUrl = convertFileSrc(videoPath);

  return (
    <div className="relative w-full h-full bg-black rounded-2xl overflow-hidden shadow-2xl group border border-white/5">
      {/* 旋转容器 */}
      <div 
        className="w-full h-full transition-transform duration-500 ease-out flex items-center justify-center"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        <Player 
          // 关键修复：当视频路径改变时，强制 React 重新挂载播放器以刷新资源
          key={videoPath}
          ref={playerRef} 
          theme="dark"
          style={{ '--vm-player-theme': '#06b6d4' } as any}
        >
          <Video crossOrigin="">
            {/* 关键修复：同时提供 src 和 data-src 确保兼容性 */}
            <source src={assetUrl} data-src={assetUrl} type="video/mp4" />
          </Video>

          <Ui>
            <Controls fullWidth pin="bottomLeft" activeDuration={2000}>
              <PlaybackControl />
              <VolumeControl />
              <TimeProgress />
              <ScrubberControl />
            </Controls>
          </Ui>
        </Player>
      </div>

      {/* 悬浮状态面板 (OSD) */}
      <div className="absolute top-6 left-6 z-50 flex gap-3 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
          <FastForward size={14} className="text-cyan-400" />
          <span className="text-xs font-mono text-cyan-50">{playbackRate.toFixed(2)}x</span>
        </div>
        <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
          <RotateCw size={14} className="text-emerald-400" />
          <span className="text-xs font-mono text-emerald-50">{rotation}°</span>
        </div>
      </div>
    </div>
  );
}