import axios from 'axios';
import { OrderLevel, OrderbookSnapshot, VenueType } from '@/types/orderbook';

export class BinanceAPI {
  private static readonly BASE_URL = process.env.NODE_ENV === 'development' 
    ? '/api/binance-proxy' 
    : 'https://api.binance.com/api/v3';

  static async fetchOrderbookSnapshot(symbol: string, limit: number = 100): Promise<OrderbookSnapshot | null> {
    try {
      const url = process.env.NODE_ENV === 'development' 
        ? this.BASE_URL 
        : `${this.BASE_URL}/depth`;
      
      const response = await axios.get(url, {
        params: {
          symbol: symbol.toUpperCase(),
          limit
        }
      });

      const data = response.data;
      
      const bids: OrderLevel[] = data.bids.map(([price, quantity]: [string, string]) => ({
        price: parseFloat(price),
        quantity: parseFloat(quantity),
        total: 0
      }));

      const asks: OrderLevel[] = data.asks.map(([price, quantity]: [string, string]) => ({
        price: parseFloat(price),
        quantity: parseFloat(quantity),
        total: 0
      }));

      // Calculate cumulative totals
      let bidTotal = 0;
      bids.forEach(bid => {
        bidTotal += bid.quantity;
        bid.total = bidTotal;
      });

      let askTotal = 0;
      asks.forEach(ask => {
        askTotal += ask.quantity;
        ask.total = askTotal;
      });

      return {
        bids,
        asks,
        timestamp: Date.now(),
        venue: 'binance' as VenueType
      };
    } catch (error) {
      console.error('Failed to fetch orderbook snapshot:', error);
      return null;
    }
  }
}