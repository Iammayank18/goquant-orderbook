import { OrderbookUpdate, VenueType, OrderLevel, OrderbookSnapshot } from '@/types/orderbook';
import { BinanceAPI } from './binanceApi';

export class OrderbookWebSocket {
  private ws: WebSocket | null = null;
  private symbol: string;
  private venue: VenueType;
  private onUpdate: (snapshot: OrderbookSnapshot) => void;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private orderbook: { bids: Map<number, number>; asks: Map<number, number> } = {
    bids: new Map(),
    asks: new Map()
  };

  constructor(
    symbol: string,
    venue: VenueType,
    onUpdate: (snapshot: OrderbookSnapshot) => void
  ) {
    this.symbol = symbol;
    this.venue = venue;
    this.onUpdate = onUpdate;
  }

  connect() {
    const wsUrls: Record<VenueType, string> = {
      binance: `wss://stream.binance.com:9443/ws/${this.symbol.toLowerCase()}@depth@100ms`,
      okx: `wss://ws.okx.com:8443/ws/v5/public`,
      bybit: `wss://stream.bybit.com/v5/public/linear`,
      deribit: `wss://www.deribit.com/ws/api/v2`
    };

    try {
      this.ws = new WebSocket(wsUrls[this.venue]);
      
      this.ws.onopen = async () => {
        console.log(`Connected to ${this.venue} WebSocket`);
        
        // Fetch initial snapshot for Binance
        if (this.venue === 'binance') {
          const snapshot = await BinanceAPI.fetchOrderbookSnapshot(this.symbol);
          if (snapshot) {
            this.updateOrderbookFromSnapshot(snapshot);
            this.emitSnapshot();
          }
        }
        
        this.subscribeToOrderbook();
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(JSON.parse(event.data));
      };

      this.ws.onerror = (error) => {
        console.error(`WebSocket error for ${this.venue}:`, error);
      };

      this.ws.onclose = () => {
        console.log(`WebSocket closed for ${this.venue}`);
        this.reconnect();
      };
    } catch (error) {
      console.error(`Failed to connect to ${this.venue}:`, error);
      this.reconnect();
    }
  }

  private subscribeToOrderbook() {
    if (this.venue === 'okx') {
      this.ws?.send(JSON.stringify({
        op: 'subscribe',
        args: [{
          channel: 'books5',
          instId: this.symbol
        }]
      }));
    } else if (this.venue === 'bybit') {
      this.ws?.send(JSON.stringify({
        op: 'subscribe',
        args: [`orderbook.50.${this.symbol}`]
      }));
    } else if (this.venue === 'deribit') {
      this.ws?.send(JSON.stringify({
        jsonrpc: '2.0',
        method: 'public/subscribe',
        id: 1,
        params: {
          channels: [`book.${this.symbol}.100ms`]
        }
      }));
    }
  }

  private handleMessage(data: any) {
    let update: OrderbookUpdate | null = null;

    switch (this.venue) {
      case 'binance':
        update = this.parseBinanceUpdate(data);
        break;
      case 'okx':
        update = this.parseOKXUpdate(data);
        break;
      case 'bybit':
        update = this.parseBybitUpdate(data);
        break;
      case 'deribit':
        update = this.parseDeribitUpdate(data);
        break;
    }

    if (update) {
      this.updateOrderbook(update);
      this.emitSnapshot();
    }
  }

  private parseBinanceUpdate(data: any): OrderbookUpdate | null {
    if (data.e === 'depthUpdate') {
      return {
        bids: data.b || [],
        asks: data.a || [],
        U: data.U,
        u: data.u
      };
    }
    return null;
  }

  private parseOKXUpdate(data: any): OrderbookUpdate | null {
    if (data.arg?.channel === 'books5' && data.data?.[0]) {
      const bookData = data.data[0];
      return {
        bids: bookData.bids || [],
        asks: bookData.asks || []
      };
    }
    return null;
  }

  private parseBybitUpdate(data: any): OrderbookUpdate | null {
    if (data.topic?.includes('orderbook') && data.data) {
      return {
        bids: data.data.b || [],
        asks: data.data.a || []
      };
    }
    return null;
  }

  private parseDeribitUpdate(data: any): OrderbookUpdate | null {
    if (data.params?.channel?.includes('book') && data.params?.data) {
      const bookData = data.params.data;
      return {
        bids: bookData.bids || [],
        asks: bookData.asks || []
      };
    }
    return null;
  }

  private updateOrderbook(update: OrderbookUpdate) {
    update.bids.forEach(([price, quantity]) => {
      const p = parseFloat(price);
      const q = parseFloat(quantity);
      if (q === 0) {
        this.orderbook.bids.delete(p);
      } else {
        this.orderbook.bids.set(p, q);
      }
    });

    update.asks.forEach(([price, quantity]) => {
      const p = parseFloat(price);
      const q = parseFloat(quantity);
      if (q === 0) {
        this.orderbook.asks.delete(p);
      } else {
        this.orderbook.asks.set(p, q);
      }
    });
  }

  private updateOrderbookFromSnapshot(snapshot: OrderbookSnapshot) {
    this.orderbook.bids.clear();
    this.orderbook.asks.clear();
    
    snapshot.bids.forEach(level => {
      this.orderbook.bids.set(level.price, level.quantity);
    });
    
    snapshot.asks.forEach(level => {
      this.orderbook.asks.set(level.price, level.quantity);
    });
  }

  private emitSnapshot() {
    const bids: OrderLevel[] = Array.from(this.orderbook.bids.entries())
      .sort((a, b) => b[0] - a[0])
      .slice(0, 50)
      .map(([price, quantity], i) => ({
        price,
        quantity,
        total: Array.from(this.orderbook.bids.entries())
          .filter(([p]) => p >= price)
          .reduce((sum, [_, q]) => sum + q, 0)
      }));

    const asks: OrderLevel[] = Array.from(this.orderbook.asks.entries())
      .sort((a, b) => a[0] - b[0])
      .slice(0, 50)
      .map(([price, quantity], i) => ({
        price,
        quantity,
        total: Array.from(this.orderbook.asks.entries())
          .filter(([p]) => p <= price)
          .reduce((sum, [_, q]) => sum + q, 0)
      }));

    const snapshot: OrderbookSnapshot = {
      bids,
      asks,
      timestamp: Date.now(),
      venue: this.venue
    };

    this.onUpdate(snapshot);
  }

  private reconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectTimeout = setTimeout(() => {
      console.log(`Reconnecting to ${this.venue}...`);
      this.connect();
    }, 5000);
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}