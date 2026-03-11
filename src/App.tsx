import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import {
  FolderOpen,
  Heart,
  PlayCircle,
  Film,
  Command,
  X,
  Clock,
  Loader2,
  Database,
} from "lucide-react";
import { Toaster, toast } from 'sonner';
import GeekPlayer from "./components/GeekPlayer";
import { useVideoStore } from "./store/useVideoStore";
import "./App.css";

export default function App() {
  const {
    videos,
    setVideos,
    favorites,
    currentVideo,
    setCurrentVideo,
  } = useVideoStore();

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [showHelp, setShowHelp] = useState(false);

  const wheelTimer = useRef<number | null>(null);
  const activeItemRef = useRef<HTMLDivElement>(null);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest", 
      });
    }
  }, [currentVideo]);

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
    try {
      const selectedPath = await open({
        directory: true,
        multiple: false,
        title: "选择导出文件夹",
      });
      if (!selectedPath) return;
      setIsExporting(true);
      setExportProgress(0);
      const paths = Array.from(favorites);
      for (let i = 0; i < paths.length; i++) {
        await invoke("export_favorites", {
          filePaths: [paths[i]],
          targetPath: selectedPath,
        });
        setExportProgress(Math.round(((i + 1) / paths.length) * 100));
      }
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
        toast.success('收藏视频已导出完成');
      }, 500);
    } catch (err) {
      toast.error(`导出出错: ${err}`);
      setIsExporting(false);
    }
  };

  return (
    <div
      className="relative flex h-screen w-screen overflow-hidden bg-[#0B0B0F] font-sans text-[#E0E0E0] selection:bg-cyan-500/30"
    >
      <Toaster richColors/>
      
      <aside 
        className="relative z-20 flex w-80 flex-col border-r border-white/5 bg-[#0C0C10]/80 shadow-2xl backdrop-blur-xl"
        onWheel={(e) => e.stopPropagation()} 
      >
        <div className="px-5 pt-8 pb-4">
          <div className="mb-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative flex h-8 w-8 items-center justify-center">
                <div className="absolute h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_20px_#06b6d4] animate-ping opacity-75" />
                <div className="absolute h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_15px_#06b6d4] animate-pulse" />
                <div className="absolute h-6 w-6 rounded-full border border-cyan-400/30 animate-[spin_4s_linear_infinite]" />
                <div className="absolute h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_10px_white]" />
              </div>
              <h1 className="relative bg-linear-to-r from-cyan-300 via-white to-purple-300 bg-clip-text text-base font-bold tracking-[0.3em] text-transparent">
                V-FLOW
              </h1>
            </div>
            <div className="relative overflow-hidden rounded-md border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[12px] font-medium text-cyan-300/90 shadow-lg backdrop-blur-sm">
              <span>PREVIEW</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <button
                onClick={loadDirectory}
                className="group relative flex flex-1 items-center justify-center gap-2.5 whitespace-nowrap rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/80 shadow-sm transition-all duration-200 hover:border-cyan-400/30 hover:bg-cyan-400/10 hover:text-white active:scale-[0.98]"
              >
                <FolderOpen size={16} className="text-cyan-400 transition-transform group-hover:scale-110" />
                <span>导入目录</span>
              </button>
              <button
                onClick={exportFavorites}
                disabled={favorites.size === 0 || isExporting}
                className="group relative flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-2.5 text-sm font-medium text-rose-400 transition-all duration-200 hover:border-rose-500/40 hover:bg-rose-500/10 active:scale-[0.98] disabled:opacity-30"
              >
                {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Heart size={16} className={favorites.size > 0 ? "fill-rose-500 text-rose-500" : ""} />}
                <span>{isExporting ? "导出中" : "导出收藏"}</span>
                {favorites.size > 0 && !isExporting && (
                  <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500/20 px-1.5 text-[11px] font-semibold text-rose-300 ring-1 ring-rose-500/30">
                    {favorites.size}
                  </span>
                )}
              </button>
            </div>
            {isExporting && (
              <div className="px-1 animate-in fade-in slide-in-from-top-1 duration-300">
                <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/5 ring-1 ring-white/5">
                  <div 
                    className="h-full bg-linear-to-r from-cyan-500 to-purple-500 transition-all duration-300 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                    style={{ width: `${exportProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-2 text-[12px] font-medium tracking-wider text-white/30">
          <span>媒体库 · {videos.length}</span>
          <span className="flex items-center gap-1">
            <Clock size={10} className="opacity-50" />
            <span>最近</span>
          </span>
        </div>

        <div className="custom-scrollbar flex-1 space-y-0.5 overflow-y-auto px-3 pb-6 scroll-smooth">
          {videos.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center pt-20 text-white/10">
              <Film size={40} strokeWidth={1} className="mb-4" />
              <p className="text-xs">暂无视频</p>
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
                  className={`group relative flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-150 ${
                    isActive ? "bg-white/10 shadow-[0_2px_8px_-4px_black]" : "hover:bg-white/5"
                  }`}
                >
                  {isActive && <div className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-r-full bg-cyan-400 shadow-[0_0_10px_#06b6d4]" />}
                  <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-linear-to-br from-white/10 to-white/5">
                    {isActive ? <PlayCircle size={16} className="text-cyan-400" /> : <Film size={14} className="text-white/30" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm ${isActive ? "font-medium text-white" : "text-white/70 group-hover:text-white/90"}`}>
                      {vid.name}
                    </p>
                    <div className="mt-0.5 flex items-center gap-1.5 opacity-50 group-hover:opacity-80 transition-opacity text-cyan-400">
                        <Database size={12} />
                        <span className="text-[12px] font-mono tracking-tighter">{formatSize(vid.size || 0)}</span>
                    </div>
                  </div>
                  {isFav ? (
                    <Heart size={14} fill="#f43f5e" className="shrink-0 text-rose-500 drop-shadow-[0_0_6px_#f43f5e]" />
                  ) : (
                    <span className="font-mono text-[12px] text-white/20 group-hover:text-white/30">{String(index + 1).padStart(2, "0")}</span>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-end border-t border-white/5 px-5 py-3 text-[12px] font-medium text-white/30">
          <span className="flex cursor-help items-center gap-1.5 transition-colors hover:text-white/50">
            <span>F1 帮助</span>
          </span>
        </div>
      </aside>

      <main
        onWheel={(e) => {
          if (videos.length <= 1 || wheelTimer.current) return;
          const idx = videos.findIndex((v) => v.path === currentVideo);
          if (idx === -1) return;
          const nextIdx = e.deltaY > 0 ? (idx + 1) % videos.length : (idx - 1 + videos.length) % videos.length;
          setCurrentVideo(videos[nextIdx].path);
          wheelTimer.current = window.setTimeout(() => (wheelTimer.current = null), 250);
        }}
        className="relative flex flex-1 flex-col bg-[#08080C] p-6 lg:p-8"
      >
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[40px_40px] mask-[radial-gradient(ellipse_80%_50%_at_50%_50%,black_40%,transparent_100%)] pointer-events-none" />
        <div className="relative flex-1 overflow-hidden rounded-2xl border border-white/5 bg-black/40 shadow-2xl ring-1 ring-white/10 backdrop-blur-sm">
          <GeekPlayer videoPath={currentVideo} />
          {!currentVideo && (
            <div className="absolute inset-0 flex items-center justify-center text-center opacity-20 pointer-events-none">
                <div>
                    <Film size={64} className="mx-auto mb-4" />
                    <p className="text-sm tracking-widest uppercase">系统已就绪，等待载入视频目录...</p>
                </div>
            </div>
          )}
        </div>
      </main>

      {showHelp && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4" onClick={() => setShowHelp(false)}>
          <div className="absolute inset-0 animate-in fade-in bg-black/70 backdrop-blur-md duration-300" />
          <div className="relative w-full max-w-2xl animate-in zoom-in-95 overflow-hidden rounded-2xl border border-[#2A2A35] bg-[#12121A]/90 shadow-2xl backdrop-blur-xl duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="relative p-8">
              <button onClick={() => setShowHelp(false)} className="absolute right-6 top-6 rounded-full border border-white/10 bg-white/5 p-2 transition-colors hover:bg-white/10">
                <X size={18} className="text-white/50" />
              </button>
              <div className="mb-8 flex items-center gap-4">
                <div className="rounded-xl border border-cyan-500/30 bg-linear-to-br from-cyan-500/20 to-purple-500/20 p-3">
                  <Command size={24} className="text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-wide text-white">快捷键指南</h2>
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
                  { keys: ["F2"], desc: "播放器设置" },
                  { keys: ["ESC"], desc: "关闭窗口" },
                ].map((item, idx) => (
                  <div key={idx} className="group flex items-start gap-3 rounded-xl border border-white/5 bg-black/20 p-3 transition-colors hover:border-cyan-500/30">
                    <div className="flex gap-1">
                      {item.keys.map((key, kidx) => (
                        <kbd key={kidx} className="rounded border border-[#33333F] bg-[#1E1E2A] px-2 py-1 font-mono text-xs text-cyan-400 shadow-sm transition-colors group-hover:bg-cyan-500/10">
                          {key}
                        </kbd>
                      ))}
                    </div>
                    <span className="text-xs text-white/60 group-hover:text-white/80">{item.desc}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 border-t border-white/5 pt-4 text-center text-[12px] text-white/20">V-FLOW 专业版 · 享受极简观影体验</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}