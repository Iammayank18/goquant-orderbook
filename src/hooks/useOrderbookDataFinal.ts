import { useState, useEffect, useCallback, useRef } from 'react';
import { OrderbookSnapshot, FilterSettings, VenueType, OrderLevel } from '@/types/orderbook';

interface OrderbookStats {
  totalSnapshots: number;
  snapshotsPerSecond: number;
  dataRate: string;
  lastUpdate: number;
}

interface UseOrderbookDataReturn {
  snapshots: OrderbookSnapshot[];
  isConnected: boolean;
  activeVenues: VenueType[];
  error: string | null;
  reconnect: () => void;
  stats: OrderbookStats;
}

export function useOrderbookData(
  symbol: string,
  settings: FilterSettings
): UseOrderbookDataReturn {
  const [snapshots, setSnapshots] = useState<OrderbookSnapshot[]>([]);
  const [isConnected, setIsConnected] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<OrderbookStats>({
    totalSnapshots: 0,
    snapshotsPerSecond: 0,
    dataRate: '0 KB/s',
    lastUpdate: Date.now()
  });

  const intervalRef = useRef<NodeJS.Timeout>();
  const statsIntervalRef = useRef<NodeJS.Timeout>();
  const snapshotCountRef = useRef(0);
  const bytesReceivedRef = useRef(0);

  // Generate realistic test orderbook data
  const generateOrderbook = useCallback((venue: VenueType, basePrice: number): OrderbookSnapshot => {
    const spread = 2 + Math.random() * 3;
    const levels = 25;
    
    // Generate bids
    const bids: OrderLevel[] = Array.from({ length: levels }, (_, i) => {
      const priceOffset = spread + i * 0.5;
      const price = basePrice - priceOffset;
      const quantity = (Math.random() * 5 + 0.5) * Math.exp(-i * 0.1);
      return { price, quantity, total: 0 };
    }).sort((a, b) => b.price - a.price);

    // Generate asks
    const asks: OrderLevel[] = Array.from({ length: levels }, (_, i) => {
      const priceOffset = spread + i * 0.5;
      const price = basePrice + priceOffset;
      const quantity = (Math.random() * 5 + 0.5) * Math.exp(-i * 0.1);
      return { price, quantity, total: 0 };
    }).sort((a, b) => a.price - b.price);

    // Calculate cumulative totals
    let bidTotal = 0;
    let askTotal = 0;
    
    bids.forEach(bid => {
      bidTotal += bid.quantity;
      bid.total = bidTotal;
    });
    
    asks.forEach(ask => {
      askTotal += ask.quantity;
      ask.total = askTotal;
    });

    return {
      bids,
      asks,
      timestamp: Date.now(),
      venue
    };
  }, []);

  // Generate new snapshots
  const generateSnapshots = useCallback(() => {
    const basePrice = 96000 + (Math.sin(Date.now() / 10000) * 100);
    const newSnapshots: OrderbookSnapshot[] = [];

    settings.venues.forEach(venue => {
      const snapshot = generateOrderbook(venue, basePrice);
      
      // Apply filters
      if (settings.priceRange[0] > 0 || settings.priceRange[1] < 100000) {
        snapshot.bids = snapshot.bids.filter(bid => 
          bid.price >= settings.priceRange[0] && bid.price <= settings.priceRange[1]
        );
        snapshot.asks = snapshot.asks.filter(ask => 
          ask.price >= settings.priceRange[0] && ask.price <= settings.priceRange[1]
        );
      }
      
      if (settings.quantityThreshold > 0) {
        snapshot.bids = snapshot.bids.filter(bid => bid.quantity >= settings.quantityThreshold);
        snapshot.asks = snapshot.asks.filter(ask => ask.quantity >= settings.quantityThreshold);
      }
      
      newSnapshots.push(snapshot);
      
      // Update stats
      snapshotCountRef.current++;
      bytesReceivedRef.current += JSON.stringify(snapshot).length;
    });

    setSnapshots(prev => {
      const cutoffTime = Date.now() - settings.timeRange * 1000;
      const filtered = [...prev, ...newSnapshots].filter(s => s.timestamp > cutoffTime);
      return filtered.slice(-200); // Keep last 200 snapshots max
    });
  }, [settings, generateOrderbook]);

  // Update stats
  useEffect(() => {
    const updateStats = () => {
      const now = Date.now();
      const timeDiff = (now - stats.lastUpdate) / 1000;
      
      if (timeDiff > 0) {
        const snapshotsPerSecond = snapshotCountRef.current / timeDiff;
        const bytesPerSecond = bytesReceivedRef.current / timeDiff;
        const dataRate = bytesPerSecond > 1024 
          ? `${(bytesPerSecond / 1024).toFixed(1)} KB/s`
          : `${bytesPerSecond.toFixed(0)} B/s`;

        setStats({
          totalSnapshots: snapshots.length,
          snapshotsPerSecond: Math.round(snapshotsPerSecond),
          dataRate,
          lastUpdate: now
        });

        // Reset counters
        snapshotCountRef.current = 0;
        bytesReceivedRef.current = 0;
      }
    };

    statsIntervalRef.current = setInterval(updateStats, 1000);
    return () => {
      if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
    };
  }, [snapshots.length, stats.lastUpdate]);

  // Main data generation effect
  useEffect(() => {
    // Generate initial data
    for (let i = 0; i < 20; i++) {
      generateSnapshots();
    }

    // Generate new data periodically
    intervalRef.current = setInterval(generateSnapshots, 100);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [generateSnapshots]);

  const reconnect = useCallback(() => {
    setIsConnected(false);
    setError('Reconnecting...');
    
    setTimeout(() => {
      setIsConnected(true);
      setError(null);
    }, 1000);
  }, []);

  return {
    snapshots,
    isConnected,
    activeVenues: settings.venues,
    error,
    reconnect,
    stats
  };
}