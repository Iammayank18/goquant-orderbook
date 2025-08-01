import React, { useRef, useMemo, useCallback, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Box, Sphere, Text } from "@react-three/drei";
import * as THREE from "three";
import { OrderbookSnapshot } from "@/types/orderbook";
import ParticleFlow from "./ParticleFlow";

interface ModernOrderbook3DProps {
  snapshots: OrderbookSnapshot[];
  maxLevels?: number;
  maxTimeSteps?: number;
  showParticles?: boolean;
}

// Modern color palette
const COLORS = {
  bid: "#00D9FF", // Cyan
  ask: "#FF006E", // Pink
  neutral: "#8338EC", // Purple
  background: "#0A0E27",
  grid: "#1A1F3A",
  text: "#E0E6FF",
};

const ModernOrderbook3D: React.FC<ModernOrderbook3DProps> = ({
  snapshots,
  maxLevels = 15,
  maxTimeSteps = 30,
  showParticles = false,
}) => {
  const meshRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const [hoveredOrder, setHoveredOrder] = useState<any>(null);

  // Process orderbook data with optimizations
  const processedData = useMemo(() => {
    if (!snapshots.length) return { bids: [], asks: [], midPrice: 0, maxVolume: 0 };

    const recentSnapshots = snapshots.slice(-maxTimeSteps);
    const bids: any[] = [];
    const asks: any[] = [];
    let maxVolume = 0;

    recentSnapshots.forEach((snapshot, timeIndex) => {
      if (!snapshot.bids?.length || !snapshot.asks?.length) return;

      const midPrice = (snapshot.bids[0].price + snapshot.asks[0].price) / 2;
      const timeZ = timeIndex * 2.5;

      // Process bids with depth
      snapshot.bids.slice(0, maxLevels).forEach((bid, depthIndex) => {
        const volume = bid.price * bid.quantity;
        maxVolume = Math.max(maxVolume, volume);
        
        bids.push({
          position: [(bid.price - midPrice) * 0.01, 0, timeZ],
          size: [0.8, Math.log10(volume + 1) * 3, 0.8],
          color: COLORS.bid,
          opacity: 1 - (depthIndex / maxLevels) * 0.5,
          data: { price: bid.price, quantity: bid.quantity, time: snapshot.timestamp },
        });
      });

      // Process asks with depth
      snapshot.asks.slice(0, maxLevels).forEach((ask, depthIndex) => {
        const volume = ask.price * ask.quantity;
        maxVolume = Math.max(maxVolume, volume);
        
        asks.push({
          position: [(ask.price - midPrice) * 0.01, 0, timeZ],
          size: [0.8, Math.log10(volume + 1) * 3, 0.8],
          color: COLORS.ask,
          opacity: 1 - (depthIndex / maxLevels) * 0.5,
          data: { price: ask.price, quantity: ask.quantity, time: snapshot.timestamp },
        });
      });
    });

    return { bids, asks, midPrice: snapshots[snapshots.length - 1]?.bids[0]?.price || 0, maxVolume };
  }, [snapshots, maxLevels, maxTimeSteps]);

  // Smooth rotation animation
  useFrame((state, delta) => {
    if (meshRef.current && !hoveredOrder) {
      meshRef.current.rotation.y += delta * 0.05;
    }
  });

  // Handle hover interactions
  const handlePointerOver = useCallback((order: any) => {
    setHoveredOrder(order);
    document.body.style.cursor = 'pointer';
  }, []);

  const handlePointerOut = useCallback(() => {
    setHoveredOrder(null);
    document.body.style.cursor = 'default';
  }, []);

  return (
    <group ref={meshRef}>
      {/* Ambient lighting */}
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={0.8} color={COLORS.neutral} />
      <pointLight position={[-10, -10, -10]} intensity={0.4} color={COLORS.bid} />

      {/* Modern grid floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <planeGeometry args={[100, 100, 20, 20]} />
        <meshBasicMaterial color={COLORS.grid} wireframe opacity={0.2} transparent />
      </mesh>

      {/* Bid orders */}
      {processedData.bids.map((bid, index) => (
        <mesh
          key={`bid-${index}`}
          position={bid.position}
          scale={bid.size}
          onPointerOver={() => handlePointerOver(bid)}
          onPointerOut={handlePointerOut}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshPhongMaterial
            color={bid.color}
            transparent
            opacity={bid.opacity}
            emissive={bid.color}
            emissiveIntensity={0.3}
          />
        </mesh>
      ))}

      {/* Ask orders */}
      {processedData.asks.map((ask, index) => (
        <mesh
          key={`ask-${index}`}
          position={ask.position}
          scale={ask.size}
          onPointerOver={() => handlePointerOver(ask)}
          onPointerOut={handlePointerOut}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshPhongMaterial
            color={ask.color}
            transparent
            opacity={ask.opacity}
            emissive={ask.color}
            emissiveIntensity={0.3}
          />
        </mesh>
      ))}

      {/* Mid-price line */}
      <mesh position={[0, 5, maxTimeSteps * 1.25]}>
        <boxGeometry args={[0.1, 10, maxTimeSteps * 2.5]} />
        <meshBasicMaterial color={COLORS.neutral} opacity={0.3} transparent />
      </mesh>

      {/* Modern axes labels */}
      <Text
        position={[30, 0, 0]}
        rotation={[0, 0, 0]}
        fontSize={2}
        color={COLORS.text}
        anchorX="center"
        anchorY="middle"
      >
        Price →
      </Text>
      <Text
        position={[0, 15, 0]}
        rotation={[0, 0, 0]}
        fontSize={2}
        color={COLORS.text}
        anchorX="center"
        anchorY="middle"
      >
        Volume ↑
      </Text>
      <Text
        position={[0, 0, maxTimeSteps * 2.5 + 5]}
        rotation={[0, 0, 0]}
        fontSize={2}
        color={COLORS.text}
        anchorX="center"
        anchorY="middle"
      >
        Time →
      </Text>

      {/* Hover info */}
      {hoveredOrder && (
        <group position={[hoveredOrder.position[0], hoveredOrder.position[1] + 5, hoveredOrder.position[2]]}>
          <Sphere args={[0.5, 16, 16]}>
            <meshBasicMaterial color={COLORS.neutral} />
          </Sphere>
          <Text
            position={[0, 1, 0]}
            fontSize={0.8}
            color={COLORS.text}
            anchorX="center"
            anchorY="bottom"
          >
            ${hoveredOrder.data.price.toFixed(2)}
          </Text>
          <Text
            position={[0, 0.5, 0]}
            fontSize={0.6}
            color={COLORS.text}
            anchorX="center"
            anchorY="top"
          >
            {hoveredOrder.data.quantity.toFixed(4)} BTC
          </Text>
        </group>
      )}

      {/* Particle flow visualization */}
      <ParticleFlow snapshots={snapshots} enabled={showParticles} />
    </group>
  );
};

export default ModernOrderbook3D;