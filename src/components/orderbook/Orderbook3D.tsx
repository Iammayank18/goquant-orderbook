import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { OrderbookSnapshot, Point3D } from '@/types/orderbook';

interface OrderbookMeshProps {
  points: Point3D[];
  type: 'bid' | 'ask';
  autoRotate: boolean;
}

const OrderbookMesh: React.FC<OrderbookMeshProps> = ({ points, autoRotate }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const tempObject = useMemo(() => new THREE.Object3D(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);

  useEffect(() => {
    if (!meshRef.current) return;

    points.forEach((point, i) => {
      tempObject.position.set(point.x, point.y / 2, point.z);
      tempObject.scale.set(1, point.y, 1);
      tempObject.updateMatrix();
      meshRef.current!.setMatrixAt(i, tempObject.matrix);
      
      tempColor.set(point.color);
      meshRef.current!.setColorAt(i, tempColor);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [points, tempObject, tempColor]);

  useFrame(() => {
    if (autoRotate && meshRef.current) {
      meshRef.current.rotation.y += 0.002;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, points.length]}>
      <boxGeometry args={[0.5, 1, 0.5]} />
      <meshStandardMaterial vertexColors />
    </instancedMesh>
  );
};

interface Orderbook3DVisualizationProps {
  snapshots: OrderbookSnapshot[];
  autoRotate: boolean;
  showGrid: boolean;
}

const Orderbook3DVisualization: React.FC<Orderbook3DVisualizationProps> = ({
  snapshots,
  autoRotate,
  showGrid
}) => {

  const { bidPoints, askPoints } = useMemo(() => {
    const bids: Point3D[] = [];
    const asks: Point3D[] = [];
    
    snapshots.forEach((snapshot, timeIndex) => {
      const z = timeIndex * 2;
      
      snapshot.bids.forEach((bid) => {
        bids.push({
          x: (bid.price - snapshot.asks[0]?.price || bid.price) * 0.1,
          y: Math.log(bid.quantity + 1) * 2,
          z,
          color: '#00ff00',
          venue: snapshot.venue,
          type: 'bid'
        });
      });
      
      snapshot.asks.forEach((ask) => {
        asks.push({
          x: (ask.price - snapshot.bids[0]?.price || ask.price) * 0.1,
          y: Math.log(ask.quantity + 1) * 2,
          z,
          color: '#ff0000',
          venue: snapshot.venue,
          type: 'ask'
        });
      });
    });
    
    return { bidPoints: bids, askPoints: asks };
  }, [snapshots]);

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      
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
      
      <OrderbookMesh points={bidPoints} type="bid" autoRotate={autoRotate} />
      <OrderbookMesh points={askPoints} type="ask" autoRotate={autoRotate} />
      
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        zoomSpeed={0.5}
        panSpeed={0.5}
        rotateSpeed={0.5}
      />
    </>
  );
};

interface Orderbook3DProps {
  snapshots: OrderbookSnapshot[];
  autoRotate: boolean;
  showGrid: boolean;
}

const Orderbook3D: React.FC<Orderbook3DProps> = ({ snapshots, autoRotate, showGrid }) => {
  return (
    <div className="w-full h-full">
      <Canvas>
        <PerspectiveCamera makeDefault position={[20, 20, 20]} fov={60} />
        <Orderbook3DVisualization
          snapshots={snapshots}
          autoRotate={autoRotate}
          showGrid={showGrid}
        />
      </Canvas>
    </div>
  );
};

export default Orderbook3D;