import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { tanstackRouter } from '@tanstack/router-plugin/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), tanstackRouter({target: 'react', autoCodeSplitting: true}), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    },
    server: {
        host: true,
        watch: {
          usePolling: !!process.env.CHOKIDAR_USEPOLLING,
        },
        proxy: {
          '/api': {
            target: process.env.API_URL ?? 'http://localhost:3001',
            changeOrigin: true,
          },
        },
      },
})
