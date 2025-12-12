// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // === CRITICAL: Fix asset paths in production ===
  base: '/', // Works everywhere (Vercel, Netlify, Render, etc.)

  // === Development Proxy (only active in dev) ===
  server: {
    port: 5173,
    host: true, // Allows access from local network (optional but useful)
    proxy: {
      '/api': {
        target: 'http://localhost:5000',     // Your backend in dev
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api'), // Optional: clean rewrite
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  // === Production Build Optimizations ===
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // Set to false in production for smaller builds & security
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },

  // === Environment Variables Prefix ===
  // This ensures only variables starting with VITE_ are exposed to your frontend
  envPrefix: 'VITE_',

  // === Optional: Preview server (vite preview) ===
  preview: {
    port: 4173,
    proxy: {
      '/api': {
        target: 'https://kirt-bank.onrender.com', // Change to your actual backend URL
        changeOrigin: true,
        secure: true,
      },
      '/uploads': {
        target: 'https://kirt-bank.onrender.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
});