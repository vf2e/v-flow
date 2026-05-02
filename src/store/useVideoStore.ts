import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface VideoItem {
  name: string;
  path: string;
  size: number;
}

interface VideoState {
  favorites: Set<string>;
  currentVideo: string | null;
  videos: VideoItem[];
  exportProgress: number;
  volume: number;
  setVideos: (videos: VideoItem[]) => void;
  setCurrentVideo: (path: string | null) => void;
  toggleFavorite: (path: string) => void;
  setExportProgress: (progress: number) => void;
  setVolume: (volume: number) => void;
}

export const useVideoStore = create<VideoState>()(
  persist(
    (set) => ({
      favorites: new Set<string>(),
      currentVideo: null,
      videos: [],
      exportProgress: 0,
      volume: 1,
      
      setVideos: (videos) => set({ videos }),
      setCurrentVideo: (path) => set({ currentVideo: path }),
      setExportProgress: (exportProgress) => set({ exportProgress }),
      setVolume: (volume) => set({ volume }), 
      
      toggleFavorite: (path) => set((state) => {
        const next = new Set(state.favorites);
        if (next.has(path)) next.delete(path);
        else next.add(path);
        return { favorites: next };
      }),
    }),
    {
      name: 'v-flow-storage-v2',
      partialize: (state) => ({
        ...state,
        favorites: Array.from(state.favorites),
      }) as any,
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray(state.favorites)) {
          state.favorites = new Set(state.favorites);
        }
      },
    }
  )
);