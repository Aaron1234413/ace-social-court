
// Helper script to ensure TensorFlow is loaded properly
import { useEffect } from 'react';

export const useTensorflowLoader = () => {
  useEffect(() => {
    // Dynamically import TensorFlow.js only in client-side environments
    const loadTf = async () => {
      try {
        // This will ensure TensorFlow.js is loaded properly in the browser
        const tf = await import('@tensorflow/tfjs');
        console.log('TensorFlow.js loaded successfully:', tf.version);
        
        // Pre-load backend for better performance
        await tf.ready();
        console.log('TensorFlow.js ready with backend:', tf.getBackend());
      } catch (error) {
        console.error('Failed to load TensorFlow.js:', error);
      }
    };
    
    loadTf();
  }, []);
};
