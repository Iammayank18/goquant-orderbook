import React, { useMemo } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { OrderbookSnapshot } from '@/types/orderbook';

interface VolumeProfileProps {
  snapshots: OrderbookSnapshot[];
  priceBins?: number;
}

interface VolumeNode {
  price: number;
  bidVolume: number;
  askVolume: number;
  totalVolume: number;
}

const VolumeProfile: React.FC<VolumeProfileProps> = ({
  snapshots,
  priceBins = 30
}) => {
  const volumeProfile = useMemo(() => {
    if (snapshots.length === 0) return [];
    
    // Find price range
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    
    snapshots.forEach(snapshot => {
      snapshot.bids.forEach(bid => {
        minPrice = Math.min(minPrice, bid.price);
        maxPrice = Math.max(maxPrice, bid.price);
      });
      snapshot.asks.forEach(ask => {
        minPrice = Math.min(minPrice, ask.price);
        maxPrice = Math.max(maxPrice, ask.price);
      });
    });
    
    if (minPrice === Infinity || maxPrice === -Infinity) return [];
    
    // Create price bins
    const binSize = (maxPrice - minPrice) / priceBins;
    const volumeMap = new Map<number, VolumeNode>();
    
    // Initialize bins
    for (let i = 0; i < priceBins; i++) {
      const binPrice = minPrice + (i + 0.5) * binSize;
      volumeMap.set(i, {
        price: binPrice,
        bidVolume: 0,
        askVolume: 0,
        totalVolume: 0
      });
    }
    
    // Accumulate volume
    snapshots.forEach(snapshot => {
      snapshot.bids.forEach(bid => {
        const binIndex = Math.floor((bid.price - minPrice) / binSize);
        const node = volumeMap.get(binIndex);
        if (node) {
          node.bidVolume += bid.quantity;
          node.totalVolume += bid.quantity;
        }
      });
      
      snapshot.asks.forEach(ask => {
        const binIndex = Math.floor((ask.price - minPrice) / binSize);
        const node = volumeMap.get(binIndex);
        if (node) {
          node.askVolume += ask.quantity;
          node.totalVolume += ask.quantity;
        }
      });
    });
    
    return Array.from(volumeMap.values())
      .filter(node => node.totalVolume > 0)
      .sort((a, b) => a.price - b.price);
  }, [snapshots, priceBins]);
  
  const { valueAreaHigh, valueAreaLow, poc } = useMemo(() => {
    if (volumeProfile.length === 0) {
      return { valueAreaHigh: 0, valueAreaLow: 0, poc: null };
    }
    
    // Find Point of Control (highest volume price)
    let pocNode = volumeProfile[0];
    volumeProfile.forEach(node => {
      if (node.totalVolume > pocNode.totalVolume) {
        pocNode = node;
      }
    });
    
    // Calculate value area (70% of volume)
    const totalVolume = volumeProfile.reduce((sum, node) => sum + node.totalVolume, 0);
    const targetVolume = totalVolume * 0.7;
    
    let accumulatedVolume = pocNode.totalVolume;
    let lowIndex = volumeProfile.indexOf(pocNode);
    let highIndex = lowIndex;
    
    while (accumulatedVolume < targetVolume && (lowIndex > 0 || highIndex < volumeProfile.length - 1)) {
      const lowVolume = lowIndex > 0 ? volumeProfile[lowIndex - 1].totalVolume : 0;
      const highVolume = highIndex < volumeProfile.length - 1 ? volumeProfile[highIndex + 1].totalVolume : 0;
      
      if (lowVolume >= highVolume && lowIndex > 0) {
        lowIndex--;
        accumulatedVolume += lowVolume;
      } else if (highIndex < volumeProfile.length - 1) {
        highIndex++;
        accumulatedVolume += highVolume;
      }
    }
    
    return {
      valueAreaHigh: volumeProfile[highIndex].price,
      valueAreaLow: volumeProfile[lowIndex].price,
      poc: pocNode
    };
  }, [volumeProfile]);
  
  if (volumeProfile.length === 0) return null;
  
  const midPrice = snapshots[snapshots.length - 1]?.bids[0]?.price || 0;
  const maxVolume = Math.max(...volumeProfile.map(node => node.totalVolume));
  
  return (
    <group position={[0, 0, -30]}>
      {/* Volume bars */}
      {volumeProfile.map((node, index) => {
        const x = (node.price - midPrice) * 0.02;
        const barLength = (node.totalVolume / maxVolume) * 20;
        const bidRatio = node.bidVolume / node.totalVolume;
        
        return (
          <group key={index}>
            {/* Bid volume */}
            <mesh position={[x, 0, -barLength * bidRatio / 2]}>
              <boxGeometry args={[0.3, 1, barLength * bidRatio]} />
              <meshStandardMaterial
                color={0x00ff88}
                transparent
                opacity={0.7}
                emissive={0x00ff88}
                emissiveIntensity={0.1}
              />
            </mesh>
            
            {/* Ask volume */}
            <mesh position={[x, 0, -barLength * bidRatio - barLength * (1 - bidRatio) / 2]}>
              <boxGeometry args={[0.3, 1, barLength * (1 - bidRatio)]} />
              <meshStandardMaterial
                color={0xff4444}
                transparent
                opacity={0.7}
                emissive={0xff4444}
                emissiveIntensity={0.1}
              />
            </mesh>
          </group>
        );
      })}
      
      {/* Value area */}
      {poc && (
        <>
          {/* Value area box */}
          <mesh position={[0, 0, -10]}>
            <boxGeometry 
              args={[
                Math.abs(valueAreaHigh - valueAreaLow) * 0.02,
                0.1,
                20
              ]} 
            />
            <meshStandardMaterial
              color={0x6666ff}
              transparent
              opacity={0.2}
            />
          </mesh>
          
          {/* POC line */}
          <mesh position={[(poc.price - midPrice) * 0.02, 0, -10]}>
            <boxGeometry args={[0.1, 3, 20]} />
            <meshStandardMaterial
              color={0xffff00}
              emissive={0xffff00}
              emissiveIntensity={0.3}
            />
          </mesh>
          
          {/* Label */}
          <Text
            position={[(poc.price - midPrice) * 0.02, 4, -10]}
            fontSize={0.6}
            color="#ffffff"
            anchorX="center"
          >
            POC: ${poc.price.toFixed(0)}
          </Text>
        </>
      )}
      
      {/* Volume profile label */}
      <Text
        position={[0, -2, -25]}
        fontSize={0.8}
        color="#ffffff"
        anchorX="center"
      >
        Volume Profile
      </Text>
    </group>
  );
};

export default VolumeProfile;