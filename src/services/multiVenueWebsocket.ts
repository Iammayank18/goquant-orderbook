import { OrderbookSnapshot, OrderbookUpdate, VenueType, OrderLevel } from '@/types/orderbook';
import { VENUE_CONFIGS } from '@/utils/venueConfig';

interface WebSocketHandlers {
  onSnapshot: (snapshot: OrderbookSnapshot) => void;
  onError: (error: string) => void;
  onConnect: () => void;
  onDisconnect: () => void;
}

export class MultiVenueWebSocketService {
  private connections: Map<VenueType, WebSocket> = new Map();
  private handlers: WebSocketHandlers;
  private symbol: string;
  private reconnectTimeouts: Map<VenueType, NodeJS.Timeout> = new Map();
  private isActive: boolean = false;

  constructor(symbol: string, handlers: WebSocketHandlers) {
    this.symbol = symbol;
    this.handlers = handlers;
  }

  connect(venues: VenueType[]) {
    this.isActive = true;
    venues.forEach(venue => this.connectToVenue(venue));
  }

  private connectToVenue(venue: VenueType) {
    const config = VENUE_CONFIGS[venue];
    if (!config || !config.enabled) return;

    try {
      let wsUrl = '';
      let subscribeMessage = {};

      switch (venue) {
        case 'binance':
          wsUrl = `${config.wsUrl}/${this.symbol.toLowerCase()}@depth20@100ms`;
          break;
        
        case 'okx':
          wsUrl = config.wsUrl;
          subscribeMessage = {
            op: 'subscribe',
            args: [{
              channel: 'books5',
              instId: this.formatSymbolForOKX(this.symbol)
            }]
          };
          break;
        
        case 'bybit':
          wsUrl = config.wsUrl;
          subscribeMessage = {
            op: 'subscribe',
            args: [`orderbook.50.${this.formatSymbolForBybit(this.symbol)}`]
          };
          break;
        
        case 'deribit':
          wsUrl = config.wsUrl;
          subscribeMessage = {
            jsonrpc: '2.0',
            method: 'public/subscribe',
            params: {
              channels: [`book.${this.formatSymbolForDeribit(this.symbol)}.100ms`]
            }
          };
          break;
      }

      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log(`Connected to ${venue}`);
        this.handlers.onConnect();
        
        if (Object.keys(subscribeMessage).length > 0) {
          ws.send(JSON.stringify(subscribeMessage));
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const snapshot = this.parseVenueData(venue, data);
          
          if (snapshot) {
            this.handlers.onSnapshot(snapshot);
          }
        } catch (error) {
          console.error(`Error parsing ${venue} data:`, error);
        }
      };

      ws.onerror = (error) => {
        console.error(`WebSocket error for ${venue}:`, error);
        this.handlers.onError(`${venue} connection error`);
      };

      ws.onclose = () => {
        console.log(`Disconnected from ${venue}`);
        this.handlers.onDisconnect();
        
        if (this.isActive) {
          this.scheduleReconnect(venue);
        }
      };

      this.connections.set(venue, ws);
    } catch (error) {
      console.error(`Failed to connect to ${venue}:`, error);
      this.handlers.onError(`Failed to connect to ${venue}`);
    }
  }

  private parseVenueData(venue: VenueType, data: any): OrderbookSnapshot | null {
    let bids: OrderLevel[] = [];
    let asks: OrderLevel[] = [];
    let timestamp = Date.now();

    try {
      switch (venue) {
        case 'binance':
          if (data.bids && data.asks) {
            bids = data.bids.map(([price, quantity]: [string, string]) => ({
              price: parseFloat(price),
              quantity: parseFloat(quantity),
              total: 0
            }));
            asks = data.asks.map(([price, quantity]: [string, string]) => ({
              price: parseFloat(price),
              quantity: parseFloat(quantity),
              total: 0
            }));
          }
          break;

        case 'okx':
          if (data.data && data.data[0]) {
            const book = data.data[0];
            bids = book.bids.map(([price, quantity, , ]: [string, string, string, string]) => ({
              price: parseFloat(price),
              quantity: parseFloat(quantity),
              total: 0
            }));
            asks = book.asks.map(([price, quantity, , ]: [string, string, string, string]) => ({
              price: parseFloat(price),
              quantity: parseFloat(quantity),
              total: 0
            }));
            timestamp = parseInt(book.ts);
          }
          break;

        case 'bybit':
          if (data.data && data.data.b && data.data.a) {
            bids = data.data.b.map(([price, size]: [string, string]) => ({
              price: parseFloat(price),
              quantity: parseFloat(size),
              total: 0
            }));
            asks = data.data.a.map(([price, size]: [string, string]) => ({
              price: parseFloat(price),
              quantity: parseFloat(size),
              total: 0
            }));
            timestamp = data.data.t;
          }
          break;

        case 'deribit':
          if (data.params && data.params.data) {
            const book = data.params.data;
            bids = book.bids.map(([price, quantity]: [number, number]) => ({
              price,
              quantity,
              total: 0
            }));
            asks = book.asks.map(([price, quantity]: [number, number]) => ({
              price,
              quantity,
              total: 0
            }));
            timestamp = book.timestamp;
          }
          break;
      }

      if (bids.length > 0 && asks.length > 0) {
        // Calculate cumulative totals
        let bidTotal = 0;
        let askTotal = 0;
        
        bids = bids.map(bid => {
          bidTotal += bid.quantity;
          return { ...bid, total: bidTotal };
        });
        
        asks = asks.map(ask => {
          askTotal += ask.quantity;
          return { ...ask, total: askTotal };
        });

        return {
          bids,
          asks,
          timestamp,
          venue
        };
      }
    } catch (error) {
      console.error(`Error parsing ${venue} orderbook:`, error);
    }

    return null;
  }

  private formatSymbolForOKX(symbol: string): string {
    // Convert BTCUSDT to BTC-USDT
    return symbol.replace(/^(\w{3})(\w+)$/, '$1-$2');
  }

  private formatSymbolForBybit(symbol: string): string {
    // Bybit uses the same format as input
    return symbol;
  }

  private formatSymbolForDeribit(symbol: string): string {
    // Convert BTCUSDT to BTC-PERPETUAL
    if (symbol.includes('BTC')) return 'BTC-PERPETUAL';
    if (symbol.includes('ETH')) return 'ETH-PERPETUAL';
    return symbol;
  }

  private scheduleReconnect(venue: VenueType) {
    // Clear existing timeout if any
    const existingTimeout = this.reconnectTimeouts.get(venue);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Schedule reconnection after 5 seconds
    const timeout = setTimeout(() => {
      console.log(`Attempting to reconnect to ${venue}...`);
      this.connectToVenue(venue);
    }, 5000);

    this.reconnectTimeouts.set(venue, timeout);
  }

  disconnect() {
    this.isActive = false;
    
    // Clear all reconnect timeouts
    this.reconnectTimeouts.forEach(timeout => clearTimeout(timeout));
    this.reconnectTimeouts.clear();
    
    // Close all connections
    this.connections.forEach((ws, venue) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    });
    this.connections.clear();
  }

  isConnected(venue: VenueType): boolean {
    const ws = this.connections.get(venue);
    return ws ? ws.readyState === WebSocket.OPEN : false;
  }

  getActiveVenues(): VenueType[] {
    return Array.from(this.connections.keys()).filter(venue => this.isConnected(venue));
  }
}