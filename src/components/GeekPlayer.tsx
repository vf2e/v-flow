import { useEffect, useRef, useState } from 'react';
import { RotateCw, FastForward } from 'lucide-react';
import { convertFileSrc } from '@tauri-apps/api/core';

interface PlayerProps {
  videoPath: string | null;
}

export default function GeekPlayer({ videoPath }: PlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [rotation, setRotation] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // 严格类型的键盘事件监听
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!videoRef.current) return;

      switch (e.key.toLowerCase()) {
        case ']': // 加速
          setPlaybackRate(prev => Math.min(prev + 0.25, 4.0));
          break;
        case '[': // 减速
          setPlaybackRate(prev => Math.max(prev - 0.25, 0.25));
          break;
        case 'r': // 旋转
          setRotation(prev => (prev + 90) % 360);
          break;
        case ' ': // 空格控制播放/暂停
          e.preventDefault();
          isPlaying ? videoRef.current.pause() : videoRef.current.play();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying]);

  // 同步状态到实际的 DOM 元素
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // 未选择视频时的占位 UI
  if (!videoPath) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-slate-900/50 rounded-2xl border border-slate-800">
        <div className="text-slate-500 font-mono tracking-widest animate-pulse">AWAITING_SIGNAL...</div>
      </div>
    );
  }

  // Tauri 专属：将本地绝对路径转换为前端可读取的 asset:// 协议
  const assetUrl = convertFileSrc(videoPath);
  console.log("正在尝试加载视频地址:", assetUrl);
  
  return (
    <div className="relative w-full h-full bg-black rounded-2xl overflow-hidden shadow-2xl group">
      {/* 旋转变换层 */}
      <div 
        className="w-full h-full transition-transform duration-500 ease-out flex items-center justify-center"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        <video
          ref={videoRef}
          src={assetUrl}
          controls
          autoPlay
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          className="max-w-full max-h-full outline-none"
        />
      </div>

      {/* 悬浮 OSD (On-Screen Display) 数据面板 */}
      <div className="absolute top-6 right-6 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-full border border-slate-700/50 text-slate-200 font-mono text-sm shadow-lg">
          <FastForward size={16} className="text-cyan-400" />
          <span>{playbackRate.toFixed(2)}x</span>
        </div>
        <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-full border border-slate-700/50 text-slate-200 font-mono text-sm shadow-lg">
          <RotateCw size={16} className="text-emerald-400" />
          <span>{rotation}°</span>
        </div>
      </div>
    </div>
  );
}