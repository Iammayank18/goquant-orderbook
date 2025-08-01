import React, { useMemo } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { OrderbookSnapshot } from '@/types/orderbook';

interface AxesHelperProps {
  bounds: { x: number; y: number; z: number };
  snapshots?: OrderbookSnapshot[];
}

const AxesHelper: React.FC<AxesHelperProps> = ({ bounds, snapshots }) => {
  const axisColor = '#666666'; // Will be styled via CSS for light mode
  const textColor = '#ffffff'; // Will be styled via CSS for light mode
  const labelColor = '#cccccc'; // Will be styled via CSS for light mode
  
  // Calculate price labels based on actual data
  const priceLabels = useMemo(() => {
    if (!snapshots || snapshots.length === 0) return [];
    
    const latest = snapshots[snapshots.length - 1];
    if (!latest.bids?.length || !latest.asks?.length) return [];
    
    const midPrice = (latest.bids[0].price + latest.asks[0].price) / 2;
    const priceRange = latest.asks[0].price - latest.bids[0].price;
    
    // Create 5 price labels
    const labels = [];
    for (let i = -2; i <= 2; i++) {
      const price = midPrice + (i * priceRange * 0.5);
      const x = i * bounds.x * 0.4;
      labels.push({ x, price });
    }
    return labels;
  }, [snapshots, bounds.x]);
  
  // Calculate quantity labels
  const quantityLabels = useMemo(() => {
    const labels = [];
    const maxY = bounds.y;
    
    // Create logarithmic quantity labels
    for (let i = 0; i <= 4; i++) {
      const y = (i / 4) * maxY;
      const quantity = Math.pow(10, (y / 10)); // Reverse log scale
      labels.push({ y, quantity });
    }
    return labels;
  }, [bounds.y]);
  
  // Calculate time labels
  const timeLabels = useMemo(() => {
    if (!snapshots || snapshots.length === 0) return [];
    
    const labels = [];
    const totalSnapshots = Math.min(snapshots.length, 50);
    const interval = Math.max(1, Math.floor(totalSnapshots / 5));
    
    for (let i = 0; i < totalSnapshots; i += interval) {
      const z = i * 3; // Match the spacing in OrderbookBars
      const time = new Date(snapshots[snapshots.length - totalSnapshots + i].timestamp);
      labels.push({ z, time });
    }
    return labels;
  }, [snapshots]);
  
  return (
    <group>
      {/* X-axis (Price) */}
      <group>
        <mesh>
          <boxGeometry args={[bounds.x * 2, 0.1, 0.1]} />
          <meshBasicMaterial color={axisColor} />
        </mesh>
        <mesh position={[bounds.x + 2, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.3, 1, 8]} />
          <meshBasicMaterial color={axisColor} />
        </mesh>
        <Text
          position={[bounds.x + 5, 0, 0]}
          fontSize={1.5}
          color={textColor}
          anchorX="center"
          anchorY="middle"
        >
          Price →
        </Text>
        
        {/* Price labels */}
        {priceLabels.map((label, i) => (
          <group key={i}>
            <mesh position={[label.x, -0.5, 0]}>
              <boxGeometry args={[0.05, 0.3, 0.05]} />
              <meshBasicMaterial color={labelColor} />
            </mesh>
            <Text
              position={[label.x, -1.5, 0]}
              fontSize={0.8}
              color={labelColor}
              anchorX="center"
              anchorY="top"
              rotation={[-Math.PI / 2, 0, 0]}
            >
              ${label.price.toFixed(2)}
            </Text>
          </group>
        ))}
        
        {/* Bid/Ask side indicators */}
        <Text
          position={[-bounds.x * 0.7, -2.5, 0]}
          fontSize={1}
          color="#00ff88"
          anchorX="center"
          anchorY="top"
          rotation={[-Math.PI / 2, 0, 0]}
        >
          ← BIDS
        </Text>
        <Text
          position={[bounds.x * 0.7, -2.5, 0]}
          fontSize={1}
          color="#ff4444"
          anchorX="center"
          anchorY="top"
          rotation={[-Math.PI / 2, 0, 0]}
        >
          ASKS →
        </Text>
      </group>
      
      {/* Y-axis (Quantity) */}
      <group>
        <mesh position={[0, bounds.y / 2, 0]}>
          <boxGeometry args={[0.1, bounds.y, 0.1]} />
          <meshBasicMaterial color={axisColor} />
        </mesh>
        <mesh position={[0, bounds.y + 1, 0]}>
          <coneGeometry args={[0.3, 1, 8]} />
          <meshBasicMaterial color={axisColor} />
        </mesh>
        <Text
          position={[0, bounds.y + 3, 0]}
          fontSize={1.5}
          color={textColor}
          anchorX="center"
          anchorY="middle"
        >
          Quantity (Log Scale) ↑
        </Text>
        
        {/* Quantity labels */}
        {quantityLabels.map((label, i) => (
          <group key={i}>
            <mesh position={[-0.5, label.y, 0]}>
              <boxGeometry args={[0.3, 0.05, 0.05]} />
              <meshBasicMaterial color={labelColor} />
            </mesh>
            <Text
              position={[-1.5, label.y, 0]}
              fontSize={0.8}
              color={labelColor}
              anchorX="right"
              anchorY="middle"
            >
              {label.quantity.toFixed(0)}
            </Text>
          </group>
        ))}
      </group>
      
      {/* Z-axis (Time) */}
      <group>
        <mesh position={[0, 0, bounds.z / 2]}>
          <boxGeometry args={[0.1, 0.1, bounds.z]} />
          <meshBasicMaterial color={axisColor} />
        </mesh>
        <mesh position={[0, 0, bounds.z + 1]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.3, 1, 8]} />
          <meshBasicMaterial color={axisColor} />
        </mesh>
        <Text
          position={[0, 0, bounds.z + 3]}
          fontSize={1.5}
          color={textColor}
          anchorX="center"
          anchorY="middle"
        >
          Time →
        </Text>
        
        {/* Time labels */}
        {timeLabels.map((label, i) => (
          <group key={i}>
            <mesh position={[0, -0.5, label.z]}>
              <boxGeometry args={[0.05, 0.3, 0.05]} />
              <meshBasicMaterial color={labelColor} />
            </mesh>
            <Text
              position={[0, -1.5, label.z]}
              fontSize={0.7}
              color={labelColor}
              anchorX="center"
              anchorY="top"
              rotation={[-Math.PI / 2, 0, 0]}
            >
              {label.time.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit'
              })}
            </Text>
          </group>
        ))}
        
        {/* Now/Past indicators */}
        <Text
          position={[0, -2.5, 0]}
          fontSize={0.8}
          color={labelColor}
          anchorX="center"
          anchorY="top"
          rotation={[-Math.PI / 2, 0, 0]}
        >
          ← Past
        </Text>
        <Text
          position={[0, -2.5, bounds.z]}
          fontSize={0.8}
          color={labelColor}
          anchorX="center"
          anchorY="top"
          rotation={[-Math.PI / 2, 0, 0]}
        >
          Now →
        </Text>
      </group>
      
      {/* Origin marker */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial color="#ffff00" />
      </mesh>
    </group>
  );
};

export default AxesHelper;