import React, { useRef, useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { OrderbookSnapshot } from "@/types/orderbook";
import { Html } from "@react-three/drei";

interface OrderbookBarsProps {
  snapshots: OrderbookSnapshot[];
  maxLevels?: number;
  maxSnapshots?: number;
  bounds?: { x: number; y: number; z: number };
}

const OrderbookBarsFixed: React.FC<OrderbookBarsProps> = ({
  snapshots,
  maxLevels = 20,
  maxSnapshots = 50,
}) => {
  const bidMeshRef = useRef<THREE.InstancedMesh>(null);
  const askMeshRef = useRef<THREE.InstancedMesh>(null);
  const [isReady, setIsReady] = useState(false);

  // Wait for meshes to be ready
  useEffect(() => {
    const timer = setTimeout(() => {
      if (bidMeshRef.current && askMeshRef.current) {
        setIsReady(true);
        console.log("OrderbookBarsFixed: Meshes ready");
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Process snapshots into bar data
  const { bidBars, askBars } = useMemo(() => {
    const bids: Array<{
      position: THREE.Vector3;
      scale: THREE.Vector3;
    }> = [];
    const asks: Array<{
      position: THREE.Vector3;
      scale: THREE.Vector3;
    }> = [];

    const recentSnapshots = snapshots.slice(-maxSnapshots);
    
    if (recentSnapshots.length === 0) {
      return { bidBars: [], askBars: [] };
    }
    
    // Calculate price range
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    recentSnapshots.forEach(snapshot => {
      if (snapshot.bids?.length && snapshot.asks?.length) {
        minPrice = Math.min(minPrice, snapshot.bids[maxLevels - 1]?.price || Infinity);
        maxPrice = Math.max(maxPrice, snapshot.asks[maxLevels - 1]?.price || -Infinity);
      }
    });
    
    const priceRange = maxPrice - minPrice || 100;
    const priceScale = Math.min(0.5, 40 / priceRange);

    recentSnapshots.forEach((snapshot, timeIndex) => {
      if (!snapshot.bids?.length || !snapshot.asks?.length) return;

      const midPrice = (snapshot.bids[0].price + snapshot.asks[0].price) / 2;
      const z = timeIndex * 2;

      // Process bids
      snapshot.bids.slice(0, maxLevels).forEach((bid) => {
        const x = Math.max(-40, Math.min(40, (bid.price - midPrice) * priceScale));
        const volumeInUSD = bid.price * bid.quantity;
        const height = Math.min(15, Math.log10(volumeInUSD + 1) * 2);

        bids.push({
          position: new THREE.Vector3(x - 0.3, height / 2, z),
          scale: new THREE.Vector3(0.8, height, 0.8),
        });
      });

      // Process asks
      snapshot.asks.slice(0, maxLevels).forEach((ask) => {
        const x = Math.max(-40, Math.min(40, (ask.price - midPrice) * priceScale));
        const volumeInUSD = ask.price * ask.quantity;
        const height = Math.min(15, Math.log10(volumeInUSD + 1) * 2);

        asks.push({
          position: new THREE.Vector3(x + 0.3, height / 2, z),
          scale: new THREE.Vector3(0.8, height, 0.8),
        });
      });
    });

    return { bidBars: bids, askBars: asks };
  }, [snapshots, maxLevels, maxSnapshots]);

  // Update instances every frame
  useFrame(() => {
    if (!isReady || !bidMeshRef.current || !askMeshRef.current) return;

    const tempObject = new THREE.Object3D();

    // Update bids
    for (let i = 0; i < 1000; i++) {
      if (i < bidBars.length) {
        tempObject.position.copy(bidBars[i].position);
        tempObject.scale.copy(bidBars[i].scale);
      } else {
        tempObject.position.set(0, -1000, 0);
        tempObject.scale.set(0, 0, 0);
      }
      tempObject.updateMatrix();
      bidMeshRef.current.setMatrixAt(i, tempObject.matrix);
    }
    bidMeshRef.current.instanceMatrix.needsUpdate = true;

    // Update asks
    for (let i = 0; i < 1000; i++) {
      if (i < askBars.length) {
        tempObject.position.copy(askBars[i].position);
        tempObject.scale.copy(askBars[i].scale);
      } else {
        tempObject.position.set(0, -1000, 0);
        tempObject.scale.set(0, 0, 0);
      }
      tempObject.updateMatrix();
      askMeshRef.current.setMatrixAt(i, tempObject.matrix);
    }
    askMeshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh
        ref={bidMeshRef}
        args={[undefined, undefined, 1000]}
        frustumCulled={false}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={0x00d68f}
          emissive={0x00d68f}
          emissiveIntensity={0.2}
        />
      </instancedMesh>

      <instancedMesh
        ref={askMeshRef}
        args={[undefined, undefined, 1000]}
        frustumCulled={false}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={0xff4757}
          emissive={0xff4757}
          emissiveIntensity={0.2}
        />
      </instancedMesh>
    </group>
  );
};

export default OrderbookBarsFixed;