import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Read the API origin from .env so dev and the deployed build agree.
  // `loadEnv` is the supported way to get this without a dotenv dependency
  // in the client bundle.
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.API_PROXY_TARGET || `http://localhost:${env.PORT || 4000}`

  return {
    plugins: [react()],
    server: {
      // The client calls relative /api paths. Proxying them in dev keeps the
      // browser same-origin, so there are no CORS preflights and session
      // cookies behave normally.
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
    preview: {
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
