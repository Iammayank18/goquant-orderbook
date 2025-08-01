import { useState, useEffect, useCallback, useRef } from "react";
import {
  OrderbookSnapshot,
  FilterSettings,
  VenueType,
} from "@/types/orderbook";
import { BinanceWebSocketService } from "@/services/binanceWebSocket";

interface OrderbookStats {
  totalSnapshots: number;
  snapshotsPerSecond: number;
  bytesProcessed: number;
  messagesProcessed: number;
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
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<OrderbookStats>({
    totalSnapshots: 0,
    snapshotsPerSecond: 0,
    bytesProcessed: 0,
    messagesProcessed: 0,
  });

  const wsServiceRef = useRef<BinanceWebSocketService | null>(null);
  const statsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastStatsUpdate = useRef(Date.now());
  const messagesCount = useRef(0);
  const bytesCount = useRef(0);

  // Handle new snapshot from WebSocket - Memoized to prevent recreating
  const handleSnapshot = useCallback(
    (snapshot: OrderbookSnapshot) => {
      console.log("useOrderbookData: Received snapshot", {
        bids: snapshot.bids?.length,
        asks: snapshot.asks?.length,
        timestamp: snapshot.timestamp
      });
      
      // Update stats
      messagesCount.current++;
      bytesCount.current += JSON.stringify(snapshot).length;

      // Apply filters
      let filteredSnapshot = { ...snapshot };
      const originalBidsCount = snapshot.bids?.length || 0;
      const originalAsksCount = snapshot.asks?.length || 0;

      if (settings.priceRange[0] > 0 || settings.priceRange[1] < 100000) {
        filteredSnapshot.bids = snapshot.bids.filter(
          (bid) =>
            bid.price >= settings.priceRange[0] &&
            bid.price <= settings.priceRange[1]
        );
        filteredSnapshot.asks = snapshot.asks.filter(
          (ask) =>
            ask.price >= settings.priceRange[0] &&
            ask.price <= settings.priceRange[1]
        );
      }

      if (settings.quantityThreshold > 0) {
        filteredSnapshot.bids = filteredSnapshot.bids.filter(
          (bid) => bid.quantity >= settings.quantityThreshold
        );
        filteredSnapshot.asks = filteredSnapshot.asks.filter(
          (ask) => ask.quantity >= settings.quantityThreshold
        );
      }

      // Log filter effects
      console.log("useOrderbookData: Filter effects", {
        priceRange: settings.priceRange,
        quantityThreshold: settings.quantityThreshold,
        originalBids: originalBidsCount,
        filteredBids: filteredSnapshot.bids?.length || 0,
        originalAsks: originalAsksCount,
        filteredAsks: filteredSnapshot.asks?.length || 0,
        bidsRemoved: originalBidsCount - (filteredSnapshot.bids?.length || 0),
        asksRemoved: originalAsksCount - (filteredSnapshot.asks?.length || 0)
      });

      setSnapshots((prev) => {
        const cutoffTime = Date.now() - settings.timeRange * 1000;
        const filtered = [...prev, filteredSnapshot].filter(
          (s) => s.timestamp > cutoffTime
        );
        const result = filtered.slice(-200); // Keep last 200 snapshots max
        console.log("useOrderbookData: Updated snapshots", {
          prevLength: prev.length,
          newLength: result.length,
          cutoffTime: new Date(cutoffTime).toISOString(),
          timeRange: settings.timeRange
        });
        return result;
      });
    },
    [settings.priceRange, settings.quantityThreshold, settings.timeRange]
  );

  // Update stats periodically
  useEffect(() => {
    const updateStats = () => {
      const now = Date.now();
      const timeDiff = (now - lastStatsUpdate.current) / 1000;

      if (timeDiff > 0) {
        const snapshotsPerSecond = messagesCount.current / timeDiff;

        setStats({
          totalSnapshots: snapshots.length,
          snapshotsPerSecond: Math.round(snapshotsPerSecond),
          bytesProcessed: bytesCount.current,
          messagesProcessed: messagesCount.current,
        });

        // Reset counters
        messagesCount.current = 0;
        bytesCount.current = 0;
        lastStatsUpdate.current = now;
      }
    };

    statsIntervalRef.current = setInterval(updateStats, 1000);

    return () => {
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
      }
    };
  }, [snapshots.length]);

  // Store previous venues to check if they actually changed
  const prevVenuesRef = useRef<VenueType[]>([]);

  // Connect to WebSocket with proper dependency management
  useEffect(() => {
    // Check if venues actually changed
    const venuesChanged =
      JSON.stringify(prevVenuesRef.current) !== JSON.stringify(settings.venues);
    if (!venuesChanged) return;

    prevVenuesRef.current = settings.venues;

    // Disconnect existing connection first
    if (wsServiceRef.current) {
      wsServiceRef.current.disconnect();
      wsServiceRef.current = null;
    }

    // Clear snapshots when venues change
    setSnapshots([]);

    // Only connect if Binance is in the selected venues
    if (!settings.venues.includes("binance")) {
      setIsConnected(false);
      setError("Binance not selected in venues");
      return;
    }

    const connectWebSocket = async () => {
      try {
        setError(null);
        setIsConnected(false);

        // Create new WebSocket service
        wsServiceRef.current = new BinanceWebSocketService(
          symbol,
          handleSnapshot
        );

        // Connect
        await wsServiceRef.current.connect();
        setIsConnected(true);
      } catch (err) {
        // Failed to connect
        setError(
          err instanceof Error ? err.message : "Failed to connect to Binance"
        );
        setIsConnected(false);
      }
    };

    connectWebSocket();

    // Cleanup on unmount or when dependencies change
    return () => {
      if (wsServiceRef.current) {
        wsServiceRef.current.disconnect();
        wsServiceRef.current = null;
      }
    };
  }, [symbol, settings.venues]); // Remove handleSnapshot from deps to prevent reconnects

  // Check connection status periodically
  useEffect(() => {
    const checkConnection = setInterval(() => {
      if (wsServiceRef.current) {
        const connected = wsServiceRef.current.isConnected();
        setIsConnected(connected);
        if (!connected && !error) {
          setError("Connection lost");
        }
      }
    }, 1000);

    return () => clearInterval(checkConnection);
  }, [error]);

  const reconnect = useCallback(() => {
    if (wsServiceRef.current) {
      wsServiceRef.current.disconnect();
      wsServiceRef.current.connect();
    }
  }, []);

  return {
    snapshots,
    isConnected,
    activeVenues: settings.venues.filter((v) => v === "binance"), // Only Binance is supported for now
    error,
    reconnect,
    stats,
  };
}
