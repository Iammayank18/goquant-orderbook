import { useState, useEffect, useCallback, useRef } from 'react';
import { OrderbookSnapshot, FilterSettings, VenueType } from '@/types/orderbook';
import { MultiVenueWebSocketService } from '@/services/multiVenueWebsocket';

interface UseMultiVenueOrderbookReturn {
  snapshots: OrderbookSnapshot[];
  isConnected: boolean;
  activeVenues: VenueType[];
  error: string | null;
  reconnect: () => void;
  clearSnapshots: () => void;
}

export function useMultiVenueOrderbook(
  symbol: string,
  settings: FilterSettings
): UseMultiVenueOrderbookReturn {
  const [snapshots, setSnapshots] = useState<OrderbookSnapshot[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [activeVenues, setActiveVenues] = useState<VenueType[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const wsServiceRef = useRef<MultiVenueWebSocketService | null>(null);
  const snapshotBufferRef = useRef<Map<VenueType, OrderbookSnapshot[]>>(new Map());
  const lastUpdateRef = useRef<Map<VenueType, number>>(new Map());

  const handleSnapshot = useCallback((snapshot: OrderbookSnapshot) => {
    const now = Date.now();
    const lastUpdate = lastUpdateRef.current.get(snapshot.venue) || 0;
    
    // Throttle updates per venue (max 10 updates per second)
    if (now - lastUpdate < 100) return;
    
    lastUpdateRef.current.set(snapshot.venue, now);
    
    // Filter by price range
    if (settings.priceRange[0] > 0 || settings.priceRange[1] < 100000) {
      snapshot.bids = snapshot.bids.filter(bid => 
        bid.price >= settings.priceRange[0] && bid.price <= settings.priceRange[1]
      );
      snapshot.asks = snapshot.asks.filter(ask => 
        ask.price >= settings.priceRange[0] && ask.price <= settings.priceRange[1]
      );
    }
    
    // Filter by quantity threshold
    if (settings.quantityThreshold > 0) {
      snapshot.bids = snapshot.bids.filter(bid => bid.quantity >= settings.quantityThreshold);
      snapshot.asks = snapshot.asks.filter(ask => ask.quantity >= settings.quantityThreshold);
    }
    
    // Update venue buffer
    const venueBuffer = snapshotBufferRef.current.get(snapshot.venue) || [];
    venueBuffer.push(snapshot);
    
    // Keep only recent snapshots per venue
    const cutoffTime = now - settings.timeRange * 1000;
    const recentSnapshots = venueBuffer.filter(s => s.timestamp > cutoffTime);
    snapshotBufferRef.current.set(snapshot.venue, recentSnapshots.slice(-100)); // Max 100 per venue
    
    // Combine all venue snapshots
    const allSnapshots: OrderbookSnapshot[] = [];
    snapshotBufferRef.current.forEach((venueSnapshots, venue) => {
      if (settings.venues.includes(venue)) {
        allSnapshots.push(...venueSnapshots);
      }
    });
    
    // Sort by timestamp and limit total
    allSnapshots.sort((a, b) => a.timestamp - b.timestamp);
    setSnapshots(allSnapshots.slice(-200)); // Max 200 total snapshots
  }, [settings]);

  const handleError = useCallback((error: string) => {
    setError(error);
    console.error('WebSocket error:', error);
  }, []);

  const handleConnect = useCallback(() => {
    setIsConnected(true);
    setError(null);
  }, []);

  const handleDisconnect = useCallback(() => {
    setIsConnected(false);
  }, []);

  const reconnect = useCallback(() => {
    if (wsServiceRef.current) {
      wsServiceRef.current.disconnect();
      wsServiceRef.current.connect(settings.venues);
    }
  }, [settings.venues]);

  const clearSnapshots = useCallback(() => {
    setSnapshots([]);
    snapshotBufferRef.current.clear();
    lastUpdateRef.current.clear();
  }, []);

  useEffect(() => {
    // Initialize WebSocket service
    wsServiceRef.current = new MultiVenueWebSocketService(symbol, {
      onSnapshot: handleSnapshot,
      onError: handleError,
      onConnect: handleConnect,
      onDisconnect: handleDisconnect
    });

    // Connect to selected venues
    if (settings.venues.length > 0) {
      wsServiceRef.current.connect(settings.venues);
    }

    // Update active venues periodically
    const venueCheckInterval = setInterval(() => {
      if (wsServiceRef.current) {
        setActiveVenues(wsServiceRef.current.getActiveVenues());
      }
    }, 1000);

    return () => {
      clearInterval(venueCheckInterval);
      if (wsServiceRef.current) {
        wsServiceRef.current.disconnect();
      }
    };
  }, [symbol, settings.venues, handleSnapshot, handleError, handleConnect, handleDisconnect]);

  return {
    snapshots,
    isConnected,
    activeVenues,
    error,
    reconnect,
    clearSnapshots
  };
}