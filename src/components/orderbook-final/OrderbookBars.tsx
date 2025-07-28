import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { OrderbookSnapshot } from '@/types/orderbook';

interface OrderbookBarsProps {
  snapshots: OrderbookSnapshot[];
  theme: 'dark' | 'light';
  maxLevels?: number;
  maxSnapshots?: number;
}

const OrderbookBars: React.FC<OrderbookBarsProps> = ({
  snapshots,
  theme,
  maxLevels = 20,
  maxSnapshots = 50
}) => {
  const bidMeshRef = useRef<THREE.InstancedMesh>(null);
  const askMeshRef = useRef<THREE.InstancedMesh>(null);
  
  // Process snapshots into bar data
  const { bidBars, askBars } = useMemo(() => {
    const bids: Array<{ position: THREE.Vector3; scale: THREE.Vector3; color: THREE.Color }> = [];
    const asks: Array<{ position: THREE.Vector3; scale: THREE.Vector3; color: THREE.Color }> = [];
    
    // Only process recent snapshots
    const recentSnapshots = snapshots.slice(-maxSnapshots);
    
    recentSnapshots.forEach((snapshot, timeIndex) => {
      if (!snapshot.bids?.length || !snapshot.asks?.length) return;
      
      const midPrice = (snapshot.bids[0].price + snapshot.asks[0].price) / 2;
      const z = timeIndex * 3; // Space along time axis
      
      // Process bids
      snapshot.bids.slice(0, maxLevels).forEach((bid, levelIndex) => {
        const x = (bid.price - midPrice) * 0.02; // Scale price difference
        const height = Math.log10(bid.quantity + 1) * 4; // Log scale for quantity
        const opacity = 1 - (levelIndex / maxLevels) * 0.5;
        
        bids.push({
          position: new THREE.Vector3(x, height / 2, z),
          scale: new THREE.Vector3(0.8, height, 0.8),
          color: new THREE.Color(0x00ff88).multiplyScalar(opacity)
        });
      });
      
      // Process asks
      snapshot.asks.slice(0, maxLevels).forEach((ask, levelIndex) => {
        const x = (ask.price - midPrice) * 0.02; // Scale price difference
        const height = Math.log10(ask.quantity + 1) * 4; // Log scale for quantity
        const opacity = 1 - (levelIndex / maxLevels) * 0.5;
        
        asks.push({
          position: new THREE.Vector3(x, height / 2, z),
          scale: new THREE.Vector3(0.8, height, 0.8),
          color: new THREE.Color(0xff4444).multiplyScalar(opacity)
        });
      });
    });
    
    return { bidBars: bids, askBars: asks };
  }, [snapshots, maxLevels, maxSnapshots]);
  
  // Update instanced meshes
  useEffect(() => {
    if (!bidMeshRef.current || !askMeshRef.current) return;
    
    const tempObject = new THREE.Object3D();
    const tempColor = new THREE.Color();
    const maxInstances = 1000;
    
    // Update bid instances
    for (let i = 0; i < maxInstances; i++) {
      if (i < bidBars.length) {
        const bar = bidBars[i];
        tempObject.position.copy(bar.position);
        tempObject.scale.copy(bar.scale);
        tempObject.updateMatrix();
        bidMeshRef.current.setMatrixAt(i, tempObject.matrix);
        bidMeshRef.current.setColorAt(i, bar.color);
      } else {
        // Hide unused instances
        tempObject.position.set(0, -1000, 0);
        tempObject.scale.set(0, 0, 0);
        tempObject.updateMatrix();
        bidMeshRef.current.setMatrixAt(i, tempObject.matrix);
      }
    }
    bidMeshRef.current.instanceMatrix.needsUpdate = true;
    if (bidMeshRef.current.instanceColor) {
      bidMeshRef.current.instanceColor.needsUpdate = true;
    }
    
    // Update ask instances
    for (let i = 0; i < maxInstances; i++) {
      if (i < askBars.length) {
        const bar = askBars[i];
        tempObject.position.copy(bar.position);
        tempObject.scale.copy(bar.scale);
        tempObject.updateMatrix();
        askMeshRef.current.setMatrixAt(i, tempObject.matrix);
        askMeshRef.current.setColorAt(i, bar.color);
      } else {
        // Hide unused instances
        tempObject.position.set(0, -1000, 0);
        tempObject.scale.set(0, 0, 0);
        tempObject.updateMatrix();
        askMeshRef.current.setMatrixAt(i, tempObject.matrix);
      }
    }
    askMeshRef.current.instanceMatrix.needsUpdate = true;
    if (askMeshRef.current.instanceColor) {
      askMeshRef.current.instanceColor.needsUpdate = true;
    }
  }, [bidBars, askBars]);
  
  return (
    <group>
      {/* Bid orders */}
      <instancedMesh 
        ref={bidMeshRef} 
        args={[undefined, undefined, 1000]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial 
          vertexColors
          transparent
          opacity={0.9}
          emissive={new THREE.Color(0x00ff88)}
          emissiveIntensity={0.2}
          roughness={0.3}
          metalness={0.1}
        />
      </instancedMesh>
      
      {/* Ask orders */}
      <instancedMesh 
        ref={askMeshRef} 
        args={[undefined, undefined, 1000]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial 
          vertexColors
          transparent
          opacity={0.9}
          emissive={new THREE.Color(0xff4444)}
          emissiveIntensity={0.2}
          roughness={0.3}
          metalness={0.1}
        />
      </instancedMesh>
    </group>
  );
};

export default OrderbookBars;