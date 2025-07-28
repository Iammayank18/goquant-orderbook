import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { OrderbookSnapshot } from '@/types/orderbook';
import { generateTestSnapshot } from '@/utils/testData';

const OrderbookVisualization = dynamic(() => import('@/components/orderbook/OrderbookVisualization'), {
  ssr: false
});

const OrderbookTestPage: React.FC = () => {
  const [snapshots, setSnapshots] = useState<OrderbookSnapshot[]>([]);

  useEffect(() => {
    // Generate initial test data
    const testData: OrderbookSnapshot[] = [];
    for (let i = 0; i < 20; i++) {
      const snapshot = generateTestSnapshot(96000 + (Math.random() * 1000 - 500));
      snapshot.timestamp = Date.now() - (19 - i) * 1000;
      testData.push(snapshot);
    }
    setSnapshots(testData);

    // Add new snapshot every second
    const interval = setInterval(() => {
      setSnapshots(prev => {
        const newSnapshot = generateTestSnapshot(96000 + (Math.random() * 1000 - 500));
        return [...prev.slice(-19), newSnapshot];
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const midPrice = snapshots.length > 0 
    ? (snapshots[snapshots.length - 1].bids[0]?.price + snapshots[snapshots.length - 1].asks[0]?.price) / 2 || 0
    : 0;

  return (
    <div className="h-screen bg-black">
      <div className="absolute top-4 left-4 z-10 bg-gray-900 rounded-lg px-4 py-2 border border-gray-800">
        <h1 className="text-white text-xl font-bold">Test Mode - Static Data</h1>
        <div className="text-gray-400 text-sm mt-1">
          Snapshots: {snapshots.length} | Mid Price: ${midPrice.toFixed(2)}
        </div>
      </div>
      
      <OrderbookVisualization
        snapshots={snapshots}
        pressureZones={[]}
        autoRotate={true}
        showGrid={true}
        showPressureZones={false}
        showVolumeProfile={false}
        midPrice={midPrice}
      />
    </div>
  );
};

export default OrderbookTestPage;