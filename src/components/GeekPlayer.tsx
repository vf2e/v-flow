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
      <div className="flex flex-col items-center justify-center w-full h-full bg-slate-900/30 rounded-3xl border border-slate-800/50 backdrop-blur-sm">
        <div className="text-slate-600 font-mono text-sm tracking-[0.3em] animate-pulse">AWAITING_SIGNAL_INPUT</div>
      </div>
    );
  }

  const safePath = videoPath.replace(/\\/g, '/');
  const serverUrl = `http://127.0.0.1:1421/stream/${encodeURI(safePath)}`;

  return (
    /* 外层容器：Flex 居中 */
    <div className="relative w-full h-full flex items-center justify-center bg-black rounded-3xl overflow-hidden shadow-2xl group">
      
      {/* 旋转层：必须覆盖 100% 宽高 */}
      <div 
        className="w-full h-full transition-transform duration-500 ease-in-out flex items-center justify-center"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        <Player 
          key={videoPath}
          ref={playerRef} 
          theme="dark"
          /* 核心修复：取消比例锁定，强制撑满 */
          aspectRatio={undefined}
          style={{ 
            '--vm-player-theme': '#06b6d4',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          } as any}
        >
          {/* 视频渲染层：确保视频内容居中且不拉伸 */}
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

      {/* OSD 数据面板 */}
      <div className="absolute top-8 left-8 z-50 flex gap-4 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-300">
        <div className="bg-slate-950/80 backdrop-blur-xl px-4 py-2 rounded-xl border border-white/10 flex items-center gap-3">
          <FastForward size={16} className="text-cyan-400" />
          <span className="text-sm font-mono font-bold text-cyan-50">{playbackRate.toFixed(2)}x</span>
        </div>
        <div className="bg-slate-950/80 backdrop-blur-xl px-4 py-2 rounded-xl border border-white/10 flex items-center gap-3">
          <RotateCw size={16} className="text-emerald-400" />
          <span className="text-sm font-mono font-bold text-emerald-50">{rotation}°</span>
        </div>
      </div>
    </div>
  );
}