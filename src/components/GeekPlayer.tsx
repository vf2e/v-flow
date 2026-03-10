import { useEffect, useRef, useState } from "react";
import {
  Player,
  Video,
  Ui,
  Controls,
  PlaybackControl,
  ScrubberControl,
  TimeProgress,
  VolumeControl,
  FullscreenControl,
  SettingsControl,
  ClickToPlay,
  DblClickFullscreen,
  Spinner,
  ControlGroup,
  ControlSpacer,
} from "@vime/react";

import "@vime/core/themes/default.css";

import { Gauge, RotateCw } from "lucide-react";
interface PlayerProps {
  videoPath: string | null;
}

export default function GeekPlayer({ videoPath }: PlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLVmPlayerElement>(null);

  const [rotation, setRotation] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });

  // 1. 动态监听容器尺寸，解决居中偏移的关键
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerSize({
          w: entry.contentRect.width,
          h: entry.contentRect.height,
        });
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // 2. 快捷键逻辑
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const player = playerRef.current;
      if (!player) return;

      const key = e.key.toLowerCase();
      switch (key) {
        case "q":
          setRotation((prev) => (prev - 90) % 360);
          break;
        case "w":
          setRotation((prev) => (prev + 90) % 360);
          break;
        case "z":
          player.currentTime -= 5;
          break;
        case "x":
          player.currentTime += 5;
          break;
        case "]":
          setPlaybackRate((prev) => {
            const next = Math.min(prev + 0.25, 4.0);
            player.playbackRate = next;
            return next;
          });
          break;
        case "[":
          setPlaybackRate((prev) => {
            const next = Math.max(prev - 0.25, 0.25);
            player.playbackRate = next;
            return next;
          });
          break;
        case " ":
          e.preventDefault();
          player.paused ? player.play() : player.pause();
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!videoPath) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full bg-slate-950 text-slate-700 font-mono italic">
        AWAITING_SIGNAL_STREAM...
      </div>
    );
  }

  const safePath = videoPath.replace(/\\/g, "/");
  const serverUrl = `http://127.0.0.1:1421/stream/${encodeURI(safePath)}`;

  // 3. 核心计算：如果是垂直旋转（90/270度），则交换宽高以实现自适应最大化
  const isVerticalRotated = Math.abs(rotation % 180) === 90;
  const playerWidth = isVerticalRotated ? containerSize.h : containerSize.w;
  const playerHeight = isVerticalRotated ? containerSize.w : containerSize.h;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black overflow-hidden flex items-center justify-center group"
    >
      {/* 🚀 样式注入：解决 Vime 内部 Shadow DOM 的对齐问题 */}
      <style>{`
        vm-player {
          aspect-ratio: auto !important;
          padding-bottom: 0 !important;
          height: 100% !important;
          width: 100% !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        video {
          object-fit: contain !important; /* 核心：不裁剪，自适应最大化 */
          width: 100% !important;
          height: 100% !important;
          display: block !important;
        }
      `}</style>

      {/* 🚀 旋转定位层 */}
      <div
        className="absolute transition-all duration-500 ease-in-out flex items-center justify-center"
        style={{
          width: playerWidth > 0 ? `${playerWidth}px` : "100%",
          height: playerHeight > 0 ? `${playerHeight}px` : "100%",
          transform: `rotate(${rotation}deg)`,
          // 强制使用 flex 居中
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Player
          key={videoPath}
          ref={playerRef}
          theme="dark"
          language="zh"
          aspectRatio={undefined}
          style={{ width: "100%", height: "100%" }}
        >
          <Video crossOrigin="">
            <source src={serverUrl} type="video/mp4" />
          </Video>

          <Ui>
            <ClickToPlay />
            <DblClickFullscreen />
            <Spinner />

            <Controls
              fullWidth
              pin="bottomLeft"
              activeDuration={2500}
              className="px-2"
            >
              <ControlGroup>
                <ScrubberControl />
              </ControlGroup>
              <ControlGroup>
                <PlaybackControl />
                <VolumeControl />
                <TimeProgress separator=" / " />
                <ControlSpacer />
                <SettingsControl />
                <FullscreenControl />
              </ControlGroup>
            </Controls>
          </Ui>
        </Player>
      </div>

      <div className="absolute top-8 left-8 z-50 flex flex-col gap-3 pointer-events-none group-hover:opacity-100 opacity-0 transition-all duration-500">
        <div className="flex items-center gap-2">
          <div className="bg-cyan-500/20 backdrop-blur-md border border-cyan-500/40 px-3 py-1 rounded-lg flex items-center gap-2">
            <Gauge size={14} className="text-cyan-400" />
            <span className="text-[11px] font-black text-cyan-50 font-mono tracking-tighter">
              {playbackRate.toFixed(2)}x
            </span>
          </div>
          <div className="bg-white/5 backdrop-blur-md border border-white/10 px-3 py-1 rounded-lg flex items-center gap-2">
            <RotateCw size={14} className="text-slate-400" />
            <span className="text-[11px] font-mono text-slate-300">
              {rotation}°
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
