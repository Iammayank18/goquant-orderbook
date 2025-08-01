import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Grid } from "@react-three/drei";
import * as THREE from "three";
import {
  OrderbookSnapshot,
  PressureZone,
  FilterSettings,
} from "@/types/orderbook";
import OrderbookBars from "./OrderbookBars";
import PressureZoneVisuals from "./PressureZoneVisuals";
import VolumeProfile from "./VolumeProfile";
import AxesHelper from "./AxesHelper";
import OrderFlowParticles from "./OrderFlowParticles";
import ImbalanceIndicator from "./ImbalanceIndicator";
import SpreadVisualization from "./SpreadVisualization";
import CumulativeDepthView from "./CumulativeDepthView";

interface ViewSettings {
  autoRotate: boolean;
  showGrid: boolean;
  showAxes: boolean;
  cameraDistance: number;
  showOrderFlow: boolean;
  showImbalance: boolean;
  showSpread: boolean;
}

interface Orderbook3DSceneProps {
  snapshots: OrderbookSnapshot[];
  pressureZones: PressureZone[];
  viewSettings: ViewSettings;
  filterSettings: FilterSettings;
  isMobile?: boolean;
}

const Orderbook3DScene: React.FC<Orderbook3DSceneProps> = ({
  snapshots,
  pressureZones,
  viewSettings,
  filterSettings,
  isMobile = false,
}) => {
  console.log("Orderbook3DScene: Rendering with", {
    snapshotsLength: snapshots.length,
    pressureZonesLength: pressureZones.length,
    viewSettings,
    filterSettings
  });
  
  const groupRef = useRef<THREE.Group>(null);
  const sceneRef = useRef<THREE.Scene>(null);

  // Auto-rotation with smooth transitions
  const rotationSpeed = useRef(0.1);

  useFrame((state, delta) => {
    if (groupRef.current) {
      if (viewSettings.autoRotate) {
        // Smoothly accelerate rotation
        rotationSpeed.current = THREE.MathUtils.lerp(
          rotationSpeed.current,
          0.1,
          delta * 2
        );
        groupRef.current.rotation.y += delta * rotationSpeed.current;
      } else {
        // Smoothly decelerate rotation
        rotationSpeed.current = THREE.MathUtils.lerp(
          rotationSpeed.current,
          0,
          delta * 5
        );
        if (rotationSpeed.current > 0.001) {
          groupRef.current.rotation.y += delta * rotationSpeed.current;
        }
      }
    }
  });

  // Calculate scene bounds for better camera positioning
  const sceneBounds = useMemo(() => {
    if (snapshots.length === 0) return { x: 40, y: 15, z: 100 };

    const latest = snapshots[snapshots.length - 1];
    const priceRange = latest.asks[0]?.price - latest.bids[0]?.price || 100;
    const maxQuantity = Math.max(
      ...latest.bids.map((b) => b.quantity),
      ...latest.asks.map((a) => a.quantity)
    );

    return {
      x: 40, // Fixed width to match our clamping
      y: 15, // Fixed max height
      z: Math.min(100, snapshots.length * 2), // Limited Z range
    };
  }, [snapshots]);

  return (
    <>
      {/* Enhanced Lighting for better visibility */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[30, 50, 30]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight
        position={[-30, 40, -30]}
        intensity={0.4}
        color="#87CEEB"
      />
      <pointLight position={[0, 60, 0]} intensity={0.5} />

      {/* Fog for depth perception */}
      <fog attach="fog" args={['#0a0a0f', 100, 300]} />

      {/* Grid with better styling */}
      {viewSettings.showGrid && (
        <Grid
          args={[80, 100]}
          position={[0, -0.1, 50]}
          cellSize={5}
          cellThickness={0.6}
          cellColor="#1a1a2e"
          sectionSize={20}
          sectionThickness={1.5}
          sectionColor="#16213e"
          fadeDistance={100}
          fadeStrength={1}
        />
      )}

      {/* Main rotating group */}
      <group ref={groupRef}>
        {/* Axes */}
        {viewSettings.showAxes && (
          <AxesHelper bounds={sceneBounds} snapshots={snapshots} />
        )}

        {/* Orderbook bars - reduced for clarity */}
        <OrderbookBars
          snapshots={snapshots}
          maxLevels={isMobile ? 8 : 15}
          maxSnapshots={isMobile ? 15 : 25}
          bounds={sceneBounds}
        />

        {/* Pressure zones */}
        {filterSettings.showPressureZones && (
          <PressureZoneVisuals
            zones={pressureZones}
            latestSnapshot={snapshots[snapshots.length - 1]}
          />
        )}

        {/* Volume profile */}
        {filterSettings.showVolumeProfile && (
          <VolumeProfile snapshots={snapshots} />
        )}

        {/* Order flow particles */}
        {viewSettings.showOrderFlow && (
          <OrderFlowParticles snapshots={snapshots} />
        )}

        {/* Imbalance indicator */}
        {viewSettings.showImbalance && (
          <ImbalanceIndicator snapshots={snapshots} />
        )}

        {/* Spread visualization */}
        {viewSettings.showSpread && (
          <SpreadVisualization snapshots={snapshots} />
        )}

        {/* Cumulative depth visualization */}
        {filterSettings.showVolumeProfile && (
          <CumulativeDepthView snapshots={snapshots} bounds={sceneBounds} />
        )}
      </group>

      {/* Camera controls handled by OrbitControls in main component */}
    </>
  );
};

export default Orderbook3DScene;
