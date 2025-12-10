import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Vercel/Netlify-дағы VITE_GEMINI_API_KEY-ді жүктеу үшін қажет
    const env = loadEnv(mode, '.', ''); 
    
    return {
      // 1. 🛠️ Аппақ Экранды Жою Үшін: Осы жолды қосыңыз
      base: './', 

      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // 2. 🛠️ API Кілттерін Дұрыс Жүктеу: VITE_ префиксін қолданыңыз
        'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
