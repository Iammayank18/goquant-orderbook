import React, { useRef, useEffect, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Text } from "@react-three/drei";
import { OrderbookSnapshot, PressureZone, VenueType } from "@/types/orderbook";
import { getVenueColor } from "@/utils/venueConfig";

interface Orderbook3DEnhancedProps {
  snapshots: OrderbookSnapshot[];
  pressureZones: PressureZone[];
  autoRotate: boolean;
  selectedVenues: VenueType[];
  showPressureZones: boolean;
  showOrderFlow: boolean;
  timeRange: number;
}

interface OrderBlock {
  position: THREE.Vector3;
  scale: THREE.Vector3;
  color: string;
  venue: VenueType;
  price: number;
  quantity: number;
  timestamp: number;
  type: "bid" | "ask";
  opacity: number;
}

const Orderbook3DEnhanced: React.FC<Orderbook3DEnhancedProps> = ({
  snapshots,
  pressureZones,
  autoRotate,
  selectedVenues,
  showPressureZones,
  showOrderFlow,
  timeRange,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const bidMeshRef = useRef<THREE.InstancedMesh>(null);
  const askMeshRef = useRef<THREE.InstancedMesh>(null);
  const [orderBlocks, setOrderBlocks] = useState<OrderBlock[]>([]);
  const [animationTime, setAnimationTime] = useState(0);

  // Filter snapshots by selected venues and time range
  const filteredSnapshots = useMemo(() => {
    const now = Date.now();
    const startTime = now - timeRange * 1000;

    return snapshots
      .filter(
        (snapshot) =>
          selectedVenues.includes(snapshot.venue) &&
          snapshot.timestamp >= startTime
      )
      .slice(-50); // Limit to last 50 snapshots for performance
  }, [snapshots, selectedVenues, timeRange]);

  // Calculate order blocks from snapshots
  useEffect(() => {
    const blocks: OrderBlock[] = [];
    const now = Date.now();

    console.log("Filtered snapshots:", filteredSnapshots.length);

    filteredSnapshots.forEach((snapshot, snapshotIndex) => {
      // Position snapshots along the time axis (positive Z direction)
      const z = snapshotIndex * 3; // Space snapshots 3 units apart

      const midPrice =
        (snapshot.bids[0]?.price + snapshot.asks[0]?.price) / 2 || 0;

      if (!midPrice || midPrice === 0) {
        console.warn("Invalid mid price:", snapshot);
        return; // Skip if no valid mid price
      }

      // Process bids
      snapshot.bids.slice(0, 10).forEach((bid, levelIndex) => {
        const priceOffset = (bid.price - midPrice) * 0.01; // Scale down price differences
        const height = Math.log10(bid.quantity + 1) * 3; // Logarithmic scale for quantity

        blocks.push({
          position: new THREE.Vector3(priceOffset, height / 2, z),
          scale: new THREE.Vector3(1, height, 1),
          color: "#00ff88", // Green for bids
          venue: snapshot.venue,
          price: bid.price,
          quantity: bid.quantity,
          timestamp: snapshot.timestamp,
          type: "bid",
          opacity: 0.8 - levelIndex * 0.05,
        });
      });

      // Process asks
      snapshot.asks.slice(0, 10).forEach((ask, levelIndex) => {
        const priceOffset = (ask.price - midPrice) * 0.01; // Scale down price differences
        const height = Math.log10(ask.quantity + 1) * 3; // Logarithmic scale for quantity

        blocks.push({
          position: new THREE.Vector3(priceOffset, height / 2, z),
          scale: new THREE.Vector3(1, height, 1),
          color: "#ff4444", // Red for asks
          venue: snapshot.venue,
          price: ask.price,
          quantity: ask.quantity,
          timestamp: snapshot.timestamp,
          type: "ask",
          opacity: 0.8 - levelIndex * 0.05,
        });
      });
    });

    console.log("Total order blocks created:", blocks.length);
    setOrderBlocks(blocks);
  }, [filteredSnapshots]);

  // Update instanced meshes
  useEffect(() => {
    if (!bidMeshRef.current || !askMeshRef.current) return;

    const tempObject = new THREE.Object3D();
    const tempColor = new THREE.Color();

    let bidIndex = 0;
    let askIndex = 0;

    // Reset all instances
    for (let i = 0; i < 1000; i++) {
      tempObject.position.set(0, -1000, 0);
      tempObject.scale.set(0, 0, 0);
      tempObject.updateMatrix();
      bidMeshRef.current.setMatrixAt(i, tempObject.matrix);
      askMeshRef.current.setMatrixAt(i, tempObject.matrix);
    }

    // Update with order blocks
    orderBlocks.forEach((block) => {
      const mesh =
        block.type === "bid" ? bidMeshRef.current : askMeshRef.current;
      const index = block.type === "bid" ? bidIndex++ : askIndex++;

      if (mesh && index < 1000) {
        tempObject.position.copy(block.position);
        tempObject.scale.copy(block.scale);
        tempObject.updateMatrix();
        mesh.setMatrixAt(index, tempObject.matrix);

        tempColor.set(block.color);
        mesh.setColorAt(index, tempColor);
      }
    });

    bidMeshRef.current.instanceMatrix.needsUpdate = true;
    askMeshRef.current.instanceMatrix.needsUpdate = true;
    if (bidMeshRef.current.instanceColor)
      bidMeshRef.current.instanceColor.needsUpdate = true;
    if (askMeshRef.current.instanceColor)
      askMeshRef.current.instanceColor.needsUpdate = true;
  }, [orderBlocks]);

  // Animation frame
  useFrame((state, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.2;
    }

    if (showOrderFlow) {
      setAnimationTime((prev) => prev + delta);
    }
  });

  // Render axes
  const renderAxes = () => (
    <group>
      {/* X-axis (Price) */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[100, 0.1, 0.1]} />
        <meshBasicMaterial color="#666666" />
      </mesh>
      <Text position={[50, -2, 0]} fontSize={1} color="#ffffff">
        Price →
      </Text>

      {/* Y-axis (Quantity) */}
      <mesh position={[0, 10, 0]}>
        <boxGeometry args={[0.1, 20, 0.1]} />
        <meshBasicMaterial color="#666666" />
      </mesh>
      <Text position={[-2, 20, 0]} fontSize={1} color="#ffffff">
        Quantity ↑
      </Text>

      {/* Z-axis (Time) */}
      <mesh position={[0, 0, -50]}>
        <boxGeometry args={[0.1, 0.1, 100]} />
        <meshBasicMaterial color="#666666" />
      </mesh>
      <Text position={[0, -2, -50]} fontSize={1} color="#ffffff">
        Time →
      </Text>
    </group>
  );

  // Render pressure zones
  const renderPressureZones = () => {
    if (!showPressureZones || pressureZones.length === 0) return null;

    return (
      <group>
        {pressureZones.map((zone, index) => {
          const midPrice =
            filteredSnapshots[filteredSnapshots.length - 1]?.bids[0]?.price ||
            0;
          const priceOffset = ((zone.price - midPrice) / midPrice) * 100;
          const width =
            (Math.abs(zone.priceRange[1] - zone.priceRange[0]) / midPrice) *
            100;

          return (
            <mesh key={index} position={[priceOffset, 0, -10]}>
              <boxGeometry args={[width, 0.2, 20]} />
              <meshStandardMaterial
                color={zone.type === "bid" ? "#00ff00" : "#ff0000"}
                transparent
                opacity={0.3 + zone.intensity * 0.05}
                emissive={zone.type === "bid" ? "#00ff00" : "#ff0000"}
                emissiveIntensity={zone.intensity * 0.1}
              />
            </mesh>
          );
        })}
      </group>
    );
  };

  // Render order flow animation
  const renderOrderFlow = () => {
    if (!showOrderFlow) return null;

    return (
      <group>
        {orderBlocks.slice(-20).map((block, index) => {
          const flowOffset = Math.sin(animationTime * 2 + index * 0.5) * 0.5;

          return (
            <mesh
              key={index}
              position={[
                block.position.x,
                block.position.y + flowOffset,
                block.position.z,
              ]}
            >
              <sphereGeometry args={[0.2, 8, 8]} />
              <meshStandardMaterial
                color={block.color}
                emissive={block.color}
                emissiveIntensity={0.5}
                transparent
                opacity={0.6}
              />
            </mesh>
          );
        })}
      </group>
    );
  };

  return (
    <group ref={groupRef}>
      {renderAxes()}

      {/* Bid orders */}
      <instancedMesh
        ref={bidMeshRef}
        args={[undefined, undefined, 1000]}
        frustumCulled={false}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          vertexColors
          transparent
          opacity={0.8}
          emissive="#00ff00"
          emissiveIntensity={0.1}
        />
      </instancedMesh>

      {/* Ask orders */}
      <instancedMesh
        ref={askMeshRef}
        args={[undefined, undefined, 1000]}
        frustumCulled={false}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          vertexColors
          transparent
          opacity={0.8}
          emissive="#ff0000"
          emissiveIntensity={0.1}
        />
      </instancedMesh>

      {renderPressureZones()}
      {renderOrderFlow()}
    </group>
  );
};

export default Orderbook3DEnhanced;
