import { useEffect, useRef, useState } from "react";
import {
  Gauge,
  RotateCw,
  Bookmark,
  Sparkles,
  Heart,
  Settings2,
  X,
} from "lucide-react";
import { useVideoStore } from "../store/useVideoStore";

import {
  MediaPlayer,
  MediaProvider,
  PlayButton,
  TimeSlider,
  VolumeSlider,
  MuteButton,
  FullscreenButton,
  useMediaState,
  useMediaPlayer,
  type MediaPlayerInstance,
  Thumbnail,
} from "@vidstack/react";

import "@vidstack/react/player/styles/base.css";

interface PlayerProps {
  videoPath: string | null;
}

export default function GeekPlayer({ videoPath }: PlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<MediaPlayerInstance>(null);

  const [rotation, setRotation] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });

  // 状态控制：爱心显示与设置面板
  const [showHeart, setShowHeart] = useState(false);
  const [enableHeart, setEnableHeart] = useState(true); // F2 控制的开关
  const [showSettings, setShowSettings] = useState(false);

  const { videos, setCurrentVideo, favorites, toggleFavorite } =
    useVideoStore();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({
          w: entry.contentRect.width,
          h: entry.contentRect.height,
        });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // 监听 F2 呼出设置
  useEffect(() => {
    const handleF2 = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        setShowSettings((prev) => !prev);
      }
      if (e.key === "Escape") setShowSettings(false);
    };
    window.addEventListener("keydown", handleF2);
    return () => window.removeEventListener("keydown", handleF2);
  }, []);

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!videoPath) return;

    toggleFavorite(videoPath);

    if (enableHeart) {
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 500); // 调整快闪时间
    }
  };

  if (!videoPath) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full bg-[#08080C] text-cyan-500/30 font-mono italic">
        <Sparkles size={32} className="animate-pulse mb-4" />
        <span className="tracking-[0.3em] text-[12px] uppercase">
          系统就绪 // 等待媒体源
        </span>
      </div>
    );
  }

  const safePath = videoPath.replace(/\\/g, "/");
  const serverUrl = `http://127.0.0.1:1421/stream/${encodeURI(safePath)}`;

  const isVerticalRotated = Math.abs(rotation % 180) === 90;
  const isFavorite = favorites.has(videoPath);

  const playerWidth = isVerticalRotated ? containerSize.h : containerSize.w;
  const playerHeight = isVerticalRotated ? containerSize.w : containerSize.h;

  return (
    <div
      ref={containerRef}
      onContextMenu={handleRightClick}
      className="relative w-full h-full bg-black overflow-hidden flex items-center justify-center group select-none cursor-pointer"
    >
      <MediaPlayer
        src={serverUrl}
        ref={playerRef}
        viewType="video"
        playbackRate={playbackRate}
        className="w-full h-full absolute inset-0 flex items-center justify-center font-sans"
        keyShortcuts={{}}
      >
        <div
          className="transition-all duration-500 ease-in-out flex items-center justify-center overflow-hidden"
          style={{
            width: playerWidth > 0 ? `${playerWidth}px` : "100%",
            height: playerHeight > 0 ? `${playerHeight}px` : "100%",
            transform: `rotate(${rotation}deg)`,
            transformOrigin: "center center",
          }}
        >
          <MediaProvider className="w-full h-full pointer-events-none">
            <style>{`
              video { object-fit: contain !important; width: 100% !important; height: 100% !important; }
            `}</style>
          </MediaProvider>
        </div>

        {/* ❤️ 屏幕中央爱心快闪动画 */}
        {showHeart && (
          <div className="absolute inset-0 z-60 flex items-center justify-center pointer-events-none">
            <div className="animate-ping absolute">
              <Heart
                size={140}
                className="text-rose-500 opacity-40 fill-rose-500"
              />
            </div>
            <div className="animate-out fade-out zoom-out-150 duration-500 ease-in-out">
              <Heart
                size={120}
                className="text-rose-500 fill-rose-500 drop-shadow-[0_0_40px_rgba(244,63,94,0.8)]"
              />
            </div>
          </div>
        )}

        {/* 浮空控制栏 */}
        <div
          className="absolute inset-x-0 bottom-6 px-8 z-50 flex flex-col items-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0"
          onContextMenu={(e) => e.stopPropagation()}
        >
          <div className="w-full max-w-3xl bg-[#0A0A0F]/60 backdrop-blur-md border border-white/5 rounded-full px-4 h-2 flex items-center shadow-xl group/progress pointer-events-auto">
            <TimeSlider.Root className="relative flex w-full items-center h-full cursor-pointer outline-none touch-none">
              <TimeSlider.Preview className="flex flex-col items-center opacity-0 transition-opacity duration-200 data-visible:opacity-100 mb-6">
                <div className="overflow-hidden rounded-lg border border-cyan-500/30 bg-black">
                  <Thumbnail.Root
                    src={serverUrl}
                    className="block w-44 aspect-video bg-black"
                  >
                    <Thumbnail.Img className="w-full h-full object-cover" />
                  </Thumbnail.Root>
                </div>
                <TimeSlider.Value className="mt-2 text-[12px] font-mono font-bold text-cyan-400 bg-[#0A0A0F] px-2 py-0.5 rounded-full border border-white/5" />
              </TimeSlider.Preview>
              <TimeSlider.Track className="relative h-1 w-full rounded-full bg-white/10 overflow-hidden">
                <TimeSlider.TrackFill className="absolute h-full bg-linear-to-r from-cyan-600 to-cyan-400 rounded-full shadow-[0_0_15px_#06b6d4]" />
                <TimeSlider.Progress className="absolute h-full bg-white/5" />
              </TimeSlider.Track>
              {/* 🚀 修复语法错误：使用 var() */}
              <TimeSlider.Thumb className="absolute top-1/2 -translate-y-1/2 left-(--slider-fill) w-3 h-3 rounded-full bg-white shadow-[0_0_10px_white] scale-0 group-hover/progress:scale-100 transition-transform" />
            </TimeSlider.Root>
          </div>

          <div className="flex items-center justify-between w-full max-w-xl bg-[#0F0F14]/80 backdrop-blur-2xl border border-white/10 rounded-2xl px-6 py-2 shadow-2xl ring-1 ring-white/5 pointer-events-auto">
            <div className="flex items-center gap-6">
              <PlayButton className="text-white/90 hover:text-cyan-400 transition-all active:scale-90">
                <PlayIcon />
              </PlayButton>
              <div className="flex items-center gap-3 group/vol">
                <MuteButton className="text-white/50 hover:text-white transition-colors">
                  <VolumeIcon />
                </MuteButton>
                <VolumeSlider.Root className="relative flex items-center h-5 w-0 group-hover/vol:w-20 overflow-hidden transition-all duration-300">
                  <VolumeSlider.Track className="h-0.75 w-full rounded-full bg-white/10">
                    <VolumeSlider.TrackFill className="bg-cyan-500/60 h-full transform origin-left" />
                  </VolumeSlider.Track>
                </VolumeSlider.Root>
              </div>
              <div className="flex items-center font-mono text-[12px] font-medium tracking-widest text-white/30">
                <TimeText type="current" />
                <span className="mx-2 opacity-20">|</span>
                <TimeText type="duration" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5 text-[9px] font-mono text-white/20">
                <span className="text-cyan-500/50 uppercase">F2 设置</span>
              </div>
              <FullscreenButton className="text-white/40 hover:text-cyan-400 transition-all scale-90">
                <FullscreenIcon />
              </FullscreenButton>
            </div>
          </div>
        </div>

        <MasterKeyboardController
          rotation={rotation}
          setRotation={setRotation}
          playbackRate={playbackRate}
          setPlaybackRate={setPlaybackRate}
          videos={videos}
          currentVideo={videoPath}
          setCurrentVideo={setCurrentVideo}
        />
      </MediaPlayer>

      {/* 🚀 工业风格竖排状态仪表盘 */}
      <div className="absolute top-6 left-6 z-50 flex flex-col items-start gap-2.5 pointer-events-none transition-all duration-500 transform">
        {/* 1. 收藏状态标签 (等宽对齐修复) */}
        <div
          className={`flex items-center w-32 h-9 px-3 rounded-xl border transition-all duration-300 shadow-lg backdrop-blur-md ${
            isFavorite
              ? "bg-rose-500/20 border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.2)]"
              : "bg-black/40 border-white/5"
          }`}
        >
          <div className="flex w-5 shrink-0 justify-center">
            <Bookmark
              size={14}
              className={
                isFavorite ? "fill-rose-500 text-rose-500" : "text-white/20"
              }
            />
          </div>
          <span
            className={`ml-2 text-[11px] font-bold tracking-[0.2em] whitespace-nowrap ${
              isFavorite ? "text-rose-400" : "text-white/20"
            }`}
          >
            {isFavorite ? "已收藏" : "未收藏"}
          </span>
        </div>

        {/* 2. 倍速指示标签 (等宽) */}
        <div className="flex items-center w-32 h-9 px-3 rounded-xl bg-black/40 border border-white/5 backdrop-blur-md shadow-lg">
          <div className="flex w-5 shrink-0 justify-center">
            <Gauge size={14} className="text-cyan-500/60" />
          </div>
          <div className="flex flex-1 items-center justify-between ml-2">
            <span className="text-[10px] text-white/20 font-bold">倍速</span>
            <span className="text-[12px] font-bold text-white/90 font-mono tracking-tighter">
              {playbackRate.toFixed(2)}x
            </span>
          </div>
        </div>

        {/* 3. 旋转指示标签 (等宽) */}
        <div className="flex items-center w-32 h-9 px-3 rounded-xl bg-black/40 border border-white/5 backdrop-blur-md shadow-lg">
          <div className="flex w-5 shrink-0 justify-center">
            <RotateCw
              size={14}
              className={
                rotation !== 0
                  ? "text-cyan-400 animate-[spin_10s_linear_infinite]"
                  : "text-white/20"
              }
            />
          </div>
          <div className="flex flex-1 items-center justify-between ml-2">
            <span className="text-[10px] text-white/20 font-bold">角度</span>
            <span className="text-[12px] font-bold text-white/70 font-mono tracking-tighter">
              {rotation}°
            </span>
          </div>
        </div>
      </div>

      {/* 🚀 F2 设置界面弹窗 */}
      {showSettings && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowSettings(false)}
          />
          <div className="relative w-80 overflow-hidden rounded-2xl border border-white/10 bg-[#12121A]/90 p-6 shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-200">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings2 size={18} className="text-cyan-400" />
                <h3 className="text-sm font-bold tracking-widest text-white uppercase">
                  播放器设置
                </h3>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="text-white/20 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="text-xs text-white/80 font-medium">
                  收藏动画 (爱心)
                </span>
                <button
                  onClick={() => setEnableHeart(!enableHeart)}
                  className={`relative h-5 w-10 rounded-full transition-colors duration-300 ${
                    enableHeart ? "bg-cyan-500" : "bg-white/10"
                  }`}
                >
                  <div
                    className={`absolute top-1 h-3 w-3 rounded-full bg-white transition-all duration-300 ${
                      enableHeart ? "left-6" : "left-1"
                    }`}
                  />
                </button>
              </div>
              <p className="text-[10px] text-white/20 text-center font-mono">
                Press F2 or ESC to close
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// 逻辑子组件及图标（保持不变，仅包含必要部分）

function TimeText({ type }: { type: "current" | "duration" }) {
  const current = useMediaState("currentTime");
  const duration = useMediaState("duration");
  const format = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return h > 0
      ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
      : `${m}:${s.toString().padStart(2, "0")}`;
  };
  return <span>{type === "current" ? format(current) : format(duration)}</span>;
}

function MasterKeyboardController({
  rotation,
  setRotation,
  playbackRate,
  setPlaybackRate,
  videos,
  currentVideo,
  setCurrentVideo,
}: any) {
  const player = useMediaPlayer();
  const wheelTimer = useRef<number | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT") return;
      const key = e.key.toLowerCase();
      switch (key) {
        case " ":
          e.preventDefault();
          player?.paused ? player?.play() : player?.pause();
          break;
        case "q":
          setRotation((prev: number) => (prev - 90) % 360);
          break;
        case "w":
          setRotation((prev: number) => (prev + 90) % 360);
          break;
        case "z":
          if (player) player.currentTime -= 5;
          break;
        case "x":
          if (player) player.currentTime += 5;
          break;
        case "[":
          setPlaybackRate((prev: number) => Math.max(prev - 0.25, 0.25));
          break;
        case "]":
          setPlaybackRate((prev: number) => Math.min(prev + 0.25, 4));
          break;
      }
    };
    const handleWheel = (e: WheelEvent) => {
      if (videos.length <= 1 || wheelTimer.current) return;
      const idx = videos.findIndex((v: any) => v.path === currentVideo);
      if (idx === -1) return;
      const nextIdx =
        e.deltaY > 0
          ? (idx + 1) % videos.length
          : (idx - 1 + videos.length) % videos.length;
      setCurrentVideo(videos[nextIdx].path);
      wheelTimer.current = window.setTimeout(() => {
        wheelTimer.current = null;
      }, 250);
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("wheel", handleWheel);
    };
  }, [
    player,
    rotation,
    playbackRate,
    videos,
    currentVideo,
    setCurrentVideo,
    setRotation,
    setPlaybackRate,
  ]);
  return null;
}

function PlayIcon() {
  const isPaused = useMediaState("paused");
  return isPaused ? (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5.14v14l11-7-11-7z" />
    </svg>
  ) : (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  );
}

function VolumeIcon() {
  const isMuted = useMediaState("muted");
  const volume = useMediaState("volume");
  if (isMuted || volume === 0)
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M11 5L6 9H2v6h4l5 4V5zM22 9l-6 6M16 9l6 6" />
      </svg>
    );
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  );
}

function FullscreenIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 3h6v6M9 21H3v-6M21 15v6h-6M3 9V3h6" />
    </svg>
  );
}
