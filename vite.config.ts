import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite"; // 👈 引入插件

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // 👈 启用插件
  ],
  // Tauri 相关配置保持不变
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
  },
});