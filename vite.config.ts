
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      // Do not externalize react or react/jsx-runtime to avoid build failures
      external: [
        'zustand',
        'recharts',
        '@supabase/supabase-js',
        '@google/genai'
      ],
    }
  }
});
