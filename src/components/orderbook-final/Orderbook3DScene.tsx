import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Grid } from '@react-three/drei';
import * as THREE from 'three';
import { OrderbookSnapshot, PressureZone, FilterSettings } from '@/types/orderbook';
import OrderbookBars from './OrderbookBars';
import PressureZoneVisuals from './PressureZoneVisuals';
import VolumeProfile from './VolumeProfile';
import AxesHelper from './AxesHelper';
import OrderFlowParticles from './OrderFlowParticles';
import ImbalanceIndicator from './ImbalanceIndicator';

interface ViewSettings {
  autoRotate: boolean;
  showGrid: boolean;
  showAxes: boolean;
  cameraDistance: number;
  showOrderFlow: boolean;
  showImbalance: boolean;
}

interface Orderbook3DSceneProps {
  snapshots: OrderbookSnapshot[];
  pressureZones: PressureZone[];
  viewSettings: ViewSettings;
  filterSettings: FilterSettings;
  theme: 'dark' | 'light';
  isMobile?: boolean;
}

const Orderbook3DScene: React.FC<Orderbook3DSceneProps> = ({
  snapshots,
  pressureZones,
  viewSettings,
  filterSettings,
  theme,
  isMobile = false
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const sceneRef = useRef<THREE.Scene>(null);

  // Auto-rotation
  useFrame((state, delta) => {
    if (viewSettings.autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.1;
    }
  });

  // Update camera position based on distance setting
  useFrame((state) => {
    const camera = state.camera;
    const targetDistance = viewSettings.cameraDistance;
    const currentDistance = camera.position.length();
    
    if (Math.abs(currentDistance - targetDistance) > 0.1) {
      camera.position.normalize().multiplyScalar(targetDistance);
      camera.lookAt(0, 0, 0);
    }
  });

  // Calculate scene bounds for better camera positioning
  const sceneBounds = useMemo(() => {
    if (snapshots.length === 0) return { x: 50, y: 20, z: 50 };
    
    const latest = snapshots[snapshots.length - 1];
    const priceRange = latest.asks[0]?.price - latest.bids[0]?.price || 100;
    const maxQuantity = Math.max(
      ...latest.bids.map(b => b.quantity),
      ...latest.asks.map(a => a.quantity)
    );
    
    return {
      x: priceRange * 0.5,
      y: Math.log10(maxQuantity + 1) * 10,
      z: snapshots.length * 2
    };
  }, [snapshots]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={theme === 'dark' ? 0.4 : 0.6} />
      <pointLight 
        position={[20, 40, 20]} 
        intensity={theme === 'dark' ? 0.8 : 1} 
        castShadow 
      />
      <directionalLight 
        position={[-20, 30, -20]} 
        intensity={theme === 'dark' ? 0.4 : 0.6} 
      />
      
      {/* Grid */}
      {viewSettings.showGrid && (
        <Grid
          args={[200, 200]}
          position={[0, -0.1, 0]}
          cellSize={5}
          cellThickness={0.5}
          cellColor={theme === 'dark' ? '#1a1a1a' : '#e5e5e5'}
          sectionSize={20}
          sectionThickness={1}
          sectionColor={theme === 'dark' ? '#404040' : '#cccccc'}
          fadeDistance={150}
          fadeStrength={1}
        />
      )}
      
      {/* Main rotating group */}
      <group ref={groupRef}>
        {/* Axes */}
        {viewSettings.showAxes && (
          <AxesHelper bounds={sceneBounds} theme={theme} />
        )}
        
        {/* Orderbook bars */}
        <OrderbookBars 
          snapshots={snapshots} 
          theme={theme}
          maxLevels={isMobile ? 10 : 20}
          maxSnapshots={isMobile ? 30 : 50}
        />
        
        {/* Pressure zones */}
        {filterSettings.showPressureZones && (
          <PressureZoneVisuals 
            zones={pressureZones} 
            latestSnapshot={snapshots[snapshots.length - 1]}
            theme={theme}
          />
        )}
        
        {/* Volume profile */}
        {filterSettings.showVolumeProfile && (
          <VolumeProfile 
            snapshots={snapshots}
            theme={theme}
          />
        )}
        
        {/* Order flow particles */}
        {viewSettings.showOrderFlow && (
          <OrderFlowParticles 
            snapshots={snapshots}
            theme={theme}
          />
        )}
        
        {/* Imbalance indicator */}
        {viewSettings.showImbalance && (
          <ImbalanceIndicator 
            snapshots={snapshots}
            theme={theme}
          />
        )}
      </group>
      
      {/* Camera controls handled by OrbitControls in main component */}
    </>
  );
};

export default Orderbook3DScene;