import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { OrderbookSnapshot } from '@/types/orderbook';
import { generateTestSnapshot } from '@/utils/testData';

const SimpleOrderbook3D = dynamic(() => import('@/components/orderbook/SimpleOrderbook3D'), {
  ssr: false
});

const SimpleTestPage: React.FC = () => {
  const [snapshot, setSnapshot] = useState<OrderbookSnapshot | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Generate test snapshot
    const testSnapshot = generateTestSnapshot(96000);
    console.log('Generated test snapshot:', testSnapshot);
    setSnapshot(testSnapshot);
  }, []);

  if (!mounted) {
    return <div className="h-screen bg-black flex items-center justify-center">
      <div className="text-white">Loading...</div>
    </div>;
  }

  return (
    <div className="h-screen bg-black">
      <div className="absolute top-4 left-4 z-10 bg-gray-900 rounded-lg px-4 py-2 border border-gray-800">
        <h1 className="text-white text-xl font-bold">Simple 3D Test</h1>
        <div className="text-gray-400 text-sm mt-1">
          {snapshot ? `Bids: ${snapshot.bids.length}, Asks: ${snapshot.asks.length}` : 'No data'}
        </div>
      </div>
      
      <SimpleOrderbook3D snapshot={snapshot} />
    </div>
  );
};

export default SimpleTestPage;