import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { FolderOpen, HardDriveDownload, Heart, PlayCircle } from 'lucide-react';
import GeekPlayer from './components/GeekPlayer';
import { useVideoStore } from './store/useVideoStore';
import './App.css';
export default function App() {
  const { 
    videos, setVideos, 
    favorites, toggleFavorite, 
    currentVideo, setCurrentVideo 
  } = useVideoStore();
  
  const [isExporting, setIsExporting] = useState(false);

  const loadDirectory = async () => {
    try {
      const res = await invoke<any[]>('open_directory');
      if (res.length > 0) setVideos(res);
    } catch (error) {
      console.error("读取目录失败:", error);
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
    <div className="flex h-screen w-screen bg-slate-950 text-slate-300 font-sans overflow-hidden select-none">
      <aside className="w-96 flex flex-col border-r border-slate-800/80 bg-slate-900/40 backdrop-blur-2xl z-10 shadow-2xl">
        <div className="p-6 border-b border-slate-800/80 flex flex-col gap-5 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-900/50">
              <PlayCircle size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 tracking-wider">
              V-FLOW
            </h1>
          </div>
          
          <div className="flex gap-3">
            <button onClick={loadDirectory} className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 py-2.5 rounded-xl transition-all text-sm font-semibold active:scale-95">
              <FolderOpen size={16} /> 载入目录
            </button>
            <button 
              onClick={exportFavorites}
              disabled={favorites.size === 0 || isExporting}
              className="flex-1 flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 text-white py-2.5 rounded-xl transition-all text-sm font-semibold active:scale-95 shadow-[0_0_15px_rgba(8,145,178,0.4)]"
            >
              <HardDriveDownload size={16} /> 
              {isExporting ? '处理中...' : `提取 (${favorites.size})`}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {videos.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4">
              <FolderOpen size={24} className="opacity-50" />
              <p className="text-sm tracking-wide font-mono">WAITING_FOR_DATA_SOURCE</p>
            </div>
          ) : (
            videos.map((vid) => (
              <div 
                key={vid.path}
                onClick={() => setCurrentVideo(vid.path)}
                className={`group flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-all border ${
                  currentVideo === vid.path ? 'bg-cyan-950/40 border-cyan-500/30 text-cyan-50 shadow-inner' : 'bg-slate-900/20 border-transparent hover:bg-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="truncate pr-4 text-sm font-medium">{vid.name}</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(vid.path); }}
                  className={`transition-all p-1.5 rounded-lg ${favorites.has(vid.path) ? 'text-rose-500 scale-110 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 'text-slate-600 opacity-0 group-hover:opacity-100 hover:bg-slate-700'}`}
                >
                  <Heart size={18} fill={favorites.has(vid.path) ? 'currentColor' : 'none'} />
                </button>
              </div>
            ))
          )}
        </div>
      </aside>

      <main className="flex-1 p-6 flex flex-col relative bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
        <GeekPlayer videoPath={currentVideo} />
        <div className="mt-6 flex justify-center gap-10 text-xs font-mono text-slate-500">
          <span className="flex items-center gap-2"><kbd className="bg-slate-800 px-2 py-1 rounded border border-slate-700 text-slate-300">SPACE</kbd> Play / Pause</span>
          <span className="flex items-center gap-2"><kbd className="bg-slate-800 px-2 py-1 rounded border border-slate-700 text-slate-300">R</kbd> Rotate 90°</span>
          <span className="flex items-center gap-2"><kbd className="bg-slate-800 px-2 py-1 rounded border border-slate-700 text-slate-300">[</kbd> Decelerate</span>
          <span className="flex items-center gap-2"><kbd className="bg-slate-800 px-2 py-1 rounded border border-slate-700 text-slate-300">]</kbd> Accelerate</span>
        </div>
      </main>
    </div>
  );
}