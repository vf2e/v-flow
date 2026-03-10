import { useEffect, useRef, useState } from 'react';
import { convertFileSrc } from '@tauri-apps/api/core';

interface PlayerProps {
  videoPath: string | null;
}

export default function GeekPlayer({ videoPath }: PlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [rotation, setRotation] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // 键盘事件监听（保持不变）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!videoRef.current) return;

      switch (e.key.toLowerCase()) {
        case ']':
          setPlaybackRate(prev => Math.min(prev + 0.25, 4.0));
          break;
        case '[':
          setPlaybackRate(prev => Math.max(prev - 0.25, 0.25));
          break;
        case 'r':
          setRotation(prev => (prev + 90) % 360);
          break;
        case ' ':
          e.preventDefault();
          isPlaying ? videoRef.current.pause() : videoRef.current.play();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying]);

  // 同步播放速率
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // 未选择视频时的占位界面（保持简洁）
  if (!videoPath) {
    return (
      <div className="relative w-full h-full bg-black flex items-center justify-center">
        <div className="text-slate-700 font-mono text-sm tracking-widest">NO VIDEO</div>
      </div>
    );
  }

  const assetUrl = convertFileSrc(videoPath);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* 旋转变换层 */}
      <div
        className="w-full h-full transition-transform duration-700 ease-out"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        <video
          ref={videoRef}
          src={assetUrl}
          controls={false}       // 隐藏浏览器原生控件
          autoPlay
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          className="w-full h-full object-contain outline-none"
        />
      </div>
    </div>
  );
}