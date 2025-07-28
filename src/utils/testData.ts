import { OrderbookSnapshot, VenueType } from '@/types/orderbook';

export const generateTestSnapshot = (basePrice: number = 96000, venue: VenueType = 'binance'): OrderbookSnapshot => {
  const bids = Array.from({ length: 20 }, (_, i) => {
    const price = basePrice - (i * 10);
    const quantity = Math.random() * 2 + 0.5 + (Math.random() > 0.8 ? Math.random() * 5 : 0);
    return {
      price,
      quantity,
      total: quantity
    };
  });

  const asks = Array.from({ length: 20 }, (_, i) => {
    const price = basePrice + ((i + 1) * 10);
    const quantity = Math.random() * 2 + 0.5 + (Math.random() > 0.8 ? Math.random() * 5 : 0);
    return {
      price,
      quantity,
      total: quantity
    };
  });

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
    venue
  };
};