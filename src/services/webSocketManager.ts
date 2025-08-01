import { BinanceWebSocketService } from './binanceWebSocket';
import { OrderbookSnapshot } from '@/types/orderbook';

class WebSocketManager {
  private static instance: WebSocketManager;
  private connections: Map<string, BinanceWebSocketService> = new Map();
  private subscribers: Map<string, Set<(snapshot: OrderbookSnapshot) => void>> = new Map();
  
  private constructor() {}
  
  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }
  
  subscribe(
    symbol: string, 
    callback: (snapshot: OrderbookSnapshot) => void
  ): () => void {
    // Get or create subscriber set for this symbol
    if (!this.subscribers.has(symbol)) {
      this.subscribers.set(symbol, new Set());
    }
    this.subscribers.get(symbol)!.add(callback);
    
    // Get or create connection for this symbol
    if (!this.connections.has(symbol)) {
      const ws = new BinanceWebSocketService(symbol, (snapshot) => {
        // Distribute snapshot to all subscribers
        const subs = this.subscribers.get(symbol);
        if (subs) {
          subs.forEach(cb => cb(snapshot));
        }
      });
      
      this.connections.set(symbol, ws);
      ws.connect();
    }
    
    // Return unsubscribe function
    return () => {
      const subs = this.subscribers.get(symbol);
      if (subs) {
        subs.delete(callback);
        
        // If no more subscribers, disconnect and cleanup
        if (subs.size === 0) {
          const ws = this.connections.get(symbol);
          if (ws) {
            ws.disconnect();
            this.connections.delete(symbol);
          }
          this.subscribers.delete(symbol);
        }
      }
    };
  }
  
  getConnection(symbol: string): BinanceWebSocketService | undefined {
    return this.connections.get(symbol);
  }
  
  disconnectAll(): void {
    this.connections.forEach(ws => ws.disconnect());
    this.connections.clear();
    this.subscribers.clear();
  }
}

export default WebSocketManager.getInstance();