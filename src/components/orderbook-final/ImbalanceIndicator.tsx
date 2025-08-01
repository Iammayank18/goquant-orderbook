import React, { useMemo } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { OrderbookSnapshot } from '@/types/orderbook';

interface ImbalanceIndicatorProps {
  snapshots: OrderbookSnapshot[];
}

const ImbalanceIndicator: React.FC<ImbalanceIndicatorProps> = ({
  snapshots
}) => {
  const imbalanceData = useMemo(() => {
    if (snapshots.length === 0) return { ratio: 0, bidVolume: 0, askVolume: 0, trend: 'neutral' };
    
    // Calculate imbalance for recent snapshots
    const recentSnapshots = snapshots.slice(-10);
    let totalBidVolume = 0;
    let totalAskVolume = 0;
    
    recentSnapshots.forEach(snapshot => {
      const bidVolume = snapshot.bids.slice(0, 10).reduce((sum, bid) => sum + bid.quantity, 0);
      const askVolume = snapshot.asks.slice(0, 10).reduce((sum, ask) => sum + ask.quantity, 0);
      totalBidVolume += bidVolume;
      totalAskVolume += askVolume;
    });
    
    const totalVolume = totalBidVolume + totalAskVolume;
    const ratio = totalVolume > 0 ? (totalBidVolume - totalAskVolume) / totalVolume : 0;
    
    // Calculate trend
    let trend: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    if (snapshots.length >= 20) {
      const oldSnapshots = snapshots.slice(-20, -10);
      let oldBidVolume = 0;
      let oldAskVolume = 0;
      
      oldSnapshots.forEach(snapshot => {
        oldBidVolume += snapshot.bids.slice(0, 10).reduce((sum, bid) => sum + bid.quantity, 0);
        oldAskVolume += snapshot.asks.slice(0, 10).reduce((sum, ask) => sum + ask.quantity, 0);
      });
      
      const oldRatio = (oldBidVolume + oldAskVolume) > 0 
        ? (oldBidVolume - oldAskVolume) / (oldBidVolume + oldAskVolume) 
        : 0;
      
      if (ratio > oldRatio + 0.1) trend = 'bullish';
      else if (ratio < oldRatio - 0.1) trend = 'bearish';
    }
    
    return { ratio, bidVolume: totalBidVolume, askVolume: totalAskVolume, trend };
  }, [snapshots]);

  const barWidth = 30;
  const barHeight = 2;
  const indicatorPosition = imbalanceData.ratio * (barWidth / 2);

  return (
    <group position={[0, 35, 0]}>
      {/* Background bar */}
      <mesh>
        <boxGeometry args={[barWidth, barHeight, 1]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      
      {/* Bid side */}
      <mesh position={[-barWidth / 4, 0, 0.05]}>
        <boxGeometry args={[barWidth / 2, barHeight, 1.1]} />
        <meshStandardMaterial 
          color={0x00ff88} 
          transparent 
          opacity={0.3}
        />
      </mesh>
      
      {/* Ask side */}
      <mesh position={[barWidth / 4, 0, 0.05]}>
        <boxGeometry args={[barWidth / 2, barHeight, 1.1]} />
        <meshStandardMaterial 
          color={0xff4444} 
          transparent 
          opacity={0.3}
        />
      </mesh>
      
      {/* Center line */}
      <mesh position={[0, 0, 0.1]}>
        <boxGeometry args={[0.2, barHeight + 1, 1.2]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      
      {/* Imbalance indicator */}
      <mesh position={[indicatorPosition, 0, 0.15]}>
        <boxGeometry args={[2, barHeight + 1, 1.3]} />
        <meshStandardMaterial
          color={imbalanceData.ratio > 0 ? 0x00ff88 : 0xff4444}
          emissive={imbalanceData.ratio > 0 ? 0x00ff88 : 0xff4444}
          emissiveIntensity={Math.abs(imbalanceData.ratio) * 0.5}
        />
      </mesh>
      
      {/* Labels */}
      <Text
        position={[0, barHeight + 3, 0]}
        fontSize={1}
        color="#ffffff"
        anchorX="center"
      >
        Order Imbalance
      </Text>
      
      <Text
        position={[-barWidth / 2 - 2, 0, 0]}
        fontSize={0.6}
        color={0x00ff88}
        anchorX="right"
      >
        Bid
      </Text>
      
      <Text
        position={[barWidth / 2 + 2, 0, 0]}
        fontSize={0.6}
        color={0xff4444}
        anchorX="left"
      >
        Ask
      </Text>
      
      {/* Ratio text */}
      <Text
        position={[0, -barHeight - 2, 0]}
        fontSize={0.8}
        color="#ffffff"
        anchorX="center"
      >
        {(imbalanceData.ratio * 100).toFixed(1)}%
      </Text>
      
      {/* Trend arrow */}
      {imbalanceData.trend !== 'neutral' && (
        <group position={[indicatorPosition, barHeight + 1, 0]}>
          <Text
            fontSize={1.5}
            color={imbalanceData.trend === 'bullish' ? 0x00ff88 : 0xff4444}
            anchorX="center"
          >
            {imbalanceData.trend === 'bullish' ? '↑' : '↓'}
          </Text>
        </group>
      )}
    </group>
  );
};

export default ImbalanceIndicator;