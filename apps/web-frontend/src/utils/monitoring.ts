// utils/monitoring.js
export function initMonitoring() {
  // 性能监控
  if ('PerformanceObserver' in window) {
    const perfObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'longtask') {
          console.dir(entry);
        }
      }
    });
    perfObserver.observe({ entryTypes: ['longtask'] });
  }

  // 错误监控
  window.addEventListener('error', (event) => {
    console.error({
      message: event.message,
      stack: event.error.stack
    });
  });

  // React渲染错误
  if (window.addEventListener) {
    window.addEventListener('unhandledrejection', (event) => {
      console.error({
        type: 'unhandledrejection',
        reason: event.reason
      });
    });
  }
}
console.log(1111111111);
