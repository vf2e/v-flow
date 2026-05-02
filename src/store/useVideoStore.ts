import { create } from "zustand";
import { persist } from "zustand/middleware";

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
  currentDir: string | null;

  setVideos: (videos: VideoItem[]) => void;
  setCurrentVideo: (path: string | null) => void;
  toggleFavorite: (path: string) => void;
  clearFavorites: () => void;
  setFavorites: (favs: Set<string>) => void;
  setCurrentDir: (dir: string | null) => void;
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
      currentDir: null,

      setVideos: (videos) => set({ videos }),
      setCurrentVideo: (path) => set({ currentVideo: path }),
      setExportProgress: (exportProgress) => set({ exportProgress }),
      setVolume: (volume) => set({ volume }),
      setCurrentDir: (dir) => set({ currentDir: dir }),
      setFavorites: (favs) => set({ favorites: favs }),

      clearFavorites: () => set({ favorites: new Set<string>() }),

      toggleFavorite: (path) =>
        set((state) => {
          const next = new Set(state.favorites);
          if (next.has(path)) next.delete(path);
          else next.add(path);
          return { favorites: next };
        }),
    }),
    {
      name: "v-flow-storage-v3",
      partialize: (state) =>
        ({
          volume: state.volume,
        } as any),
    }
  )
);
