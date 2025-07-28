import React, { useMemo } from 'react';
import { Text, Box } from '@react-three/drei';
import { OrderbookSnapshot } from '@/types/orderbook';

interface OrderImbalanceIndicatorProps {
  snapshots: OrderbookSnapshot[];
  visible: boolean;
  position?: [number, number, number];
}

const OrderImbalanceIndicator: React.FC<OrderImbalanceIndicatorProps> = ({
  snapshots,
  visible,
  position = [0, 40, 0]
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

  if (!visible || snapshots.length === 0) return null;

  const barWidth = 30;
  const barHeight = 3;
  const indicatorPosition = imbalanceData.ratio * (barWidth / 2);

  return (
    <group position={position}>
      {/* Background bar */}
      <Box args={[barWidth, barHeight, 1]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#333333" />
      </Box>
      
      {/* Bid side */}
      <Box args={[barWidth / 2, barHeight, 1.1]} position={[-barWidth / 4, 0, 0.05]}>
        <meshStandardMaterial color="#00ff88" opacity={0.3} transparent />
      </Box>
      
      {/* Ask side */}
      <Box args={[barWidth / 2, barHeight, 1.1]} position={[barWidth / 4, 0, 0.05]}>
        <meshStandardMaterial color="#ff4444" opacity={0.3} transparent />
      </Box>
      
      {/* Center line */}
      <Box args={[0.2, barHeight + 1, 1.2]} position={[0, 0, 0.1]}>
        <meshStandardMaterial color="#ffffff" />
      </Box>
      
      {/* Imbalance indicator */}
      <Box args={[2, barHeight + 1, 1.3]} position={[indicatorPosition, 0, 0.15]}>
        <meshStandardMaterial
          color={imbalanceData.ratio > 0 ? '#00ff88' : '#ff4444'}
          emissive={imbalanceData.ratio > 0 ? '#00ff88' : '#ff4444'}
          emissiveIntensity={Math.abs(imbalanceData.ratio)}
        />
      </Box>
      
      {/* Labels */}
      <Text
        position={[0, barHeight + 3, 0]}
        fontSize={1.2}
        color="#ffffff"
        anchorX="center"
      >
        Order Imbalance
      </Text>
      
      <Text
        position={[-barWidth / 2 - 2, 0, 0]}
        fontSize={0.8}
        color="#00ff88"
        anchorX="right"
      >
        Bid
      </Text>
      
      <Text
        position={[barWidth / 2 + 2, 0, 0]}
        fontSize={0.8}
        color="#ff4444"
        anchorX="left"
      >
        Ask
      </Text>
      
      {/* Ratio text */}
      <Text
        position={[0, -barHeight - 2, 0]}
        fontSize={1}
        color="#ffffff"
        anchorX="center"
      >
        {(imbalanceData.ratio * 100).toFixed(1)}%
      </Text>
      
      {/* Volume text */}
      <Text
        position={[0, -barHeight - 4, 0]}
        fontSize={0.7}
        color="#888888"
        anchorX="center"
      >
        Bid: {imbalanceData.bidVolume.toFixed(2)} | Ask: {imbalanceData.askVolume.toFixed(2)}
      </Text>
      
      {/* Trend arrow */}
      {imbalanceData.trend !== 'neutral' && (
        <Text
          position={[indicatorPosition, barHeight + 1, 0]}
          fontSize={1.5}
          color={imbalanceData.trend === 'bullish' ? '#00ff88' : '#ff4444'}
          anchorX="center"
        >
          {imbalanceData.trend === 'bullish' ? '↑' : '↓'}
        </Text>
      )}
    </group>
  );
};

export default OrderImbalanceIndicator;