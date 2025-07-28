import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { OrderbookSnapshot } from "@/types/orderbook";

interface OrderbookDepthViewProps {
  snapshots: OrderbookSnapshot[];
  maxLevels?: number;
  colorScheme?: {
    bid: string;
    ask: string;
    bidGradient: string[];
    askGradient: string[];
  };
}

const OrderbookDepthView: React.FC<OrderbookDepthViewProps> = ({
  snapshots,
  maxLevels = 20,
  colorScheme = {
    bid: "#00ff88",
    ask: "#ff0044",
    bidGradient: ["#00ff88", "#00cc66", "#009944"],
    askGradient: ["#ff0044", "#cc0033", "#990022"],
  },
}) => {
  const meshRef = useRef<THREE.Group>(null);
  const materialCache = useRef<Map<string, THREE.MeshStandardMaterial>>(
    new Map()
  );

  const getMaterial = (color: string, opacity: number = 1) => {
    const key = `${color}-${opacity}`;
    if (!materialCache.current.has(key)) {
      materialCache.current.set(
        key,
        new THREE.MeshStandardMaterial({
          color,
          transparent: opacity < 1,
          opacity,
          emissive: color,
          emissiveIntensity: 0.2,
        })
      );
    }
    return materialCache.current.get(key)!;
  };

  // Remove unused depthGeometry to prevent memory leaks

  useEffect(() => {
    if (!meshRef.current) return;

    // Clear previous meshes
    while (meshRef.current.children.length > 0) {
      const child = meshRef.current.children[0];
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (child.material instanceof THREE.Material) {
          child.material.dispose();
        }
      }
      meshRef.current.remove(child);
    }

    // Limit snapshots to prevent performance issues
    const limitedSnapshots = snapshots.slice(-20); // Only show last 20 snapshots

    limitedSnapshots.forEach((snapshot, timeIndex) => {
      const z = timeIndex * 3;
      const midPrice =
        (snapshot.bids[0]?.price + snapshot.asks[0]?.price) / 2 || 0;

      snapshot.bids.slice(0, Math.min(maxLevels, 10)).forEach((bid, i) => {
        const intensity = 1 - i / maxLevels;
        const colorIndex = Math.floor(
          (i / maxLevels) * colorScheme.bidGradient.length
        );
        const color =
          colorScheme.bidGradient[
            Math.min(colorIndex, colorScheme.bidGradient.length - 1)
          ];

        const geometry = new THREE.BoxGeometry(
          0.8,
          Math.log(bid.quantity + 1) * 2,
          0.8
        );

        const mesh = new THREE.Mesh(
          geometry,
          getMaterial(color, 0.8 + intensity * 0.2)
        );
        const priceOffset = (bid.price - midPrice) * 0.01;
        mesh.position.set(priceOffset, Math.log(bid.quantity + 1) / 2, z);

        meshRef.current!.add(mesh);
      });

      snapshot.asks.slice(0, Math.min(maxLevels, 10)).forEach((ask, i) => {
        const intensity = 1 - i / maxLevels;
        const colorIndex = Math.floor(
          (i / maxLevels) * colorScheme.askGradient.length
        );
        const color =
          colorScheme.askGradient[
            Math.min(colorIndex, colorScheme.askGradient.length - 1)
          ];

        const geometry = new THREE.BoxGeometry(
          0.8,
          Math.log(ask.quantity + 1) * 2,
          0.8
        );

        const mesh = new THREE.Mesh(
          geometry,
          getMaterial(color, 0.8 + intensity * 0.2)
        );
        const priceOffset = (ask.price - midPrice) * 0.01;
        mesh.position.set(priceOffset, Math.log(ask.quantity + 1) / 2, z);

        meshRef.current!.add(mesh);
      });
    });
  }, [snapshots, maxLevels, colorScheme]);

  // Removed useFrame animation to prevent performance issues

  return <group ref={meshRef} />;
};

export default OrderbookDepthView;
