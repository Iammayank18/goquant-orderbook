import React from 'react';
import { Text } from '@react-three/drei';
import { OrderbookSnapshot } from '@/types/orderbook';

interface AxisLabelsProps {
  snapshots: OrderbookSnapshot[];
}

const AxisLabels: React.FC<AxisLabelsProps> = ({ snapshots }) => {
  if (snapshots.length === 0) return null;

  const latestSnapshot = snapshots[snapshots.length - 1];
  const midPrice = (latestSnapshot.bids[0]?.price + latestSnapshot.asks[0]?.price) / 2 || 0;

  // Price labels for X-axis
  const priceLabels = [];
  for (let i = -5; i <= 5; i++) {
    const price = midPrice + (i * 20);
    const x = i * 20 * 0.01; // Match the scale used in OrderbookInstancedMesh
    
    priceLabels.push(
      <Text
        key={`price-${i}`}
        position={[x, -2, 0]}
        fontSize={0.5}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        ${price.toFixed(0)}
      </Text>
    );
  }

  // Quantity labels for Y-axis
  const quantityLabels = [];
  for (let i = 1; i <= 5; i++) {
    quantityLabels.push(
      <Text
        key={`qty-${i}`}
        position={[-15, i * 2, 0]}
        fontSize={0.5}
        color="white"
        anchorX="right"
        anchorY="middle"
      >
        {i.toFixed(1)}
      </Text>
    );
  }

  return (
    <group>
      {/* X-axis label */}
      <Text
        position={[0, -4, 0]}
        fontSize={0.8}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        Price (USD)
      </Text>

      {/* Y-axis label */}
      <Text
        position={[-18, 5, 0]}
        fontSize={0.8}
        color="white"
        anchorX="center"
        anchorY="middle"
        rotation={[0, 0, Math.PI / 2]}
      >
        Quantity
      </Text>

      {/* Z-axis label */}
      <Text
        position={[0, -2, 15]}
        fontSize={0.8}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        Time →
      </Text>

      {priceLabels}
      {quantityLabels}
    </group>
  );
};

export default AxisLabels;