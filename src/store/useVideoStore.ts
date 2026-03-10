import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface VideoItem {
  name: string;
  path: string;
}

interface VideoState {
  favorites: Set<string>;
  currentVideo: string | null;
  videos: VideoItem[];
  setVideos: (videos: VideoItem[]) => void;
  setCurrentVideo: (path: string | null) => void;
  toggleFavorite: (path: string) => void;
}

export const useVideoStore = create<VideoState>()(
  persist(
    (set) => ({
      favorites: new Set<string>(),
      currentVideo: null,
      videos: [],
      
      setVideos: (videos) => set({ videos }),
      setCurrentVideo: (path) => set({ currentVideo: path }),
      
      toggleFavorite: (path) => set((state) => {
        const next = new Set(state.favorites);
        if (next.has(path)) next.delete(path);
        else next.add(path);
        return { favorites: next };
      }),
    }),
    {
      name: 'v-flow-storage',
      // 将 Set 转换为 Array 进行持久化
      partialize: (state) => ({
        ...state,
        favorites: Array.from(state.favorites),
      }) as any,
      // 读取时将 Array 转回 Set
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray(state.favorites)) {
          state.favorites = new Set(state.favorites);
        }
      },
    }
  )
);