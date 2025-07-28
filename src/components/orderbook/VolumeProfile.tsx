import React, { useMemo } from 'react';
import * as THREE from 'three';
import { OrderbookSnapshot } from '@/types/orderbook';

interface VolumeProfileProps {
  snapshots: OrderbookSnapshot[];
  visible: boolean;
}

const VolumeProfile: React.FC<VolumeProfileProps> = ({ snapshots, visible }) => {
  const volumeData = useMemo(() => {
    if (!visible || snapshots.length === 0) return [];

    // Aggregate volume by price level
    const volumeByPrice = new Map<number, number>();
    
    snapshots.forEach(snapshot => {
      snapshot.bids.forEach(bid => {
        const priceLevel = Math.round(bid.price / 10) * 10; // Round to nearest 10
        volumeByPrice.set(priceLevel, (volumeByPrice.get(priceLevel) || 0) + bid.quantity);
      });
      
      snapshot.asks.forEach(ask => {
        const priceLevel = Math.round(ask.price / 10) * 10;
        volumeByPrice.set(priceLevel, (volumeByPrice.get(priceLevel) || 0) + ask.quantity);
      });
    });

    return Array.from(volumeByPrice.entries()).map(([price, volume]) => ({
      price,
      volume,
      height: Math.log(volume + 1) * 2
    }));
  }, [snapshots, visible]);

  if (!visible || volumeData.length === 0) return null;

  return (
    <group position={[0, 0, -5]}>
      {volumeData.map((data, index) => {
        const x = (data.price - 96000) * 0.01;
        return (
          <mesh key={index} position={[x, data.height / 2, 0]}>
            <boxGeometry args={[0.5, data.height, 20]} />
            <meshStandardMaterial 
              color="#9333ea" 
              transparent 
              opacity={0.3}
              emissive="#9333ea"
              emissiveIntensity={0.1}
            />
          </mesh>
        );
      })}
    </group>
  );
};

export default VolumeProfile;