import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { OrderbookSnapshot, FilterSettings, VenueType } from '@/types/orderbook';
import webSocketManager from '@/services/webSocketManager';

interface OrderbookStats {
  totalSnapshots: number;
  snapshotsPerSecond: number;
  bytesProcessed: number;
  messagesProcessed: number;
}

interface UseOptimizedOrderbookReturn {
  snapshots: OrderbookSnapshot[];
  isConnected: boolean;
  activeVenues: VenueType[];
  error: string | null;
  reconnect: () => void;
  stats: OrderbookStats;
}

const MAX_SNAPSHOTS = 100; // Limit snapshots to prevent memory issues

export function useOptimizedOrderbook(
  symbol: string,
  settings: FilterSettings
): UseOptimizedOrderbookReturn {
  const [snapshots, setSnapshots] = useState<OrderbookSnapshot[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<OrderbookStats>({
    totalSnapshots: 0,
    snapshotsPerSecond: 0,
    bytesProcessed: 0,
    messagesProcessed: 0,
  });

  const unsubscribeRef = useRef<(() => void) | null>(null);
  const statsRef = useRef({ messages: 0, bytes: 0, lastUpdate: Date.now() });
  
  // Filter snapshots based on settings
  const filterSnapshot = useCallback((snapshot: OrderbookSnapshot): OrderbookSnapshot => {
    let filtered = { ...snapshot };

    // Apply price range filter
    if (settings.priceRange[0] > 0 || settings.priceRange[1] < 100000) {
      filtered.bids = snapshot.bids.filter(
        bid => bid.price >= settings.priceRange[0] && bid.price <= settings.priceRange[1]
      );
      filtered.asks = snapshot.asks.filter(
        ask => ask.price >= settings.priceRange[0] && ask.price <= settings.priceRange[1]
      );
    }

    // Apply quantity threshold
    if (settings.quantityThreshold > 0) {
      filtered.bids = filtered.bids.filter(bid => bid.quantity >= settings.quantityThreshold);
      filtered.asks = filtered.asks.filter(ask => ask.quantity >= settings.quantityThreshold);
    }

    return filtered;
  }, [settings.priceRange, settings.quantityThreshold]);

  // Handle new snapshots
  const handleSnapshot = useCallback((snapshot: OrderbookSnapshot) => {
    // Update stats
    statsRef.current.messages++;
    statsRef.current.bytes += JSON.stringify(snapshot).length;

    // Filter and add snapshot
    const filtered = filterSnapshot(snapshot);
    
    setSnapshots(prev => {
      const cutoffTime = Date.now() - settings.timeRange * 1000;
      const newSnapshots = [...prev, filtered]
        .filter(s => s.timestamp > cutoffTime)
        .slice(-MAX_SNAPSHOTS);
      return newSnapshots;
    });

    setIsConnected(true);
    setError(null);
  }, [filterSnapshot, settings.timeRange]);

  // Subscribe to WebSocket
  useEffect(() => {
    if (!settings.venues.includes('binance')) {
      setIsConnected(false);
      setError('Binance not selected');
      return;
    }

    // Clear existing snapshots when reconnecting
    setSnapshots([]);
    
    // Subscribe via manager
    unsubscribeRef.current = webSocketManager.subscribe(symbol, handleSnapshot);

    // Check connection status
    const checkConnection = setInterval(() => {
      const ws = webSocketManager.getConnection(symbol);
      if (ws) {
        setIsConnected(ws.isConnected());
      }
    }, 1000);

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      clearInterval(checkConnection);
    };
  }, [symbol, settings.venues, handleSnapshot]);

  // Update stats periodically
  useEffect(() => {
    const updateStats = setInterval(() => {
      const now = Date.now();
      const timeDiff = (now - statsRef.current.lastUpdate) / 1000;
      
      if (timeDiff > 0) {
        setStats({
          totalSnapshots: snapshots.length,
          snapshotsPerSecond: Math.round(statsRef.current.messages / timeDiff),
          bytesProcessed: statsRef.current.bytes,
          messagesProcessed: statsRef.current.messages,
        });
        
        // Reset counters
        statsRef.current = { messages: 0, bytes: 0, lastUpdate: now };
      }
    }, 1000);

    return () => clearInterval(updateStats);
  }, [snapshots.length]);

  const reconnect = useCallback(() => {
    const ws = webSocketManager.getConnection(symbol);
    if (ws) {
      ws.disconnect();
      ws.connect();
    }
  }, [symbol]);

  return {
    snapshots,
    isConnected,
    activeVenues: settings.venues.filter(v => v === 'binance'),
    error,
    reconnect,
    stats,
  };
}