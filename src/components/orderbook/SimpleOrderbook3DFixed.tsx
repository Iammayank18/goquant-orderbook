import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { OrderbookSnapshot } from '@/types/orderbook';

interface SimpleOrderbook3DFixedProps {
  snapshots: OrderbookSnapshot[];
  autoRotate: boolean;
}

const SimpleOrderbook3DFixed: React.FC<SimpleOrderbook3DFixedProps> = ({
  snapshots,
  autoRotate
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const bidMeshRef = useRef<THREE.InstancedMesh>(null);
  const askMeshRef = useRef<THREE.InstancedMesh>(null);
  
  // Process snapshots into renderable data
  const { bidData, askData } = useMemo(() => {
    const bids: { x: number; y: number; z: number; height: number }[] = [];
    const asks: { x: number; y: number; z: number; height: number }[] = [];
    
    // Only process last 20 snapshots for performance
    const recentSnapshots = snapshots.slice(-20);
    
    recentSnapshots.forEach((snapshot, timeIndex) => {
      if (!snapshot.bids?.length || !snapshot.asks?.length) return;
      
      const midPrice = (snapshot.bids[0].price + snapshot.asks[0].price) / 2;
      if (!midPrice) return;
      
      // Process top 5 bid levels
      snapshot.bids.slice(0, 5).forEach((bid, levelIndex) => {
        const x = (bid.price - midPrice) * 0.01;
        const height = Math.min(bid.quantity * 2, 10); // Cap height at 10
        const z = timeIndex * 2; // Space along time axis
        
        bids.push({ x, y: height / 2, z, height });
      });
      
      // Process top 5 ask levels
      snapshot.asks.slice(0, 5).forEach((ask, levelIndex) => {
        const x = (ask.price - midPrice) * 0.01;
        const height = Math.min(ask.quantity * 2, 10); // Cap height at 10
        const z = timeIndex * 2; // Space along time axis
        
        asks.push({ x, y: height / 2, z, height });
      });
    });
    
    return { bidData: bids, askData: asks };
  }, [snapshots]);
  
  // Update instanced meshes
  useEffect(() => {
    if (!bidMeshRef.current || !askMeshRef.current) return;
    
    const tempObject = new THREE.Object3D();
    const maxInstances = 100;
    
    // Update bid instances
    for (let i = 0; i < maxInstances; i++) {
      if (i < bidData.length) {
        const bid = bidData[i];
        tempObject.position.set(bid.x, bid.y, bid.z);
        tempObject.scale.set(0.8, bid.height, 0.8);
      } else {
        // Hide unused instances
        tempObject.position.set(0, -1000, 0);
        tempObject.scale.set(0, 0, 0);
      }
      tempObject.updateMatrix();
      bidMeshRef.current.setMatrixAt(i, tempObject.matrix);
    }
    bidMeshRef.current.instanceMatrix.needsUpdate = true;
    
    // Update ask instances
    for (let i = 0; i < maxInstances; i++) {
      if (i < askData.length) {
        const ask = askData[i];
        tempObject.position.set(ask.x, ask.y, ask.z);
        tempObject.scale.set(0.8, ask.height, 0.8);
      } else {
        // Hide unused instances
        tempObject.position.set(0, -1000, 0);
        tempObject.scale.set(0, 0, 0);
      }
      tempObject.updateMatrix();
      askMeshRef.current.setMatrixAt(i, tempObject.matrix);
    }
    askMeshRef.current.instanceMatrix.needsUpdate = true;
  }, [bidData, askData]);
  
  // Rotation animation
  useFrame((state, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.2;
    }
  });
  
  return (
    <group ref={groupRef}>
      {/* Axes */}
      <group>
        {/* X-axis (Price) */}
        <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
          <boxGeometry args={[40, 0.1, 0.1]} />
          <meshBasicMaterial color="#666666" />
        </mesh>
        <Text position={[20, -1, 0]} fontSize={1} color="#ffffff">
          Price →
        </Text>
        
        {/* Y-axis (Quantity) */}
        <mesh position={[0, 5, 0]} rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[10, 0.1, 0.1]} />
          <meshBasicMaterial color="#666666" />
        </mesh>
        <Text position={[-2, 10, 0]} fontSize={1} color="#ffffff">
          Quantity ↑
        </Text>
        
        {/* Z-axis (Time) */}
        <mesh position={[0, 0, 20]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[40, 0.1, 0.1]} />
          <meshBasicMaterial color="#666666" />
        </mesh>
        <Text position={[0, -1, 40]} fontSize={1} color="#ffffff">
          Time →
        </Text>
      </group>
      
      {/* Bid orders (green) */}
      <instancedMesh 
        ref={bidMeshRef} 
        args={[undefined, undefined, 100]}
        frustumCulled={false}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#00ff88" />
      </instancedMesh>
      
      {/* Ask orders (red) */}
      <instancedMesh 
        ref={askMeshRef} 
        args={[undefined, undefined, 100]}
        frustumCulled={false}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#ff4444" />
      </instancedMesh>
    </group>
  );
};

export default SimpleOrderbook3DFixed;