import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { OrderbookSnapshot } from '@/types/orderbook';

const SimpleVisualization = dynamic(() => import('@/components/orderbook/SimpleVisualization'), {
  ssr: false
});

const OrderbookDebugPage: React.FC = () => {
  const [snapshots, setSnapshots] = useState<OrderbookSnapshot[]>([]);
  const [dataInfo, setDataInfo] = useState<string>('Loading...');

  useEffect(() => {
    // Generate test data with realistic BTC prices
    const testSnapshots: OrderbookSnapshot[] = [];
    const basePrice = 96000;
    
    for (let t = 0; t < 5; t++) {
      const snapshot: OrderbookSnapshot = {
        bids: [],
        asks: [],
        timestamp: Date.now() - (4 - t) * 1000,
        venue: 'binance'
      };
      
      // Generate bids (prices below mid, decreasing)
      for (let i = 0; i < 10; i++) {
        snapshot.bids.push({
          price: basePrice - (i + 1) * 10,
          quantity: Math.random() * 2 + 0.5,
          total: 0
        });
      }
      
      // Generate asks (prices above mid, increasing)
      for (let i = 0; i < 10; i++) {
        snapshot.asks.push({
          price: basePrice + (i + 1) * 10,
          quantity: Math.random() * 2 + 0.5,
          total: 0
        });
      }
      
      testSnapshots.push(snapshot);
    }
    
    setSnapshots(testSnapshots);
    setDataInfo(`Generated ${testSnapshots.length} snapshots`);
    
    // Log data for debugging
    console.log('Test snapshots:', testSnapshots);
  }, []);

  return (
    <div className="h-screen bg-black text-white">
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-2">Orderbook Debug View</h1>
        <div className="text-sm text-gray-400">
          <div>{dataInfo}</div>
          <div>First bid: {snapshots[0]?.bids[0]?.price || 'N/A'}</div>
          <div>First ask: {snapshots[0]?.asks[0]?.price || 'N/A'}</div>
        </div>
      </div>
      
      <div className="h-[calc(100vh-120px)]">
        <SimpleVisualization snapshots={snapshots} />
      </div>
    </div>
  );
};

export default OrderbookDebugPage;