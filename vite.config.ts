import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    define: {
      // Make environment variables available to the app
      __APP_ENV__: JSON.stringify(env.VITE_APP_ENV || 'development'),
    },
    server: {
      port: 5173,
      host: true, // Allow external connections for development
    },
    preview: {
      port: 4173,
      host: true, // Allow external connections for preview
    },
  }
})
