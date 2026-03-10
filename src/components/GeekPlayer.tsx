import { useEffect, useRef, useState } from 'react';
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

  // 快捷键逻辑
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const player = playerRef.current;
      if (!player) return;
      switch (e.key.toLowerCase()) {
        case ']':
          setPlaybackRate(prev => {
            const next = Math.min(prev + 0.25, 4.0);
            player.playbackRate = next;
            return next;
          });
          break;
        case '[':
          setPlaybackRate(prev => {
            const next = Math.max(prev - 0.25, 0.25);
            player.playbackRate = next;
            return next;
          });
          break;
        case 'r':
          setRotation(prev => (prev + 90) % 360);
          break;
        case ' ':
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

  // 🚀 核心逻辑：对接到本地 1421 服务器
  // 1. 将 Windows 反斜杠转为正斜杠
  // 2. 使用 encodeURI 处理中文路径，确保 Axum 能正确接收
  const safePath = videoPath.replace(/\\/g, '/');
  const serverUrl = `http://127.0.0.1:1421/stream/${encodeURI(safePath)}`;

  return (
    <div className="relative w-full h-full bg-black rounded-2xl overflow-hidden shadow-2xl group border border-white/5">
      <div 
        className="w-full h-full transition-transform duration-500 ease-out flex items-center justify-center"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        <Player 
          key={videoPath} // 路径切换时强制销毁旧实例，加载新视频
          ref={playerRef} 
          theme="dark"
          style={{ '--vm-player-theme': '#06b6d4' } as any}
        >
          <Video crossOrigin="">
            <source src={serverUrl} data-src={serverUrl} type="video/mp4" />
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

      {/* OSD 面板 */}
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