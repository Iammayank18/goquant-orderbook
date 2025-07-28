import React from 'react';
import * as THREE from 'three';
import { OrderbookSnapshot } from '@/types/orderbook';

interface SpreadIndicatorProps {
  snapshots: OrderbookSnapshot[];
}

const SpreadIndicator: React.FC<SpreadIndicatorProps> = ({ snapshots }) => {
  if (snapshots.length === 0) return null;

  const spreadLines = snapshots.map((snapshot, index) => {
    if (!snapshot.bids[0] || !snapshot.asks[0]) return null;

    const bidPrice = snapshot.bids[0].price;
    const askPrice = snapshot.asks[0].price;
    const midPrice = (bidPrice + askPrice) / 2;
    const z = index * 3;

    const bidX = (bidPrice - midPrice) * 0.01;
    const askX = (askPrice - midPrice) * 0.01;

    return (
      <group key={index}>
        {/* Bid line */}
        <mesh position={[bidX, 0, z]}>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshBasicMaterial color="#00ff00" />
        </mesh>
        
        {/* Ask line */}
        <mesh position={[askX, 0, z]}>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshBasicMaterial color="#ff0000" />
        </mesh>
        
        {/* Spread connection - simplified for now */}
      </group>
    );
  }).filter(Boolean);

  return <group>{spreadLines}</group>;
};

export default SpreadIndicator;