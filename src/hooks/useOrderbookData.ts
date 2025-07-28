import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { OrderbookSnapshot, VenueType, FilterSettings } from '@/types/orderbook';
import { OrderbookWebSocket } from '@/services/websocket';

const MAX_SNAPSHOTS = 100;

export const useOrderbookData = (
  symbol: string,
  settings: FilterSettings
) => {
  const [snapshots, setSnapshots] = useState<OrderbookSnapshot[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const websocketsRef = useRef<Map<VenueType, OrderbookWebSocket>>(new Map());

  const handleOrderbookUpdate = useCallback((venue: VenueType) => (snapshot: OrderbookSnapshot) => {
    console.log('Received orderbook update from', venue, snapshot);
    setSnapshots(prev => {
      const now = Date.now();
      const cutoffTime = now - (settings.timeRange * 1000);
      
      const filtered = prev.filter(s => s.timestamp > cutoffTime);
      const updated = [...filtered, snapshot];
      
      if (updated.length > MAX_SNAPSHOTS) {
        return updated.slice(-MAX_SNAPSHOTS);
      }
      
      return updated;
    });
  }, [settings.timeRange]);

  useEffect(() => {
    const currentSockets = websocketsRef.current;
    
    settings.venues.forEach(venue => {
      if (!currentSockets.has(venue)) {
        try {
          console.log('Creating WebSocket for', venue, 'with symbol', symbol);
          const ws = new OrderbookWebSocket(
            symbol,
            venue,
            handleOrderbookUpdate(venue)
          );
          ws.connect();
          currentSockets.set(venue, ws);
          setIsConnected(true);
        } catch (err) {
          console.error('WebSocket error:', err);
          setError(`Failed to connect to ${venue}: ${err}`);
        }
      }
    });
    
    currentSockets.forEach((ws, venue) => {
      if (!settings.venues.includes(venue)) {
        ws.disconnect();
        currentSockets.delete(venue);
      }
    });
    
    return () => {
      currentSockets.forEach(ws => ws.disconnect());
      currentSockets.clear();
      setIsConnected(false);
    };
  }, [symbol, settings.venues, handleOrderbookUpdate]);

  const filteredSnapshots = useMemo(() => {
    return snapshots.filter(snapshot => {
      // Always include if no venue filter
      if (settings.venues.length === 0) return false;
      if (!settings.venues.includes(snapshot.venue)) return false;
      
      const midPrice = (snapshot.bids[0]?.price + snapshot.asks[0]?.price) / 2 || 0;
      if (settings.priceRange[0] > 0 && midPrice < settings.priceRange[0]) return false;
      if (settings.priceRange[1] < 100000 && midPrice > settings.priceRange[1]) return false;
      
      if (settings.quantityThreshold > 0) {
        const maxQuantity = Math.max(
          ...snapshot.bids.map(b => b.quantity),
          ...snapshot.asks.map(a => a.quantity)
        );
        
        if (maxQuantity < settings.quantityThreshold) {
          return false;
        }
      }
      
      return true;
    });
  }, [snapshots, settings]);

  return {
    snapshots: filteredSnapshots,
    isConnected,
    error,
    clearError: () => setError(null)
  };
};