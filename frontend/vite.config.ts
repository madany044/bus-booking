import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
 
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  console.log('🔧 VITE_API_URL at build time:', env.VITE_API_URL || '(not set — will use localhost fallback)')
 
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})