import { useState, useEffect, useRef, useCallback } from 'react';

// Performance monitoring hook
export const usePerformanceMonitor = (componentName) => {
  const mountTime = useRef(Date.now());
  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());

  useEffect(() => {
    renderCount.current += 1;
    const now = Date.now();
    const renderDuration = now - lastRenderTime.current;
    lastRenderTime.current = now;

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${componentName}: Render #${renderCount.current}, Duration: ${renderDuration}ms`);
    }
  });

  useEffect(() => {
    return () => {
      const totalTime = Date.now() - mountTime.current;
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Performance] ${componentName}: Unmounted after ${totalTime}ms, Total renders: ${renderCount.current}`);
      }
    };
  }, [componentName]);

  return {
    renderCount: renderCount.current,
    mountTime: mountTime.current
  };
};

// Intersection Observer hook for lazy loading
export const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isElementIntersecting = entry.isIntersecting;
        setIsIntersecting(isElementIntersecting);
        
        if (isElementIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [hasIntersected, options]);

  return { elementRef, isIntersecting, hasIntersected };
};

// Image lazy loading hook
export const useLazyImage = (src, placeholder = '/images/placeholder.png') => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [imageRef, setImageRef] = useState();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let observer;
    
    if (imageRef && src !== placeholder) {
      observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = new Image();
              img.onload = () => {
                setImageSrc(src);
                setIsLoaded(true);
                observer.unobserve(imageRef);
              };
              img.onerror = () => {
                setIsError(true);
                observer.unobserve(imageRef);
              };
              img.src = src;
            }
          });
        },
        { threshold: 0.1, rootMargin: '50px' }
      );
      
      observer.observe(imageRef);
    }

    return () => {
      if (observer && observer.disconnect) {
        observer.disconnect();
      }
    };
  }, [imageRef, src, placeholder]);

  return { imageSrc, setImageRef, isLoaded, isError };
};

// Debounced callback hook for performance
export const useDebouncedCallback = (callback, delay, dependencies = []) => {
  const timeoutRef = useRef(null);

  const debouncedCallback = useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay, ...dependencies]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
};

// Virtual scrolling hook for large lists
export const useVirtualScroll = (items, itemHeight, containerHeight) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerRef, setContainerRef] = useState(null);

  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );

  const visibleItems = items.slice(visibleStart, visibleEnd).map((item, index) => ({
    ...item,
    index: visibleStart + index
  }));

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleStart * itemHeight;

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  useEffect(() => {
    if (containerRef) {
      containerRef.addEventListener('scroll', handleScroll);
      return () => containerRef.removeEventListener('scroll', handleScroll);
    }
  }, [containerRef, handleScroll]);

  return {
    containerRef: setContainerRef,
    visibleItems,
    totalHeight,
    offsetY
  };
};

// Memory usage monitoring
export const useMemoryMonitor = () => {
  const [memoryInfo, setMemoryInfo] = useState(null);

  useEffect(() => {
    if ('memory' in performance) {
      const updateMemoryInfo = () => {
        setMemoryInfo({
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
        });
      };

      updateMemoryInfo();
      const interval = setInterval(updateMemoryInfo, 5000);

      return () => clearInterval(interval);
    }
  }, []);

  return memoryInfo;
};

// Optimized event listener hook
export const useOptimizedEventListener = (eventName, handler, element = window, options = {}) => {
  const savedHandler = useRef();
  const { throttle = 0, debounce = 0, passive = true } = options;

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const isSupported = element && element.addEventListener;
    if (!isSupported) return;

    let timeoutId;
    let lastCallTime = 0;

    const eventListener = (event) => {
      const now = Date.now();

      if (throttle > 0) {
        if (now - lastCallTime < throttle) return;
        lastCallTime = now;
      }

      if (debounce > 0) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => savedHandler.current(event), debounce);
      } else {
        savedHandler.current(event);
      }
    };

    element.addEventListener(eventName, eventListener, { passive });

    return () => {
      element.removeEventListener(eventName, eventListener);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [eventName, element, throttle, debounce, passive]);
};

// Preload resources hook
export const usePreloader = (resources = []) => {
  const [loadedResources, setLoadedResources] = useState(new Set());
  const [failedResources, setFailedResources] = useState(new Set());

  useEffect(() => {
    resources.forEach(resource => {
      if (resource.type === 'image') {
        const img = new Image();
        img.onload = () => {
          setLoadedResources(prev => new Set([...prev, resource.url]));
        };
        img.onerror = () => {
          setFailedResources(prev => new Set([...prev, resource.url]));
        };
        img.src = resource.url;
      } else if (resource.type === 'link') {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = resource.url;
        link.onload = () => {
          setLoadedResources(prev => new Set([...prev, resource.url]));
        };
        link.onerror = () => {
          setFailedResources(prev => new Set([...prev, resource.url]));
        };
        document.head.appendChild(link);
      }
    });
  }, [resources]);

  return {
    loadedResources,
    failedResources,
    isLoaded: (url) => loadedResources.has(url),
    isFailed: (url) => failedResources.has(url)
  };
};

export default {
  usePerformanceMonitor,
  useIntersectionObserver,
  useLazyImage,
  useDebouncedCallback,
  useVirtualScroll,
  useMemoryMonitor,
  useOptimizedEventListener,
  usePreloader
};