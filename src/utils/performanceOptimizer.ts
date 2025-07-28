import { OrderbookSnapshot, OrderLevel } from '@/types/orderbook';

export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private readonly frameTimeHistory: number[] = [];
  private performanceMode: 'high' | 'medium' | 'low' = 'high';
  private readonly targetFPS = 60;
  private readonly frameTimeTarget = 1000 / this.targetFPS;
  
  private static readonly LOD_THRESHOLDS = {
    HIGH: 0,
    MEDIUM: 30,
    LOW: 60
  };

  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  updateFrameTime(deltaTime: number) {
    this.frameTimeHistory.push(deltaTime * 1000);
    if (this.frameTimeHistory.length > 60) {
      this.frameTimeHistory.shift();
    }

    const avgFrameTime = this.frameTimeHistory.reduce((a, b) => a + b, 0) / this.frameTimeHistory.length;
    
    if (avgFrameTime > this.frameTimeTarget * 1.5) {
      this.performanceMode = 'low';
    } else if (avgFrameTime > this.frameTimeTarget * 1.2) {
      this.performanceMode = 'medium';
    } else {
      this.performanceMode = 'high';
    }
  }

  getPerformanceMode(): 'high' | 'medium' | 'low' {
    return this.performanceMode;
  }

  static optimizeSnapshots(
    snapshots: OrderbookSnapshot[],
    cameraDistance: number
  ): OrderbookSnapshot[] {
    const instance = PerformanceOptimizer.getInstance();
    const lod = this.calculateLOD(cameraDistance);
    const mode = instance.getPerformanceMode();
    
    // Apply both LOD and performance mode optimizations
    let optimized = snapshots;
    
    // LOD optimization
    switch (lod) {
      case 'MEDIUM':
        optimized = this.reduceSnapshotDetail(optimized, 0.5);
        break;
      case 'LOW':
        optimized = this.reduceSnapshotDetail(optimized, 0.25);
        break;
    }
    
    // Performance mode optimization
    switch (mode) {
      case 'low':
        optimized = optimized
          .filter((_, index) => index % 3 === 0)
          .slice(-20)
          .map(snapshot => ({
            ...snapshot,
            bids: this.reduceLevels(snapshot.bids, 5),
            asks: this.reduceLevels(snapshot.asks, 5)
          }));
        break;
      case 'medium':
        optimized = optimized
          .filter((_, index) => index % 2 === 0)
          .slice(-30)
          .map(snapshot => ({
            ...snapshot,
            bids: this.reduceLevels(snapshot.bids, 10),
            asks: this.reduceLevels(snapshot.asks, 10)
          }));
        break;
    }
    
    return optimized;
  }

  private static calculateLOD(distance: number): 'HIGH' | 'MEDIUM' | 'LOW' {
    if (distance < this.LOD_THRESHOLDS.MEDIUM) return 'HIGH';
    if (distance < this.LOD_THRESHOLDS.LOW) return 'MEDIUM';
    return 'LOW';
  }

  private static reduceSnapshotDetail(
    snapshots: OrderbookSnapshot[],
    factor: number
  ): OrderbookSnapshot[] {
    const step = Math.ceil(1 / factor);
    
    return snapshots.map(snapshot => ({
      ...snapshot,
      bids: snapshot.bids.filter((_, index) => index % step === 0),
      asks: snapshot.asks.filter((_, index) => index % step === 0)
    }));
  }

  private static reduceLevels(levels: OrderLevel[], maxLevels: number): OrderLevel[] {
    if (levels.length <= maxLevels) return levels;
    
    const topLevels = levels.slice(0, maxLevels - 1);
    const remainingLevels = levels.slice(maxLevels - 1);
    
    if (remainingLevels.length > 0) {
      const aggregatedLevel: OrderLevel = {
        price: remainingLevels[0].price,
        quantity: remainingLevels.reduce((sum, level) => sum + level.quantity, 0),
        total: remainingLevels[remainingLevels.length - 1].total
      };
      topLevels.push(aggregatedLevel);
    }
    
    return topLevels;
  }

  getRecommendedSettings() {
    switch (this.performanceMode) {
      case 'low':
        return {
          maxSnapshots: 20,
          maxLevels: 5,
          particleCount: 50,
          updateInterval: 200
        };
      case 'medium':
        return {
          maxSnapshots: 30,
          maxLevels: 10,
          particleCount: 100,
          updateInterval: 100
        };
      default:
        return {
          maxSnapshots: 50,
          maxLevels: 20,
          particleCount: 150,
          updateInterval: 50
        };
    }
  }

  static throttleUpdates<T extends (...args: any[]) => void>(
    func: T,
    delay: number
  ): T {
    let lastCall = 0;
    let timeout: NodeJS.Timeout | null = null;
    
    return ((...args: Parameters<T>) => {
      const now = Date.now();
      
      if (now - lastCall >= delay) {
        lastCall = now;
        func(...args);
      } else {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
          lastCall = Date.now();
          func(...args);
        }, delay - (now - lastCall));
      }
    }) as T;
  }

  static debounce<T extends (...args: any[]) => void>(
    func: T,
    delay: number
  ): T {
    let timeout: NodeJS.Timeout | null = null;
    
    return ((...args: Parameters<T>) => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), delay);
    }) as T;
  }
}