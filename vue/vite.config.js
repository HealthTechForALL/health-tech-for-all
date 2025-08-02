import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3001,
    // プロキシは不要（Expressサーバーが逆プロキシするため）
    cors: true,
    host: 'localhost'
  },
  build: {
    outDir: '../dist-frontend',
    emptyOutDir: true
  }
})
