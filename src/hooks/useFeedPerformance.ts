
import { useState, useEffect, useRef } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  scrollPerformance: number;
  memoryUsage: number;
  frameRate: number;
}

export const useFeedPerformance = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    scrollPerformance: 0,
    memoryUsage: 0,
    frameRate: 60
  });

  const loadStartTime = useRef<number>(0);
  const frameCount = useRef<number>(0);
  const lastTime = useRef<number>(0);

  useEffect(() => {
    loadStartTime.current = performance.now();

    // Monitor frame rate
    const measureFrameRate = () => {
      frameCount.current++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime.current >= 1000) {
        const fps = Math.round((frameCount.current * 1000) / (currentTime - lastTime.current));
        setMetrics(prev => ({ ...prev, frameRate: fps }));
        frameCount.current = 0;
        lastTime.current = currentTime;
      }
      
      requestAnimationFrame(measureFrameRate);
    };

    measureFrameRate();

    // Monitor memory usage (if available)
    const updateMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const memoryMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
        setMetrics(prev => ({ ...prev, memoryUsage: memoryMB }));
      }
    };

    const memoryInterval = setInterval(updateMemoryUsage, 5000);

    return () => {
      clearInterval(memoryInterval);
    };
  }, []);

  const recordLoadTime = () => {
    const loadTime = performance.now() - loadStartTime.current;
    setMetrics(prev => ({ ...prev, loadTime: Math.round(loadTime) }));
  };

  const recordScrollPerformance = (scrollDuration: number) => {
    setMetrics(prev => ({ ...prev, scrollPerformance: Math.round(scrollDuration) }));
  };

  return {
    metrics,
    recordLoadTime,
    recordScrollPerformance
  };
};
