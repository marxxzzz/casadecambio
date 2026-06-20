import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api/buckpay': {
        target: 'https://api.realtechdev.com.br',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/buckpay/, '/v1'),
        headers: {
          'Authorization': `Bearer ${env.VITE_BUCKPAY_TOKEN}`,
          'User-Agent':    env.VITE_BUCKPAY_USER_AGENT,
        },
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('firebase')) return 'firebase'
          if (id.includes('recharts') || id.includes('d3-') || id.includes('victory-vendor')) return 'charts'
          if (id.includes('react-dom') || id.includes('react-router')) return 'react-vendor'
        },
      },
    },
  },
  }
})
