import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  FolderOpen,
  Heart,
  PlayCircle,
  Film,
  Command,
  X,
  Clock,
} from "lucide-react";
import GeekPlayer from "./components/GeekPlayer";
import { useVideoStore } from "./store/useVideoStore";
import "./App.css";

export default function App() {
  const {
    videos,
    setVideos,
    favorites,
    toggleFavorite,
    currentVideo,
    setCurrentVideo,
  } = useVideoStore();

  const [isExporting, setIsExporting] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const wheelTimer = useRef<number | null>(null);
  const activeItemRef = useRef<HTMLDivElement>(null);

  // 自动滚动到当前播放项
  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [currentVideo]);

  // 快捷键监听
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F1") {
        e.preventDefault();
        setShowHelp((prev) => !prev);
      }
      if (e.key === "Escape") setShowHelp(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const loadDirectory = async () => {
    try {
      const res = await invoke<any[]>("open_directory");
      if (res.length > 0) setVideos(res);
    } catch (err) {
      console.error(err);
    }
  };

  const exportFavorites = async () => {
    if (favorites.size === 0) return;
    setIsExporting(true);
    try {
      const paths = Array.from(favorites);
      const msg = await invoke<string>("export_favorites", {
        filePaths: paths,
      });
      alert(msg);
    } catch (err) {
      alert(err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      onContextMenu={(e) => {
        e.preventDefault();
        if (currentVideo) toggleFavorite(currentVideo);
      }}
      onWheel={(e) => {
        if (videos.length <= 1 || wheelTimer.current) return;
        const idx = videos.findIndex((v) => v.path === currentVideo);
        if (idx === -1) return;
        const nextIdx =
          e.deltaY > 0
            ? (idx + 1) % videos.length
            : (idx - 1 + videos.length) % videos.length;
        setCurrentVideo(videos[nextIdx].path);
        wheelTimer.current = window.setTimeout(
          () => (wheelTimer.current = null),
          200
        );
      }}
      className="relative flex h-screen w-screen overflow-hidden bg-[#0B0B0F] font-sans text-[#E0E0E0] selection:bg-cyan-500/30"
    >
      {/* 侧边栏 - 毛玻璃深色质感 */}
      <aside className="relative z-20 flex w-80 flex-col border-r border-[#2A2A35] bg-[#0F0F14]/90 shadow-2xl backdrop-blur-md">
        {/* 顶部区域 */}
        <div className="p-6 pb-4">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-3 w-3 animate-pulse rounded-full bg-cyan-400 shadow-[0_0_12px_#06b6d4]" />
                <div className="absolute inset-0 h-3 w-3 rounded-full bg-cyan-400/30 blur-sm" />
              </div>
              <h1 className="bg-linear-to-r from-cyan-400 to-purple-400 bg-clip-text text-base font-bold tracking-[0.3em] text-transparent">
                V-FLOW
              </h1>
            </div>
            <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-[12px] text-white/40">
              V1.0.0
            </span>
          </div>

          {/* 操作按钮组 - 水平并排 */}
          <div className="flex flex-row gap-2">
            <button
              onClick={loadDirectory}
              className="group relative flex flex-1 items-center justify-between overflow-hidden rounded-xl border border-[#33333F] bg-[#1A1A24] px-4 py-2.5 text-sm text-white transition-all duration-300 hover:bg-[#252530"
            >
              <span className="relative z-10 flex items-center gap-2">
                <FolderOpen
                  size={16}
                  className="text-cyan-400 transition-transform group-hover:scale-110"
                />
                <span className="tracking-wide">导入目录</span>
              </span>
              <div className="absolute inset-0 translate-x-\[-100%] bg-linear-to-r from-cyan-500/0 via-cyan-500/5 to-cyan-500/0 transition-transform duration-1000 group-hover:translate-x-\[100%]" />
            </button>

            <button
              onClick={exportFavorites}
              disabled={favorites.size === 0 || isExporting}
              className="group relative flex flex-1 items-center justify-start gap-2 rounded-xl border border-amber-500/30 bg-linear-to-br from-amber-500/10 to-rose-500/10 px-4 py-2.5 text-sm text-amber-400 transition-all duration-300 hover:from-amber-500/20 hover:to-rose-500/20 disabled:pointer-events-none disabled:opacity-20"
            >
              <span className="relative z-10 flex items-center gap-2">
                <span className="relative inline-flex">
                  <Heart
                    size={18}
                    className={`transition-transform duration-300 group-hover:scale-110 ${
                      favorites.size > 0
                        ? "fill-rose-500 text-rose-500"
                        : "text-amber-400/70"
                    }`}
                  />
                </span>
                <span className="tracking-wide">导出收藏</span>
                {favorites.size > 0 && (
                  <span className="absolute -right-5 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white shadow-lg">
                    {favorites.size}
                  </span>
                )}
              </span>
              <div className="absolute inset-0 translate-x-\[-100%] bg-linear-to-r from-transparent via-white/5 to-transparent transition-transform duration-1000 group-hover:translate-x-\[100%]" />
            </button>
          </div>
        </div>

        {/* 媒体列表标题 */}
        <div className="flex items-center justify-between border-t border-[#2A2A35] px-6 py-3 font-mono text-[10px] text-white/30">
          <span>媒体库 · {videos.length} 个视频</span>
          <span className="flex items-center gap-1">
            <Clock size={10} />
            最近播放
          </span>
        </div>

        {/* 可滚动列表 - 自定义滚动条已在App.css中定义 */}
        <div className="custom-scrollbar flex-1 space-y-1 overflow-y-auto px-4 pb-4">
          {videos.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-white/10">
              <Film size={48} strokeWidth={1} className="mb-4" />
              <p className="text-sm">暂无视频</p>
              <p className="mt-2 text-xs opacity-30">点击导入开始</p>
            </div>
          ) : (
            videos.map((vid, index) => {
              const isActive = currentVideo === vid.path;
              const isFav = favorites.has(vid.path);
              return (
                <div
                  key={vid.path}
                  ref={isActive ? activeItemRef : null}
                  onClick={() => setCurrentVideo(vid.path)}
                  className={`
                    group relative flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3
                    transition-all duration-200
                    ${
                      isActive
                        ? "border border-cyan-500/30 bg-linear-to-r from-cyan-500/20 via-cyan-500/5 to-transparent shadow-[0_0_15px_-5px_#06b6d4]"
                        : "border border-transparent hover:border-[#33333F] hover:bg-[#1A1A24]"
                    }
                  `}
                >
                  {/* 播放指示器 */}
                  {isActive && (
                    <div className="absolute left-0 h-8 w-1 rounded-r-full bg-cyan-400 shadow-[0_0_10px_#06b6d4]" />
                  )}

                  {/* 缩略图占位 */}
                  <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-linear-to-br from-[#2A2A35] to-[#1A1A24]">
                    {isActive ? (
                      <PlayCircle
                        size={18}
                        className="animate-pulse text-cyan-400"
                      />
                    ) : (
                      <Film size={16} className="text-white/30" />
                    )}
                  </div>

                  {/* 文件名和元数据 */}
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-sm ${
                        isActive
                          ? "font-medium text-white"
                          : "text-white/70 group-hover:text-white"
                      }`}
                    >
                      {vid.name}
                    </p>
                    <div className="mt-1 flex items-center gap-2 font-mono text-[10px]">
                      <span className="text-white/30">00:00</span>
                      <span className="h-1 w-1 rounded-full bg-white/20" />
                      <span className="text-white/30">1080p</span>
                    </div>
                  </div>

                  {/* 收藏图标 */}
                  {isFav && (
                    <Heart
                      size={12}
                      fill="#f43f5e"
                      className="shrink-0 animate-pulse text-rose-500"
                    />
                  )}

                  {/* 序号（极简） */}
                  <span className="font-mono text-[10px] text-white/20 group-hover:text-white/40">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* 底部状态栏 */}
        <div className="flex items-center justify-between border-t border-[#2A2A35] px-6 py-4 font-mono text-[10px] text-white/30">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
            <span>就绪</span>
          </div>
          <span className="flex cursor-help items-center gap-1 transition-colors hover:text-white/50">
            <Command size={10} />
            F1 帮助
          </span>
        </div>
      </aside>

      {/* 主画布区域 - 更丰富的背景层次 */}
      <main className="relative flex flex-1 flex-col bg-[#08080C] p-6 lg:p-8">
        {/* 动态背景网格 */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[40px_40px] mask-[radial-gradient(ellipse_80%_50%_at_50%_50%,black_40%,transparent_100%)]" />

        {/* 光晕效果 */}
        <div className="absolute -left-1/4 top-1/4 h-125 w-125 rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute -right-1/4 bottom-1/4 h-125 w-125 rounded-full bg-purple-500/10 blur-[120px]" />

        {/* 播放器容器 - 磨砂玻璃效果 */}
        <div className="relative flex-1 overflow-hidden rounded-2xl border border-white/5 bg-black/40 shadow-2xl ring-1 ring-white/10 backdrop-blur-sm">
          <GeekPlayer videoPath={currentVideo} />

          {/* 视频信息浮层（当没有视频时显示） */}
          {!currentVideo && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Film size={64} className="mx-auto mb-4 text-white/10" />
                <p className="text-sm tracking-wide text-white/30">
                  从左侧选择视频开始播放
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* F1 帮助浮层 - 毛玻璃质感 */}
      {showHelp && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center p-4"
          onClick={() => setShowHelp(false)}
        >
          {/* 背景遮罩 */}
          <div className="absolute inset-0 animate-in fade-in bg-black/70 backdrop-blur-md duration-300" />

          {/* 对话框 */}
          <div
            className="relative w-full max-w-2xl animate-in zoom-in-95 overflow-hidden rounded-2xl border border-[#2A2A35] bg-[#12121A]/90 shadow-2xl backdrop-blur-xl duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 头部渐变 */}
            <div className="absolute inset-x-0 top-0 h-32 bg-linear-to-b from-cyan-500/10 to-transparent pointer-events-none" />

            <div className="relative p-8">
              <button
                onClick={() => setShowHelp(false)}
                className="absolute right-6 top-6 rounded-full border border-white/10 bg-white/5 p-2 transition-colors hover:bg-white/10"
              >
                <X size={18} className="text-white/50" />
              </button>

              <div className="mb-8 flex items-center gap-4">
                <div className="rounded-xl border border-cyan-500/30 bg-linear-to-br from-cyan-500/20 to-purple-500/20 p-3">
                  <Command size={24} className="text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-wide text-white">
                    快捷键指南
                  </h2>
                  <p className="mt-1 text-xs text-white/40">让操作行云流水</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { keys: ["滚轮"], desc: "切换视频" },
                  { keys: ["右键"], desc: "收藏 / 取消收藏" },
                  { keys: ["空格"], desc: "播放 / 暂停" },
                  { keys: ["Q", "W"], desc: "旋转 90°" },
                  { keys: ["Z", "X"], desc: "快退 / 快进 5秒" },
                  { keys: ["[", "]"], desc: "减速 / 加速" },
                  { keys: ["F1"], desc: "打开帮助" },
                  { keys: ["ESC"], desc: "关闭帮助" },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="group flex items-start gap-3 rounded-xl border border-white/5 bg-black/20 p-3 transition-colors hover:border-cyan-500/30"
                  >
                    <div className="flex gap-1">
                      {item.keys.map((key, kidx) => (
                        <kbd
                          key={kidx}
                          className="rounded border border-[#33333F] bg-[#1E1E2A] px-2 py-1 font-mono text-xs text-cyan-400 shadow-sm transition-colors group-hover:bg-cyan-500/10"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                    <span className="text-xs text-white/60 group-hover:text-white/80">
                      {item.desc}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-6 border-t border-white/5 pt-4 text-center text-[10px] text-white/20">
                V-FLOW 专业版 · 享受极简观影体验
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
