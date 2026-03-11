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

  const [showHeart, setShowHeart] = useState(false);
  const [enableHeart, setEnableHeart] = useState(true);
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
      setTimeout(() => setShowHeart(false), 500);
    }
  };

  if (!videoPath) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full bg-[#08080C] text-cyan-500/30 font-mono italic"></div>
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
        key={videoPath}
        src={serverUrl}
        ref={playerRef}
        viewType="video"
        streamType="on-demand"
        load="eager"
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

        {showHeart && (
          <div className="absolute inset-0 z-60 flex items-center justify-center pointer-events-none">
            <div className="animate-ping absolute">
              <Heart
                size={140}
                className="text-rose-500 opacity-40 fill-rose-500"
              />
            </div>
            <Heart
              size={120}
              className="animate-out fade-out zoom-out-150 duration-500 text-rose-500 fill-rose-500 drop-shadow-[0_0_40px_rgba(244,63,94,0.8)]"
            />
          </div>
        )}

        {/* 底部悬浮控制栏 */}
        <div
          className="absolute inset-x-0 bottom-8 px-10 z-50 flex flex-col items-center gap-4 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0"
          onContextMenu={(e) => e.stopPropagation()}
        >
          {/* 进度条 */}
          <div className="w-full max-w-4xl px-2 group/progress">
            <TimeSlider.Root className="relative flex w-full items-center h-6 cursor-pointer outline-none touch-none">
              <TimeSlider.Preview className="flex flex-col items-center opacity-0 transition-opacity duration-200 data-[visible]:opacity-100 mb-6">
                <TimeSlider.Value className="text-[12px] font-mono font-bold text-cyan-400 bg-black/90 px-2.5 py-1 rounded-md border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]" />
              </TimeSlider.Preview>

              <TimeSlider.Track className="relative h-1.5 w-full rounded-full bg-white/10 overflow-visible group-hover/progress:h-2 transition-all duration-300">
                <TimeSlider.TrackFill className="absolute h-full bg-cyan-500 rounded-full shadow-[0_0_12px_#06b6d4] will-change-transform" />
                <TimeSlider.Progress className="absolute h-full bg-white/20 rounded-full" />
              </TimeSlider.Track>
              <TimeSlider.Thumb className="absolute top-1/2 -translate-y-1/2 left-[var(--slider-fill)] w-4 h-4 rounded-full bg-white border-2 border-cyan-400 shadow-[0_0_15px_rgba(255,255,255,0.8)] scale-0 group-hover/progress:scale-100 transition-transform duration-200 will-change-[left]" />
            </TimeSlider.Root>
          </div>

          {/* 按钮控制面板 */}
          <div className="flex items-center justify-between w-full max-w-3xl bg-[#0F0F14]/70 backdrop-blur-3xl border border-white/10 rounded-2xl px-6 py-2.5 shadow-2xl pointer-events-auto ring-1 ring-white/10">
            <div className="flex items-center gap-6">
              <PlayButton className="text-white/90 hover:text-cyan-400 transition-all active:scale-90">
                <PlayIcon />
              </PlayButton>

              {/* 🚀 美化后的音量调节 */}
              <div className="flex items-center gap-2 group/vol relative">
                <MuteButton className="text-white/40 hover:text-white transition-all hover:scale-110 active:scale-95">
                  <VolumeIcon />
                </MuteButton>
                <div className="flex items-center w-0 group-hover/vol:w-28 overflow-hidden transition-all duration-500 ease-out">
                  <VolumeSlider.Root className="relative flex items-center h-6 w-24 mx-2 cursor-pointer touch-none">
                    <VolumeSlider.Track className="h-1 w-full rounded-full bg-white/10 overflow-visible">
                      <VolumeSlider.TrackFill className="bg-linear-to-r from-cyan-500/50 to-cyan-400 h-full rounded-full shadow-[0_0_8px_rgba(6,182,212,0.4)]" />
                    </VolumeSlider.Track>
                    <VolumeSlider.Thumb className="absolute top-1/2 -translate-y-1/2 left-[var(--slider-fill)] w-3 h-3 rounded-full bg-white border-2 border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)] transition-transform hover:scale-125" />
                  </VolumeSlider.Root>
                </div>
              </div>

              <div className="flex items-center font-mono text-[11px] font-bold tracking-tighter text-white/20">
                <TimeText type="current" />
                <span className="mx-2 opacity-10">/</span>
                <TimeText type="duration" />
              </div>
            </div>

            {/* 倍速与角度 */}
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-4 px-4 py-1 bg-white/5 rounded-full border border-white/5 shadow-inner">
                <div className="flex items-center gap-2">
                  <Gauge size={13} className="text-cyan-500/50" />
                  <span className="text-[11px] font-bold text-white/80 font-mono">
                    {playbackRate.toFixed(2)}x
                  </span>
                </div>
                <div className="w-px h-3 bg-white/10" />
                <div className="flex items-center gap-2">
                  <RotateCw
                    size={13}
                    className={
                      rotation !== 0
                        ? "text-cyan-400 animate-[spin_8s_linear_infinite]"
                        : "text-white/20"
                    }
                  />
                  <span className="text-[11px] font-bold text-white/80 font-mono">
                    {rotation}°
                  </span>
                </div>
              </div>

              <FullscreenButton className="text-white/20 hover:text-cyan-400 transition-all scale-90">
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

      {/* 左上角收藏状态 */}
      <div className="absolute top-6 left-8 z-50 pointer-events-none">
        <div
          className={`flex items-center gap-3 px-3 py-1.5 rounded-xl border transition-all duration-300 shadow-lg backdrop-blur-md ${
            isFavorite
              ? "bg-rose-500/20 border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.2)]"
              : "bg-black/40 border-white/5"
          }`}
        >
          <Bookmark
            size={14}
            className={
              isFavorite ? "fill-rose-500 text-rose-500" : "text-white/20"
            }
          />
          <span
            className={`text-[11px] font-bold tracking-[0.2em] whitespace-nowrap ${
              isFavorite ? "text-rose-400" : "text-white/20"
            }`}
          >
            {isFavorite ? "已收藏" : "未收藏"}
          </span>
        </div>
      </div>

      {/* F2 设置 */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowSettings(false)}
          />
          <div className="relative w-80 overflow-hidden rounded-2xl border border-white/10 bg-[#12121A]/90 p-6 shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-200">
            <div className="mb-6 flex items-center justify-between border-b border-white/5 pb-4">
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
              <p className="text-[10px] text-white/20 text-center font-mono opacity-40 uppercase">
                F2 / ESC Close
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// 辅助子组件逻辑

function TimeText({ type }: { type: "current" | "duration" }) {
  const current = useMediaState("currentTime");
  const duration = useMediaState("duration");
  const format = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
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
          setRotation((p: number) => (p - 90) % 360);
          break;
        case "w":
          setRotation((p: number) => (p + 90) % 360);
          break;
        case "z":
          if (player) player.currentTime -= 5;
          break;
        case "x":
          if (player) player.currentTime += 5;
          break;
        case "[":
          setPlaybackRate((p: number) => Math.max(p - 0.25, 0.25));
          break;
        case "]":
          setPlaybackRate((p: number) => Math.min(p + 0.25, 4));
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
