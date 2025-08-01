import React, { useMemo } from "react";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { OrderbookSnapshot } from "@/types/orderbook";

interface SpreadVisualizationProps {
  snapshots: OrderbookSnapshot[];
}

const SpreadVisualization: React.FC<SpreadVisualizationProps> = ({
  snapshots,
}) => {
  const spreadData = useMemo(() => {
    const recentSnapshots = snapshots.slice(-50);

    return recentSnapshots
      .map((snapshot, index) => {
        if (!snapshot.bids?.length || !snapshot.asks?.length) return null;

        const bestBid = snapshot.bids[0];
        const bestAsk = snapshot.asks[0];
        const midPrice = (bestBid.price + bestAsk.price) / 2;
        const spread = bestAsk.price - bestBid.price;
        const z = index * 3; // Match spacing in OrderbookBars

        return {
          bidX: (bestBid.price - midPrice) * 0.02,
          askX: (bestAsk.price - midPrice) * 0.02,
          z,
          spread,
          midPrice,
        };
      })
      .filter(Boolean);
  }, [snapshots]);

  if (spreadData.length === 0) return null;

  const lineColor = "#ffff00"; // Yellow in dark mode via CSS
  const textColor = "#ffffff"; // Will be handled by dark mode

  return (
    <group>
      {/* Spread lines connecting best bid and ask */}
      {spreadData.map((data, index) => {
        if (!data) return null;

        const points = [
          new THREE.Vector3(data.bidX, 0.1, data.z),
          new THREE.Vector3(data.askX, 0.1, data.z),
        ];

        return (
          <group key={index}>
            {/* Spread line */}
            <line>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  args={[
                    new Float32Array(points.flatMap((p) => [p.x, p.y, p.z])),
                    3
                  ]}
                />
              </bufferGeometry>
              <lineBasicMaterial
                color={lineColor}
                linewidth={2}
                transparent
                opacity={0.8}
              />
            </line>

            {/* Spread value label (show only for the latest) */}
            {index === spreadData.length - 1 && (
              <Text
                position={[0, 0.5, data.z]}
                fontSize={0.8}
                color={textColor}
                anchorX="center"
                anchorY="bottom"
              >
                Spread: ${data.spread.toFixed(2)}
              </Text>
            )}
          </group>
        );
      })}

      {/* Mid-price plane */}
      <mesh position={[0, 10, 25]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[50, 20, 1, 1]} />
        <meshBasicMaterial
          color={lineColor}
          transparent
          opacity={0.05}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Mid-price label */}
      <Text
        position={[0, 21, 50]}
        fontSize={1}
        color={lineColor}
        anchorX="center"
        anchorY="middle"
      >
        Mid Price
      </Text>
    </group>
  );
};

export default SpreadVisualization;
