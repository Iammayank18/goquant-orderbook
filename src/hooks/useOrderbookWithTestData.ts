import { useState, useEffect } from 'react';
import { OrderbookSnapshot, FilterSettings } from '@/types/orderbook';
import { useOrderbookData } from './useOrderbookData';

export const useOrderbookWithTestData = (symbol: string, settings: FilterSettings) => {
  const { snapshots: liveSnapshots, isConnected, error, clearError } = useOrderbookData(symbol, settings);
  const [testSnapshots, setTestSnapshots] = useState<OrderbookSnapshot[]>([]);

  useEffect(() => {
    // Generate initial test data if no live data
    if (liveSnapshots.length === 0 && testSnapshots.length === 0) {
      const testData: OrderbookSnapshot[] = [];
      
      for (let i = 0; i < 5; i++) {
        const basePrice = 96000;
        const snapshot: OrderbookSnapshot = {
          bids: Array.from({ length: 20 }, (_, j) => ({
            price: basePrice - (j + 1) * 5,
            quantity: Math.random() * 2 + 0.5,
            total: 0
          })).sort((a, b) => b.price - a.price),
          asks: Array.from({ length: 20 }, (_, j) => ({
            price: basePrice + (j + 1) * 5,
            quantity: Math.random() * 2 + 0.5,
            total: 0
          })).sort((a, b) => a.price - b.price),
          timestamp: Date.now() - (4 - i) * 1000,
          venue: 'binance'
        };
        
        // Calculate cumulative totals
        let bidTotal = 0;
        snapshot.bids.forEach(bid => {
          bidTotal += bid.quantity;
          bid.total = bidTotal;
        });
        
        let askTotal = 0;
        snapshot.asks.forEach(ask => {
          askTotal += ask.quantity;
          ask.total = askTotal;
        });
        
        testData.push(snapshot);
      }
      
      console.log('Generated initial test data:', testData);
      setTestSnapshots(testData);
    }
  }, [liveSnapshots.length, testSnapshots.length]);

  // Use live data if available, otherwise use test data
  const snapshots = liveSnapshots.length > 0 ? liveSnapshots : testSnapshots;

  return {
    snapshots,
    isConnected,
    error,
    clearError,
    isTestData: liveSnapshots.length === 0
  };
};