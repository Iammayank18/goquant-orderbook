import React, { useMemo } from "react";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { OrderbookSnapshot } from "@/types/orderbook";

interface AxesHelperProps {
  bounds: { x: number; y: number; z: number };
  snapshots?: OrderbookSnapshot[];
}

const AxesHelper: React.FC<AxesHelperProps> = ({ bounds, snapshots }) => {
  const axisColor = "#444444"; // Professional dark gray
  const textColor = "#e0e0e0"; // Professional light gray for text
  const labelColor = "#999999"; // Professional medium gray for labels
  const gridColor = "#333333"; // Professional grid lines

  // Calculate price labels based on actual data
  const priceLabels = useMemo(() => {
    if (!snapshots || snapshots.length === 0) return [];

    const latest = snapshots[snapshots.length - 1];
    if (!latest.bids?.length || !latest.asks?.length) return [];

    const midPrice = (latest.bids[0].price + latest.asks[0].price) / 2;
    const priceRange = latest.asks[0].price - latest.bids[0].price;

    // Create professional price labels with proper increments
    const labels = [];
    const increment = priceRange > 100 ? 50 : priceRange > 10 ? 5 : 1;
    const roundedMid = Math.round(midPrice / increment) * increment;

    for (let i = -3; i <= 3; i++) {
      const price = roundedMid + i * increment;
      const x = ((price - midPrice) / priceRange) * bounds.x * 0.8;
      labels.push({ x, price });
    }
    return labels;
  }, [snapshots, bounds.x]);

  // Calculate quantity labels
  const quantityLabels = useMemo(() => {
    const labels = [];
    const maxY = bounds.y;

    // Market standard volume labels in BTC
    const volumeLevels = [0, 0.1, 0.5, 1, 5, 10, 50];
    for (let i = 0; i < volumeLevels.length; i++) {
      const y = Math.log10(volumeLevels[i] + 1) * 5; // Match the log scale in OrderbookBars
      if (y <= maxY) {
        labels.push({ y, quantity: volumeLevels[i] });
      }
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
      const z = i * 2; // Match the updated spacing in OrderbookBars
      const time = new Date(
        snapshots[snapshots.length - totalSnapshots + i].timestamp
      );
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
          Price (USDT)
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
              $
              {label.price.toLocaleString("en-US", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              })}
            </Text>
          </group>
        ))}

        {/* Professional Bid/Ask side indicators */}
        <Text
          position={[-bounds.x * 0.7, -2.5, 0]}
          fontSize={1.2}
          color="#00d68f"
          anchorX="center"
          anchorY="top"
          rotation={[-Math.PI / 2, 0, 0]}
        >
          ← BUY SIDE
        </Text>
        <Text
          position={[bounds.x * 0.7, -2.5, 0]}
          fontSize={1.2}
          color="#ff4757"
          anchorX="center"
          anchorY="top"
          rotation={[-Math.PI / 2, 0, 0]}
        >
          SELL SIDE →
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
          Volume (BTC)
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
              {label.quantity < 1
                ? label.quantity.toFixed(2)
                : label.quantity.toFixed(1)}{" "}
              BTC
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
          Time (UTC)
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
              {label.time.toLocaleTimeString("en-US", {
                hour12: false,
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
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

      {/* Professional grid planes */}
      <group>
        {/* XZ plane grid (price-time) */}
        <gridHelper
          args={[bounds.x * 2, 20, new THREE.Color(gridColor), new THREE.Color(gridColor)]}
          rotation={[0, 0, 0]}
          position={[0, 0, bounds.z / 2]}
        />

        {/* Current price line */}
        <mesh position={[0, bounds.y / 2, bounds.z / 2]}>
          <boxGeometry args={[0.1, bounds.y, bounds.z]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.1} />
        </mesh>
      </group>

      {/* Spread indicator at origin */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive={new THREE.Color("#ffffff")}
          emissiveIntensity={0.3}
        />
      </mesh>
    </group>
  );
};

export default AxesHelper;
