import { useState, useEffect, useCallback, useRef } from 'react';
import { OrderbookSnapshot, FilterSettings, VenueType, OrderLevel } from '@/types/orderbook';

interface UseOrderbookTestDataReturn {
  snapshots: OrderbookSnapshot[];
  isConnected: boolean;
  activeVenues: VenueType[];
  error: string | null;
  reconnect: () => void;
  clearSnapshots: () => void;
}

export function useOrderbookTestData(
  symbol: string,
  settings: FilterSettings
): UseOrderbookTestDataReturn {
  const [snapshots, setSnapshots] = useState<OrderbookSnapshot[]>([]);
  const [isConnected, setIsConnected] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout>();

  const generateTestOrderbook = useCallback((venue: VenueType, basePrice: number): OrderbookSnapshot => {
    const spread = 5;
    const levels = 20;
    
    const bids: OrderLevel[] = Array.from({ length: levels }, (_, i) => {
      const price = basePrice - spread - (i * 2);
      const quantity = Math.random() * 5 + 0.5;
      return {
        price,
        quantity,
        total: 0
      };
    }).sort((a, b) => b.price - a.price); // Sort bids descending

    const asks: OrderLevel[] = Array.from({ length: levels }, (_, i) => {
      const price = basePrice + spread + (i * 2);
      const quantity = Math.random() * 5 + 0.5;
      return {
        price,
        quantity,
        total: 0
      };
    }).sort((a, b) => a.price - b.price); // Sort asks ascending

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

  useEffect(() => {
    const generateSnapshots = () => {
      const basePrice = 96000 + (Math.random() - 0.5) * 100;
      const newSnapshots: OrderbookSnapshot[] = [];

      settings.venues.forEach(venue => {
        const snapshot = generateTestOrderbook(venue, basePrice);
        
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
      });

      setSnapshots(prev => {
        const cutoffTime = Date.now() - settings.timeRange * 1000;
        const filtered = [...prev, ...newSnapshots].filter(s => s.timestamp > cutoffTime);
        return filtered.slice(-100); // Keep last 100 snapshots
      });
    };

    // Generate initial data
    for (let i = 0; i < 10; i++) {
      generateSnapshots();
    }

    // Generate new data every 100ms
    intervalRef.current = setInterval(generateSnapshots, 100);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [settings, generateTestOrderbook]);

  const reconnect = useCallback(() => {
    setIsConnected(false);
    setTimeout(() => setIsConnected(true), 1000);
  }, []);

  const clearSnapshots = useCallback(() => {
    setSnapshots([]);
  }, []);

  return {
    snapshots,
    isConnected,
    activeVenues: settings.venues,
    error: null,
    reconnect,
    clearSnapshots
  };
}