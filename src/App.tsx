import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { FolderOpen, HardDriveDownload, Heart, PlayCircle, Film, Sparkles, Grid3x3 } from 'lucide-react';
import GeekPlayer from './components/GeekPlayer';
import { useVideoStore } from './store/useVideoStore';
import './App.css';

export default function App() {
  const { videos, setVideos, favorites, toggleFavorite, currentVideo, setCurrentVideo } = useVideoStore();
  const [isExporting, setIsExporting] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // 用于动态背景光效的鼠标追踪
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const loadDirectory = async () => {
    try {
      const res = await invoke<any[]>('open_directory');
      if (res.length > 0) setVideos(res);
    } catch (error) {
      console.error('读取目录失败:', error);
    }
  };

  const exportFavorites = async () => {
    if (favorites.size === 0) return;
    setIsExporting(true);
    try {
      const paths = Array.from(favorites);
      const msg = await invoke<string>('export_favorites', { filePaths: paths });
      alert(msg);
    } catch (err) {
      alert(`导出失败: ${err}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-[#0A0C10] text-slate-200 font-sans select-none">
      {/* 动态背景网格 + 跟随鼠标的光晕 */}
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48cGF0aCBkPSJNMCAwaDQwdjQwSDB6IiBmaWxsPSJub25lIiAvPjxwYXRoIGQ9Ik0wIDQwTDQwIDBNMCAwaDQwdjQwIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiIHN0cm9rZS13aWR0aD0iMSIgZmlsbD0ibm9uZSIgLz48L3N2Zz4=')] opacity-20" />
      <div
        className="fixed inset-0 pointer-events-none transition-opacity duration-500"
        style={{
          background: `radial-gradient(600px at ${mousePosition.x}px ${mousePosition.y}px, rgba(6,182,212,0.1), transparent 80%)`,
        }}
      />

      {/* 左侧边栏 — 深邃立体 + 霓虹边框 */}
      <aside className="relative w-96 flex flex-col bg-[#0F1117]/90 backdrop-blur-2xl border-r border-white/5 shadow-2xl z-10">
        {/* 顶部装饰光条 */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

        {/* 头部区域 */}
        <div className="relative p-6 pb-4 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500 blur-xl opacity-30 rounded-full" />
              <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-cyan-500/30 ring-1 ring-white/20">
                <PlayCircle size={26} className="text-white drop-shadow-lg" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 bg-clip-text text-transparent">
                V·FLOW
              </h1>
              <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 mt-1">cinematic suite</p>
            </div>
          </div>

          {/* 操作按钮 — 发光悬浮感 */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            <button
              onClick={loadDirectory}
              className="group relative flex items-center justify-center gap-2 bg-slate-800/50 hover:bg-slate-700/60 border border-white/10 text-slate-200 py-3 rounded-xl transition-all duration-300 text-sm font-medium active:scale-[0.98] backdrop-blur-sm overflow-hidden"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/20 to-cyan-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              <FolderOpen size={16} className="group-hover:scale-110 transition-transform" />
              <span>载入目录</span>
            </button>
            <button
              onClick={exportFavorites}
              disabled={favorites.size === 0 || isExporting}
              className="group relative flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-400 text-white py-3 rounded-xl transition-all duration-300 text-sm font-medium active:scale-[0.98] shadow-[0_8px_20px_rgba(8,145,178,0.4)] hover:shadow-[0_8px_25px_rgba(8,145,178,0.7)] disabled:shadow-none"
            >
              <HardDriveDownload size={16} className="group-hover:translate-y-[-1px] transition-transform" />
              <span>{isExporting ? '处理中...' : `提取 (${favorites.size})`}</span>
            </button>
          </div>
        </div>

        {/* 视频列表 — 极简卡片 + 微光交互动效 */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1.5 custom-scrollbar">
          {videos.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-700 space-y-5">
              <div className="relative">
                <Film size={56} className="opacity-20 animate-pulse" />
                <Sparkles size={24} className="absolute -top-2 -right-2 text-cyan-500/40 rotate-12" />
              </div>
              <p className="text-sm tracking-widest font-mono text-slate-700">NO MEDIA</p>
              <p className="text-xs text-slate-800">点击上方按钮载入视频</p>
            </div>
          ) : (
            videos.map((vid, index) => (
              <div
                key={vid.path}
                onClick={() => setCurrentVideo(vid.path)}
                style={{ animationDelay: `${index * 40}ms` }}
                className={`group relative flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all duration-300 border ${
                  currentVideo === vid.path
                    ? 'bg-gradient-to-r from-cyan-950/70 to-blue-950/50 border-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.2)]'
                    : 'border-transparent hover:bg-slate-800/40 hover:border-slate-700/30'
                }`}
              >
                {/* 选中时左侧霓虹标记 */}
                {currentVideo === vid.path && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-cyan-400 to-purple-500 rounded-r-full shadow-[0_0_12px_#06b6d4]" />
                )}

                <span
                  className={`truncate pr-4 text-sm font-medium transition-colors duration-200 ${
                    currentVideo === vid.path ? 'text-cyan-50' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                >
                  {vid.name}
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(vid.path);
                  }}
                  className={`relative transition-all duration-300 p-1.5 rounded-lg ${
                    favorites.has(vid.path)
                      ? 'text-rose-400 scale-110 drop-shadow-[0_0_12px_rgba(244,63,94,0.8)] hover:scale-125'
                      : 'text-slate-600 opacity-0 group-hover:opacity-100 hover:bg-slate-700/50 hover:text-rose-400/70'
                  }`}
                >
                  <Heart size={16} fill={favorites.has(vid.path) ? 'currentColor' : 'none'} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* 底部统计 — 精致信息 */}
        {videos.length > 0 && (
          <div className="px-4 py-3 border-t border-white/5 text-xs text-slate-600 flex justify-between items-center bg-[#0F1117]/60 backdrop-blur-sm">
            <span className="flex items-center gap-1.5">
              <Film size={12} className="text-cyan-500/70" />
              <span>{videos.length} 个项目</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Heart size={12} className="text-rose-400/70" fill="currentColor" />
              <span>{favorites.size} 收藏</span>
            </span>
          </div>
        )}
      </aside>

      {/* 主内容区 — 播放器与快捷提示 */}
      <main className="relative flex-1 flex flex-col p-8 overflow-hidden">
        {/* 背景科技网格 (与鼠标光晕联动) */}
        <div
          className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48cGF0aCBkPSJNMCAwaDYwdjYwSDB6IiBmaWxsPSJub25lIiAvPjxwYXRoIGQ9Ik0wIDYwTDYwIDBNMCAwaDYwdjYwIiBzdHJva2U9InJnYmEoNiwxODIsMjEyLDAuMDYpIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiIC8+PC9zdmc+')] opacity-30"
          style={{
            maskImage: 'radial-gradient(circle at 50% 50%, black, transparent 80%)',
          }}
        />

        {/* 播放器卡片 — 无边框纯粹感，仅保留光影 */}
        <div className="relative flex-1 rounded-2xl overflow-hidden bg-black/20 backdrop-blur-sm shadow-2xl shadow-black/70 ring-1 ring-white/5">
          <GeekPlayer videoPath={currentVideo} />
        </div>

        {/* 快捷提示 — 超薄半透明条 */}
        <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs font-mono text-slate-600 bg-black/20 backdrop-blur-sm py-2 px-5 rounded-full border border-white/5 mx-auto shadow-lg">
          <span className="flex items-center gap-2">
            <kbd className="bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-white/10 text-slate-300 shadow-inner text-[10px]">␣</kbd> 播放/暂停
          </span>
          <span className="flex items-center gap-2">
            <kbd className="bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-white/10 text-slate-300 shadow-inner text-[10px]">R</kbd> 旋转90°
          </span>
          <span className="flex items-center gap-2">
            <kbd className="bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-white/10 text-slate-300 shadow-inner text-[10px]">[</kbd> 减速
          </span>
          <span className="flex items-center gap-2">
            <kbd className="bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-white/10 text-slate-300 shadow-inner text-[10px]">]</kbd> 加速
          </span>
        </div>
      </main>
    </div>
  );
}