import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { OrderbookSnapshot } from '@/types/orderbook';
import { getVenueColor } from '@/utils/venueConfig';

interface VolumeProfileEnhancedProps {
  snapshots: OrderbookSnapshot[];
  visible: boolean;
  priceBins?: number;
  showValueArea?: boolean;
  opacity?: number;
}

interface VolumeNode {
  price: number;
  bidVolume: number;
  askVolume: number;
  totalVolume: number;
  venues: Set<string>;
}

const VolumeProfileEnhanced: React.FC<VolumeProfileEnhancedProps> = ({
  snapshots,
  visible,
  priceBins = 50,
  showValueArea = true,
  opacity = 0.7
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
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
        totalVolume: 0,
        venues: new Set()
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
          node.venues.add(snapshot.venue);
        }
      });
      
      snapshot.asks.forEach(ask => {
        const binIndex = Math.floor((ask.price - minPrice) / binSize);
        const node = volumeMap.get(binIndex);
        if (node) {
          node.askVolume += ask.quantity;
          node.totalVolume += ask.quantity;
          node.venues.add(snapshot.venue);
        }
      });
    });
    
    return Array.from(volumeMap.values())
      .filter(node => node.totalVolume > 0)
      .sort((a, b) => a.price - b.price);
  }, [snapshots, priceBins]);
  
  const { valueAreaHigh, valueAreaLow, poc } = useMemo(() => {
    if (volumeProfile.length === 0) {
      return { valueAreaHigh: 0, valueAreaLow: 0, poc: 0 };
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
      poc: pocNode.price
    };
  }, [volumeProfile]);
  
  if (!visible || volumeProfile.length === 0) return null;
  
  const midPrice = snapshots[snapshots.length - 1]?.bids[0]?.price || 0;
  const maxVolume = Math.max(...volumeProfile.map(node => node.totalVolume));
  
  return (
    <group>
      {/* Volume bars */}
      {volumeProfile.map((node, index) => {
        const priceOffset = (node.price - midPrice) / midPrice * 100;
        const barLength = (node.totalVolume / maxVolume) * 30;
        const bidRatio = node.bidVolume / node.totalVolume;
        
        return (
          <group key={index}>
            {/* Bid volume */}
            <mesh position={[priceOffset, 0, -barLength * bidRatio / 2 - 20]}>
              <boxGeometry args={[0.5, 1, barLength * bidRatio]} />
              <meshStandardMaterial
                color="#00ff88"
                transparent
                opacity={opacity}
                emissive="#00ff88"
                emissiveIntensity={0.2}
              />
            </mesh>
            
            {/* Ask volume */}
            <mesh position={[priceOffset, 0, -barLength * (1 - bidRatio) / 2 - 20 - barLength * bidRatio]}>
              <boxGeometry args={[0.5, 1, barLength * (1 - bidRatio)]} />
              <meshStandardMaterial
                color="#ff4444"
                transparent
                opacity={opacity}
                emissive="#ff4444"
                emissiveIntensity={0.2}
              />
            </mesh>
            
            {/* Price label for significant levels */}
            {node.totalVolume > maxVolume * 0.5 && (
              <Text
                position={[priceOffset, 2, -20]}
                fontSize={0.6}
                color="#ffffff"
                anchorX="center"
              >
                ${node.price.toFixed(0)}
              </Text>
            )}
          </group>
        );
      })}
      
      {/* Value area visualization */}
      {showValueArea && (
        <group>
          {/* Value area box */}
          <mesh position={[0, 0, -35]}>
            <boxGeometry 
              args={[
                Math.abs(valueAreaHigh - valueAreaLow) / midPrice * 100,
                0.2,
                30
              ]} 
            />
            <meshStandardMaterial
              color="#6666ff"
              transparent
              opacity={0.2}
            />
          </mesh>
          
          {/* Point of Control line */}
          <mesh position={[(poc - midPrice) / midPrice * 100, 0, -35]}>
            <boxGeometry args={[0.2, 5, 30]} />
            <meshStandardMaterial
              color="#ffff00"
              emissive="#ffff00"
              emissiveIntensity={0.5}
            />
          </mesh>
          
          {/* Labels */}
          <Text
            position={[(poc - midPrice) / midPrice * 100, 6, -35]}
            fontSize={0.8}
            color="#ffff00"
            anchorX="center"
          >
            POC: ${poc.toFixed(0)}
          </Text>
          
          <Text
            position={[0, -3, -35]}
            fontSize={0.6}
            color="#6666ff"
            anchorX="center"
          >
            Value Area: ${valueAreaLow.toFixed(0)} - ${valueAreaHigh.toFixed(0)}
          </Text>
        </group>
      )}
      
      {/* Volume profile axis label */}
      <Text
        position={[0, -5, -50]}
        fontSize={1}
        color="#ffffff"
        anchorX="center"
      >
        Volume Profile
      </Text>
    </group>
  );
};

export default VolumeProfileEnhanced;