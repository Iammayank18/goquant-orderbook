import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { OrderbookSnapshot } from '@/types/orderbook';

interface OrderbookInstancedMeshProps {
  snapshots: OrderbookSnapshot[];
  maxLevels?: number;
  maxSnapshots?: number;
}

const OrderbookInstancedMesh: React.FC<OrderbookInstancedMeshProps> = ({
  snapshots,
  maxLevels = 10,
  maxSnapshots = 10
}) => {
  const bidMeshRef = useRef<THREE.InstancedMesh>(null);
  const askMeshRef = useRef<THREE.InstancedMesh>(null);

  const limitedSnapshots = useMemo(() => 
    snapshots.slice(-maxSnapshots), 
    [snapshots, maxSnapshots]
  );

  useEffect(() => {
    if (!bidMeshRef.current || !askMeshRef.current) {
      console.log('Mesh refs not ready');
      return;
    }

    console.log('OrderbookInstancedMesh update:', {
      snapshotsCount: limitedSnapshots.length,
      firstSnapshot: limitedSnapshots[0],
      bidMeshCount: bidMeshRef.current.count,
      askMeshCount: askMeshRef.current.count
    });

    const tempObject = new THREE.Object3D();
    const tempColor = new THREE.Color();
    let bidIndex = 0;
    let askIndex = 0;

    // Reset all instances
    for (let i = 0; i < bidMeshRef.current.count; i++) {
      tempObject.position.set(0, -1000, 0);
      tempObject.scale.set(0, 0, 0);
      tempObject.updateMatrix();
      bidMeshRef.current.setMatrixAt(i, tempObject.matrix);
      askMeshRef.current.setMatrixAt(i, tempObject.matrix);
    }

    limitedSnapshots.forEach((snapshot, snapshotIndex) => {
      const z = snapshotIndex * 3;
      const midPrice = (snapshot.bids[0]?.price + snapshot.asks[0]?.price) / 2 || 0;

      // Process bids
      snapshot.bids.slice(0, maxLevels).forEach((bid, levelIndex) => {
        if (bidIndex < bidMeshRef.current!.count) {
          const height = Math.min(bid.quantity * 3, 20); // Scale quantity with max height
          const x = (bid.price - midPrice) * 0.01; // Finer price scale
          
          tempObject.position.set(x, height / 2, z);
          tempObject.scale.set(0.8, height, 0.8);
          tempObject.updateMatrix();
          
          bidMeshRef.current!.setMatrixAt(bidIndex, tempObject.matrix);
          
          const intensity = 0.5 + (bid.quantity / 10) * 0.5;
          tempColor.setHSL(0.33, 1, intensity);
          bidMeshRef.current!.setColorAt(bidIndex, tempColor);
          
          bidIndex++;
        }
      });

      // Process asks
      snapshot.asks.slice(0, maxLevels).forEach((ask, levelIndex) => {
        if (askIndex < askMeshRef.current!.count) {
          const height = Math.min(ask.quantity * 3, 20); // Scale quantity with max height
          const x = (ask.price - midPrice) * 0.01; // Finer price scale
          
          tempObject.position.set(x, height / 2, z);
          tempObject.scale.set(0.8, height, 0.8);
          tempObject.updateMatrix();
          
          askMeshRef.current!.setMatrixAt(askIndex, tempObject.matrix);
          
          const intensity = 0.5 + (ask.quantity / 10) * 0.5;
          tempColor.setHSL(0, 1, intensity);
          askMeshRef.current!.setColorAt(askIndex, tempColor);
          
          askIndex++;
        }
      });
    });

    bidMeshRef.current.instanceMatrix.needsUpdate = true;
    askMeshRef.current.instanceMatrix.needsUpdate = true;
    if (bidMeshRef.current.instanceColor) bidMeshRef.current.instanceColor.needsUpdate = true;
    if (askMeshRef.current.instanceColor) askMeshRef.current.instanceColor.needsUpdate = true;

    console.log('Updated instances:', { bidIndex, askIndex });
  }, [limitedSnapshots, maxLevels]);

  const maxInstances = maxSnapshots * maxLevels;

  return (
    <group>
      <instancedMesh ref={bidMeshRef} args={[undefined, undefined, maxInstances]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#00ff00" />
      </instancedMesh>
      <instancedMesh ref={askMeshRef} args={[undefined, undefined, maxInstances]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#ff0000" />
      </instancedMesh>
    </group>
  );
};

export default OrderbookInstancedMesh;