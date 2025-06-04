interface PerformanceMetrics {
  renderTime: number;
  scrollJank: number;
  memoryUsage?: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics = 100; // Keep last 100 measurements
  private frameTimeThreshold = 16.67; // 60fps = 16.67ms per frame

  // Monitor render performance
  measureRender<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    
    const renderTime = end - start;
    
    this.addMetric({
      renderTime,
      scrollJank: 0,
      timestamp: Date.now()
    });

    if (renderTime > this.frameTimeThreshold) {
      console.warn(`Slow render detected in ${name}: ${renderTime.toFixed(2)}ms`);
    }

    return result;
  }

  // Monitor scroll performance
  measureScrollJank(callback: () => void): () => void {
    let lastFrameTime = performance.now();
    let jankCount = 0;

    const measure = () => {
      const currentTime = performance.now();
      const frameTime = currentTime - lastFrameTime;
      
      if (frameTime > this.frameTimeThreshold * 2) { // >33ms indicates jank
        jankCount++;
      }
      
      lastFrameTime = currentTime;
      callback();
    };

    // Return cleanup function
    return () => {
      this.addMetric({
        renderTime: 0,
        scrollJank: jankCount,
        timestamp: Date.now()
      });
    };
  }

  // Get memory usage (if available)
  getMemoryUsage(): number | undefined {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return undefined;
  }

  // Add metric to collection
  private addMetric(metric: PerformanceMetrics) {
    metric.memoryUsage = this.getMemoryUsage();
    
    this.metrics.push(metric);
    
    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  // Get performance summary
  getSummary() {
    if (this.metrics.length === 0) return null;

    const renderTimes = this.metrics.map(m => m.renderTime).filter(t => t > 0);
    const jankCounts = this.metrics.map(m => m.scrollJank);
    const memoryUsages = this.metrics.map(m => m.memoryUsage).filter(Boolean) as number[];

    return {
      avgRenderTime: renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length,
      maxRenderTime: Math.max(...renderTimes),
      totalJank: jankCounts.reduce((a, b) => a + b, 0),
      currentMemory: memoryUsages[memoryUsages.length - 1],
      peakMemory: memoryUsages.length > 0 ? Math.max(...memoryUsages) : undefined,
      sampleCount: this.metrics.length
    };
  }

  // Check if performance is within acceptable bounds
  isPerformanceGood(): boolean {
    const summary = this.getSummary();
    if (!summary) return true;

    return (
      summary.avgRenderTime < this.frameTimeThreshold &&
      summary.totalJank < 5 && // Less than 5 jank events
      (summary.currentMemory === undefined || summary.currentMemory < 100) // Less than 100MB
    );
  }

  // Log performance report
  report() {
    const summary = this.getSummary();
    if (!summary) {
      console.log('No performance data collected');
      return;
    }

    console.group('📊 Performance Report');
    console.log(`Average render time: ${summary.avgRenderTime.toFixed(2)}ms`);
    console.log(`Max render time: ${summary.maxRenderTime.toFixed(2)}ms`);
    console.log(`Total scroll jank events: ${summary.totalJank}`);
    if (summary.currentMemory) {
      console.log(`Current memory usage: ${summary.currentMemory.toFixed(2)}MB`);
    }
    if (summary.peakMemory) {
      console.log(`Peak memory usage: ${summary.peakMemory.toFixed(2)}MB`);
    }
    console.log(`Performance status: ${this.isPerformanceGood() ? '✅ Good' : '⚠️ Needs attention'}`);
    console.groupEnd();
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Hook for React components
export function usePerformanceMonitoring() {
  return {
    measureRender: performanceMonitor.measureRender.bind(performanceMonitor),
    measureScrollJank: performanceMonitor.measureScrollJank.bind(performanceMonitor),
    getSummary: performanceMonitor.getSummary.bind(performanceMonitor),
    isPerformanceGood: performanceMonitor.isPerformanceGood.bind(performanceMonitor),
    report: performanceMonitor.report.bind(performanceMonitor)
  };
}
