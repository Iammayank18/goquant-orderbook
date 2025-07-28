import React from "react";
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera, Grid } from "@react-three/drei";
import { OrderbookSnapshot, PressureZone } from "@/types/orderbook";
import OrderbookInstancedMesh from "./OrderbookInstancedMesh";
import PressureZoneView from "./PressureZoneView";
import VolumeProfile from "./VolumeProfile";
import CameraController from "./CameraController";
import AxisLabels from "./AxisLabels";

interface OrderbookVisualizationProps {
  snapshots: OrderbookSnapshot[];
  pressureZones: PressureZone[];
  autoRotate: boolean;
  showGrid: boolean;
  showPressureZones: boolean;
  showVolumeProfile: boolean;
  midPrice: number;
  cameraDistance?: number;
}

const OrderbookVisualization: React.FC<OrderbookVisualizationProps> = ({
  snapshots,
  pressureZones,
  autoRotate,
  showGrid,
  showPressureZones,
  showVolumeProfile,
  midPrice,
  cameraDistance = 40,
}) => {
  console.log("OrderbookVisualization props:", {
    snapshotsCount: snapshots.length,
    firstSnapshot: snapshots[0],
    autoRotate,
    showGrid,
    midPrice,
  });

  return (
    <Canvas>
      <PerspectiveCamera makeDefault position={[0, 15, 30]} fov={60} />

      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <directionalLight position={[-10, 10, -10]} intensity={0.5} />

      {showGrid && (
        <Grid
          args={[100, 100]}
          position={[0, -0.1, 0]}
          cellSize={1}
          cellThickness={0.5}
          cellColor="#6e6e6e"
          sectionSize={10}
          sectionThickness={1}
          sectionColor="#9d9d9d"
          fadeDistance={100}
          fadeStrength={1}
        />
      )}

      <OrderbookInstancedMesh
        snapshots={snapshots}
        maxLevels={10}
        maxSnapshots={10}
      />

      <AxisLabels snapshots={snapshots} />

      <VolumeProfile snapshots={snapshots} visible={showVolumeProfile} />

      {showPressureZones && (
        <PressureZoneView
          zones={pressureZones}
          midPrice={midPrice}
          visible={showPressureZones}
        />
      )}

      <CameraController
        autoRotate={autoRotate}
        rotationSpeed={0.5}
        enableDamping={true}
        dampingFactor={0.05}
        minDistance={10}
        maxDistance={100}
        cameraDistance={cameraDistance}
      />
    </Canvas>
  );
};

export default OrderbookVisualization;
