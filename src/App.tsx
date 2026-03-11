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
      className="relative flex h-screen w-screen overflow-hidden bg-[#0B0B0F] font-sans text-[#E0E0E0] selection:bg-cyan-500/30"
    >
      {/* 侧边栏 - 极简毛玻璃质感 */}
      <aside className="relative z-20 flex w-80 flex-col border-r border-white/5 bg-[#0C0C10]/80 shadow-2xl backdrop-blur-xl">
        {/* 顶部品牌区域 */}
        <div className="px-5 pt-8 pb-4">
          <div className="mb-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Logo 图标 - 增强光效和动感 */}
              <div className="relative flex h-8 w-8 items-center justify-center">
                {/* 核心光点 */}
                <div className="absolute h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_20px_#06b6d4] animate-ping opacity-75" />
                <div className="absolute h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_15px_#06b6d4] animate-pulse" />

                {/* 外圈旋转光晕 */}
                <div className="absolute h-6 w-6 rounded-full border border-cyan-400/30 animate-[spin_4s_linear_infinite]" />
                <div className="absolute h-5 w-5 rounded-full border border-cyan-400/20 animate-[spin_3s_linear_infinite_reverse]" />

                {/* 内部模糊光晕 */}
                <div className="absolute h-7 w-7 rounded-full bg-cyan-400/10 blur-md" />

                {/* 中心小点（稳定） */}
                <div className="absolute h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_10px_white]" />
              </div>

              {/* 品牌文字 - 增强渐变与光泽 */}
              <h1 className="relative bg-linear-to-r from-cyan-300 via-white to-purple-300 bg-clip-text text-base font-bold tracking-[0.3em] text-transparent">
                V-FLOW
              </h1>
            </div>

            {/* 标签 - 更精致 */}
            <div className="relative overflow-hidden rounded-md border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[10px] font-medium text-cyan-300/90 shadow-lg backdrop-blur-sm">
              <span className="relative z-10">PREVIEW</span>
            </div>
          </div>

          {/* 操作按钮组 - 等宽并排 */}
          <div className="flex gap-2">
            <button
              onClick={loadDirectory}
              className="group relative flex flex-1 items-center justify-center gap-2.5 whitespace-nowrap rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/80 shadow-sm transition-all duration-200 hover:border-cyan-400/30 hover:bg-cyan-400/10 hover:text-white hover:shadow-md hover:shadow-cyan-500/20 active:scale-[0.98] active:bg-cyan-500/15"
            >
              <FolderOpen
                size={16}
                className="text-cyan-400 transition-transform group-hover:scale-110"
              />
              <span>导入目录</span>
              <div className="absolute inset-0 -z-10 rounded-xl bg-linear-to-r from-cyan-400/0 via-cyan-400/10 to-cyan-400/0 opacity-0 transition-opacity group-hover:opacity-100" />
            </button>

            <button
              onClick={exportFavorites}
              disabled={favorites.size === 0 || isExporting}
              className="group relative flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-2.5 text-sm font-medium text-rose-400 transition-all duration-200 hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-300 hover:shadow-md hover:shadow-rose-500/20 active:scale-[0.98] active:bg-rose-500/15 disabled:pointer-events-none disabled:opacity-30"
            >
              <Heart
                size={16}
                className={`transition-all duration-200 ${
                  favorites.size > 0
                    ? "fill-rose-500 text-rose-500"
                    : "text-rose-400/60 group-hover:text-rose-400"
                }`}
              />
              <span className="transition-all duration-200 group-hover:tracking-wide">
                导出收藏
              </span>
              {favorites.size > 0 && (
                <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500/20 px-1.5 text-[11px] font-semibold leading-none text-rose-300 ring-1 ring-rose-500/30 backdrop-blur-sm transition-all duration-200 group-hover:scale-105 group-hover:bg-rose-500/30 group-hover:text-rose-200">
                  {favorites.size}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* 列表标题 - 极简 */}
        <div className="flex items-center justify-between px-5 py-2 text-[10px] font-medium tracking-wider text-white/30">
          <span>媒体库 · {videos.length}</span>
          <span className="flex items-center gap-1">
            <Clock size={10} className="opacity-50" />
            <span>最近</span>
          </span>
        </div>

        {/* 可滚动列表 - 自定义滚动条 */}
        <div className="custom-scrollbar flex-1 space-y-0.5 overflow-y-auto px-3 pb-6">
          {videos.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center pt-20 text-white/10">
              <Film size={40} strokeWidth={1} className="mb-4" />
              <p className="text-xs">暂无视频</p>
              <p className="mt-1 text-[10px] opacity-30">点击导入开始</p>
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
                    group relative flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5
                    transition-all duration-200
                    ${
                      isActive
                        ? "bg-white/10 shadow-[0_2px_8px_-4px_black]"
                        : "hover:bg-white/5"
                    }
                  `}
                >
                  {/* 激活指示器 */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-r-full bg-cyan-400 shadow-[0_0_10px_#06b6d4]" />
                  )}

                  {/* 缩略图占位 */}
                  <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-linear-to-br from-white/10 to-white/5">
                    {isActive ? (
                      <PlayCircle size={16} className="text-cyan-400" />
                    ) : (
                      <Film size={14} className="text-white/30" />
                    )}
                  </div>

                  {/* 文件名 */}
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-sm ${
                        isActive
                          ? "font-medium text-white"
                          : "text-white/70 group-hover:text-white/90"
                      }`}
                    >
                      {vid.name}
                    </p>
                  </div>

                  {/* 收藏标记 - 更明显 */}
                  {isFav ? (
                    <Heart
                      size={14}
                      fill="#f43f5e"
                      className="shrink-0 text-rose-500 drop-shadow-[0_0_6px_#f43f5e]"
                    />
                  ) : (
                    <span className="font-mono text-[10px] text-white/20 group-hover:text-white/30">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* 底部 - 仅保留帮助入口 */}
        <div className="flex items-center justify-end border-t border-white/5 px-5 py-3 text-[10px] font-medium text-white/30">
          <span className="flex cursor-help items-center gap-1.5 transition-colors hover:text-white/50">
            <span>F1 帮助</span>
          </span>
        </div>
      </aside>

      {/* 主画布区域 - 滚轮事件已移至此 */}
      <main
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
        className="relative flex flex-1 flex-col bg-[#08080C] p-6 lg:p-8"
      >
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
