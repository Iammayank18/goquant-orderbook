import React, { useMemo } from "react";
import * as THREE from "three";
import { Line } from "@react-three/drei";
import { OrderbookSnapshot } from "@/types/orderbook";

interface CumulativeDepthViewProps {
  snapshots: OrderbookSnapshot[];
  bounds: { x: number; y: number; z: number };
}

const CumulativeDepthView: React.FC<CumulativeDepthViewProps> = ({ snapshots, bounds }) => {
  const depthData = useMemo(() => {
    if (!snapshots.length) return { bidLine: [], askLine: [] };

    const latest = snapshots[snapshots.length - 1];
    if (!latest.bids?.length || !latest.asks?.length) return { bidLine: [], askLine: [] };

    const midPrice = (latest.bids[0].price + latest.asks[0].price) / 2;
    const priceScale = Math.min(0.5, 40 / ((latest.asks[0].price - latest.bids[0].price) || 100));

    // Calculate cumulative bid depth
    const bidPoints: THREE.Vector3[] = [];
    let cumulativeBidVolume = 0;
    
    // Start from best bid and go down
    latest.bids.slice(0, 20).forEach((bid, index) => {
      cumulativeBidVolume += bid.quantity * bid.price;
      const x = Math.max(-40, Math.min(40, (bid.price - midPrice) * priceScale));
      const y = Math.min(15, Math.log10(cumulativeBidVolume + 1) * 2);
      bidPoints.push(new THREE.Vector3(x, y, 0));
    });

    // Calculate cumulative ask depth
    const askPoints: THREE.Vector3[] = [];
    let cumulativeAskVolume = 0;
    
    // Start from best ask and go up
    latest.asks.slice(0, 20).forEach((ask, index) => {
      cumulativeAskVolume += ask.quantity * ask.price;
      const x = Math.max(-40, Math.min(40, (ask.price - midPrice) * priceScale));
      const y = Math.min(15, Math.log10(cumulativeAskVolume + 1) * 2);
      askPoints.push(new THREE.Vector3(x, y, 0));
    });

    return { bidLine: bidPoints, askLine: askPoints };
  }, [snapshots]);

  return (
    <group>
      {/* Cumulative bid depth line */}
      {depthData.bidLine.length > 1 && (
        <Line
          points={depthData.bidLine}
          color="#00d68f"
          lineWidth={3}
          transparent
          opacity={0.8}
        />
      )}

      {/* Cumulative ask depth line */}
      {depthData.askLine.length > 1 && (
        <Line
          points={depthData.askLine}
          color="#ff4757"
          lineWidth={3}
          transparent
          opacity={0.8}
        />
      )}

      {/* Depth area fills */}
      {depthData.bidLine.length > 1 && (
        <mesh>
          <meshBasicMaterial
            color="#00d68f"
            transparent
            opacity={0.1}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {depthData.askLine.length > 1 && (
        <mesh>
          <meshBasicMaterial
            color="#ff4757"
            transparent
            opacity={0.1}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
};

export default CumulativeDepthView;