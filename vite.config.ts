
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Configure TensorFlow.js to be properly bundled
  optimizeDeps: {
    include: ['@tensorflow/tfjs', '@tensorflow-models/pose-detection'],
  },
  build: {
    rollupOptions: {
      output: {
        globals: {
          '@tensorflow/tfjs': 'tf',
          '@tensorflow-models/pose-detection': 'poseDetection'
        }
      }
    }
  }
}));
