import { OrderbookSnapshot, OrderLevel, VenueType } from "@/types/orderbook";

interface BinanceDepthUpdate {
  e: string; // Event type
  E: number; // Event time
  s: string; // Symbol
  U: number; // First update ID in event
  u: number; // Final update ID in event
  b: [string, string][]; // Bids [price, quantity]
  a: [string, string][]; // Asks [price, quantity]
}

interface BinanceDepthSnapshot {
  lastUpdateId: number;
  bids: [string, string][];
  asks: [string, string][];
}

export class BinanceWebSocketService {
  private ws: WebSocket | null = null;
  private symbol: string;
  private onSnapshot: (snapshot: OrderbookSnapshot) => void;
  private orderbook: {
    bids: Map<number, number>;
    asks: Map<number, number>;
  } = {
    bids: new Map(),
    asks: new Map(),
  };
  private lastUpdateId: number = 0;
  private snapshotReceived: boolean = false;
  private pendingUpdates: BinanceDepthUpdate[] = [];
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;

  constructor(
    symbol: string,
    onSnapshot: (snapshot: OrderbookSnapshot) => void
  ) {
    this.symbol = symbol.toLowerCase();
    this.onSnapshot = onSnapshot;
  }

  async connect(): Promise<void> {
    try {
      // First, fetch the initial orderbook snapshot
      await this.fetchInitialSnapshot();

      // Then connect to WebSocket for real-time updates
      this.connectWebSocket();
    } catch {
      this.scheduleReconnect();
    }
  }

  private async fetchInitialSnapshot(): Promise<void> {
    try {
      const url = `https://api.binance.com/api/v3/depth?symbol=${this.symbol.toUpperCase()}&limit=100`;
      console.log("BinanceWebSocket: Fetching initial snapshot from", url);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: BinanceDepthSnapshot = await response.json();
      console.log("BinanceWebSocket: Received snapshot", {
        bidsCount: data.bids.length,
        asksCount: data.asks.length,
        lastUpdateId: data.lastUpdateId
      });

      // Clear existing orderbook
      this.orderbook.bids.clear();
      this.orderbook.asks.clear();

      // Populate orderbook with snapshot data
      data.bids.forEach(([price, quantity]) => {
        this.orderbook.bids.set(parseFloat(price), parseFloat(quantity));
      });

      data.asks.forEach(([price, quantity]) => {
        this.orderbook.asks.set(parseFloat(price), parseFloat(quantity));
      });

      this.lastUpdateId = data.lastUpdateId;
      this.snapshotReceived = true;

      // Send initial snapshot
      this.sendSnapshot();
    } catch (error) {
      console.error("Failed to fetch initial snapshot:", error);
      throw error;
    }
  }

  private connectWebSocket(): void {
    const wsUrl = `wss://stream.binance.com:9443/ws/${this.symbol}@depth@100ms`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log("WebSocket connected to:", wsUrl);
      // Connected to Binance WebSocket
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
    };

    this.ws.onmessage = (event) => {
      try {
        const data: BinanceDepthUpdate = JSON.parse(event.data);
        this.handleDepthUpdate(data);
      } catch {
        // Failed to parse WebSocket message
      }
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      // WebSocket error
    };

    this.ws.onclose = () => {
      // WebSocket connection closed
      this.scheduleReconnect();
    };
  }

  private handleDepthUpdate(update: BinanceDepthUpdate): void {
    console.log("BinanceWebSocket: Received depth update", {
      bidsCount: update.b.length,
      asksCount: update.a.length,
      snapshotReceived: this.snapshotReceived
    });
    
    // If we haven't received the snapshot yet, queue the update
    if (!this.snapshotReceived) {
      this.pendingUpdates.push(update);
      return;
    }

    // Process any pending updates first
    while (this.pendingUpdates.length > 0) {
      const pendingUpdate = this.pendingUpdates.shift()!;
      if (pendingUpdate.u >= this.lastUpdateId + 1) {
        this.processUpdate(pendingUpdate);
      }
    }

    // Process the current update
    if (update.u >= this.lastUpdateId + 1) {
      this.processUpdate(update);
    }
  }

  private processUpdate(update: BinanceDepthUpdate): void {
    // Update bids
    update.b.forEach(([price, quantity]) => {
      const priceNum = parseFloat(price);
      const quantityNum = parseFloat(quantity);

      if (quantityNum === 0) {
        this.orderbook.bids.delete(priceNum);
      } else {
        this.orderbook.bids.set(priceNum, quantityNum);
      }
    });

    // Update asks
    update.a.forEach(([price, quantity]) => {
      const priceNum = parseFloat(price);
      const quantityNum = parseFloat(quantity);

      if (quantityNum === 0) {
        this.orderbook.asks.delete(priceNum);
      } else {
        this.orderbook.asks.set(priceNum, quantityNum);
      }
    });

    this.lastUpdateId = update.u;
    this.sendSnapshot();
  }

  private sendSnapshot(): void {
    console.log("BinanceWebSocket: Sending snapshot", {
      bidsSize: this.orderbook.bids.size,
      asksSize: this.orderbook.asks.size
    });
    
    // Convert maps to sorted arrays
    const bids: OrderLevel[] = Array.from(this.orderbook.bids.entries())
      .sort((a, b) => b[0] - a[0]) // Sort bids descending
      .slice(0, 50) // Take top 50 levels
      .map(([price, quantity]) => {
        return {
          price,
          quantity,
          total: 0, // Will be calculated if needed
        };
      });

    const asks: OrderLevel[] = Array.from(this.orderbook.asks.entries())
      .sort((a, b) => a[0] - b[0]) // Sort asks ascending
      .slice(0, 50) // Take top 50 levels
      .map(([price, quantity]) => {
        return {
          price,
          quantity,
          total: 0, // Will be calculated if needed
        };
      });

    // Calculate cumulative totals
    let bidTotal = 0;
    let askTotal = 0;

    bids.forEach((bid) => {
      bidTotal += bid.quantity;
      bid.total = bidTotal;
    });

    asks.forEach((ask) => {
      askTotal += ask.quantity;
      ask.total = askTotal;
    });

    const snapshot: OrderbookSnapshot = {
      bids,
      asks,
      timestamp: Date.now(),
      venue: "binance" as VenueType,
    };

    this.onSnapshot(snapshot);
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    this.reconnectAttempts++;

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, this.reconnectDelay);

    // Exponential backoff
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.snapshotReceived = false;
    this.pendingUpdates = [];
    this.orderbook.bids.clear();
    this.orderbook.asks.clear();
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}
