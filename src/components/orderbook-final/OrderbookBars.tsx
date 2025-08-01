import React, { useRef, useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { OrderbookSnapshot } from "@/types/orderbook";
import { Html } from "@react-three/drei";

interface OrderbookBarsProps {
  snapshots: OrderbookSnapshot[];
  maxLevels?: number;
  maxSnapshots?: number;
  bounds?: { x: number; y: number; z: number };
}

const OrderbookBars: React.FC<OrderbookBarsProps> = ({
  snapshots,
  maxLevels = 20,
  maxSnapshots = 50,
}) => {
  const bidMeshRef = useRef<THREE.InstancedMesh>(null);
  const askMeshRef = useRef<THREE.InstancedMesh>(null);
  const [hoveredBar, setHoveredBar] = useState<{
    type: "bid" | "ask";
    price: number;
    quantity: number;
    time: Date;
    position: THREE.Vector3;
  } | null>(null);

  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;

  // Process snapshots into bar data with metadata
  const { bidBars, askBars, barMetadata } = useMemo(() => {
    const bids: Array<{
      position: THREE.Vector3;
      scale: THREE.Vector3;
      color: THREE.Color;
    }> = [];
    const asks: Array<{
      position: THREE.Vector3;
      scale: THREE.Vector3;
      color: THREE.Color;
    }> = [];
    const metadata: Map<
      string,
      { price: number; quantity: number; time: Date; type: "bid" | "ask" }
    > = new Map();

    // Only process recent snapshots
    const recentSnapshots = snapshots.slice(-maxSnapshots);
    
    // Calculate price range for dynamic scaling
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    recentSnapshots.forEach(snapshot => {
      if (snapshot.bids?.length && snapshot.asks?.length) {
        const lowestBid = snapshot.bids[Math.min(maxLevels - 1, snapshot.bids.length - 1)]?.price || 0;
        const highestAsk = snapshot.asks[Math.min(maxLevels - 1, snapshot.asks.length - 1)]?.price || 0;
        minPrice = Math.min(minPrice, lowestBid);
        maxPrice = Math.max(maxPrice, highestAsk);
      }
    });
    
    const priceRange = maxPrice - minPrice || 100;
    // Clamp the scale to prevent bars from going outside bounds
    const priceScale = Math.min(0.5, 40 / priceRange); // Scale to fit within ±40 units max

    recentSnapshots.forEach((snapshot, timeIndex) => {
      if (!snapshot.bids?.length || !snapshot.asks?.length) return;

      const midPrice = (snapshot.bids[0].price + snapshot.asks[0].price) / 2;
      const z = timeIndex * 2; // Market standard spacing

      // Process bids (green - buy orders)
      snapshot.bids.slice(0, maxLevels).forEach((bid, levelIndex) => {
        const x = Math.max(-40, Math.min(40, (bid.price - midPrice) * priceScale)); // Clamp X position
        // Market standard: Use actual quantity for height with log scale
        const volumeInUSD = bid.price * bid.quantity;
        const height = Math.min(15, Math.log10(volumeInUSD + 1) * 2); // Cap height at 15
        const opacity = 0.95 - (levelIndex / maxLevels) * 0.3; // Professional opacity gradient
        const position = new THREE.Vector3(x - 0.3, height / 2, z); // Professional gap

        bids.push({
          position,
          scale: new THREE.Vector3(0.8, height, 0.8), // Market standard bar width
          color: new THREE.Color(0x00d68f).multiplyScalar(opacity), // Professional green
        });

        // Store metadata for hover
        metadata.set(`bid-${bids.length - 1}`, {
          price: bid.price,
          quantity: bid.quantity,
          time: new Date(snapshot.timestamp),
          type: "bid",
        });
      });

      // Process asks (red - sell orders)
      snapshot.asks.slice(0, maxLevels).forEach((ask, levelIndex) => {
        const x = Math.max(-40, Math.min(40, (ask.price - midPrice) * priceScale)); // Clamp X position
        // Market standard: Use actual quantity for height with log scale
        const volumeInUSD = ask.price * ask.quantity;
        const height = Math.min(15, Math.log10(volumeInUSD + 1) * 2); // Cap height at 15
        const opacity = 0.95 - (levelIndex / maxLevels) * 0.3; // Professional opacity gradient
        const position = new THREE.Vector3(x + 0.3, height / 2, z); // Professional gap

        asks.push({
          position,
          scale: new THREE.Vector3(0.8, height, 0.8), // Market standard bar width
          color: new THREE.Color(0xff4757).multiplyScalar(opacity), // Professional red
        });

        // Store metadata for hover
        metadata.set(`ask-${asks.length - 1}`, {
          price: ask.price,
          quantity: ask.quantity,
          time: new Date(snapshot.timestamp),
          type: "ask",
        });
      });
    });

    return { bidBars: bids, askBars: asks, barMetadata: metadata };
  }, [snapshots, maxLevels, maxSnapshots]);

  // Update instanced meshes
  useEffect(() => {
    if (!bidMeshRef.current || !askMeshRef.current) return;

    const tempObject = new THREE.Object3D();
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

  // Handle hover detection
  const handlePointerMove = (event: any, type: "bid" | "ask") => {
    const mesh = type === "bid" ? bidMeshRef.current : askMeshRef.current;
    if (!mesh) return;

    const instanceId = event.instanceId;
    if (instanceId !== undefined && instanceId !== null) {
      const bars = type === "bid" ? bidBars : askBars;
      const bar = bars[instanceId];
      const metadata = barMetadata.get(`${type}-${instanceId}`);

      if (bar && metadata) {
        setHoveredBar({
          type,
          price: metadata.price,
          quantity: metadata.quantity,
          time: metadata.time,
          position: bar.position.clone(),
        });
      }
    }
  };

  const handlePointerOut = () => {
    setHoveredBar(null);
  };

  // Responsive tooltip styles
  const getTooltipStyles = () => {
    if (isMobile) {
      return {
        transform: "translate(-50%, -120%)",
        minWidth: "180px",
        fontSize: "12px",
        scale: "1",
      };
    } else if (isTablet) {
      return {
        transform: "translate(-50%, -140%) scale(1.2)",
        minWidth: "220px",
        fontSize: "16px",
        scale: "1.2",
      };
    } else {
      return {
        transform: "translate(-50%, -150%) scale(1.5)",
        minWidth: "280px",
        fontSize: "20px",
        scale: "1.5",
      };
    }
  };

  const tooltipStyles = getTooltipStyles();

  return (
    <group>
      {/* Bid orders */}
      <instancedMesh
        ref={bidMeshRef}
        args={[undefined, undefined, 1000]}
        castShadow
        receiveShadow
        onPointerMove={(e) => handlePointerMove(e, "bid")}
        onPointerOut={handlePointerOut}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          vertexColors
          transparent
          opacity={0.9}
          emissive={new THREE.Color(0x00d68f)}
          emissiveIntensity={0.15}
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
        onPointerMove={(e) => handlePointerMove(e, "ask")}
        onPointerOut={handlePointerOut}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          vertexColors
          transparent
          opacity={0.9}
          emissive={new THREE.Color(0xff4757)}
          emissiveIntensity={0.15}
          roughness={0.3}
          metalness={0.1}
        />
      </instancedMesh>

      {/* Hover Tooltip */}
      {hoveredBar && (
        <Html
          position={[
            hoveredBar.position.x,
            hoveredBar.position.y + (hoveredBar.position.y * 0.5) + 3,
            hoveredBar.position.z
          ]}
          style={{
            pointerEvents: "none",
          }}
          center
          distanceFactor={8}
        >
          <div
            className={`${
              isMobile ? "p-2" : isTablet ? "p-3" : "p-4 sm:p-6"
            } rounded-xl sm:rounded-2xl shadow-2xl whitespace-nowrap backdrop-blur-md bg-white/95 text-gray-900 border-gray-300 dark:bg-gray-900/95 dark:text-white dark:border-gray-700 border-2 ${
              hoveredBar.type === "bid"
                ? `${isMobile ? "ring-2" : "ring-4"} ring-green-500/30`
                : `${isMobile ? "ring-2" : "ring-4"} ring-red-500/30`
            }`}
            style={{
              transform: `${tooltipStyles.transform} scale(${tooltipStyles.scale})`,
              position: "absolute",
              minWidth: tooltipStyles.minWidth,
              fontSize: tooltipStyles.fontSize,
              fontWeight: "600",
              zIndex: 10000,
              lineHeight: "1.5",
            }}
          >
            <div
              className={`font-bold ${
                isMobile
                  ? "text-sm mb-1"
                  : isTablet
                  ? "text-lg mb-2"
                  : "text-xl sm:text-2xl mb-3"
              } ${
                hoveredBar.type === "bid" ? "text-green-500" : "text-red-500"
              }`}
            >
              {hoveredBar.type === "bid" ? "BUY" : "SELL"} ORDER
            </div>
            <div
              className={isMobile ? "space-y-0.5" : "space-y-1 sm:space-y-2"}
            >
              <div className="flex justify-between items-center gap-2 sm:gap-4">
                <span
                  className={`text-gray-400 ${
                    isMobile
                      ? "text-xs"
                      : isTablet
                      ? "text-sm"
                      : "text-base sm:text-lg"
                  }`}
                >
                  Price:
                </span>
                <span
                  className={`font-mono font-bold ${
                    isMobile
                      ? "text-xs"
                      : isTablet
                      ? "text-base"
                      : "text-lg sm:text-xl"
                  }`}
                >
                  ${hoveredBar.price.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center gap-2 sm:gap-4">
                <span
                  className={`text-gray-400 ${
                    isMobile
                      ? "text-xs"
                      : isTablet
                      ? "text-sm"
                      : "text-base sm:text-lg"
                  }`}
                >
                  Quantity:
                </span>
                <span
                  className={`font-mono font-bold ${
                    isMobile
                      ? "text-xs"
                      : isTablet
                      ? "text-base"
                      : "text-lg sm:text-xl"
                  }`}
                >
                  {hoveredBar.quantity.toFixed(4)}
                </span>
              </div>
              <div className="flex justify-between items-center gap-2 sm:gap-4">
                <span
                  className={`text-gray-400 ${
                    isMobile
                      ? "text-xs"
                      : isTablet
                      ? "text-sm"
                      : "text-base sm:text-lg"
                  }`}
                >
                  Time:
                </span>
                <span
                  className={`font-mono ${
                    isMobile
                      ? "text-xs"
                      : isTablet
                      ? "text-base"
                      : "text-lg sm:text-xl"
                  }`}
                >
                  {hoveredBar.time.toLocaleTimeString('en-US', { 
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </span>
              </div>
            </div>
          </div>
        </Html>
      )}

      {/* Professional spread indicator */}
      <mesh position={[0, 0, Math.min(50, maxSnapshots)]}>
        <planeGeometry args={[0.05, 15, 1, 1]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.3}
        />
      </mesh>
      
      {/* Market depth grid lines */}
      {[0, 3, 6, 9, 12, 15].map((y, i) => (
        <mesh key={`grid-y-${i}`} position={[0, y, Math.min(50, maxSnapshots)]}>
          <planeGeometry args={[80, 0.02, 1, 1]} />
          <meshBasicMaterial
            color="#333333"
            transparent
            opacity={0.15}
          />
        </mesh>
      ))}
    </group>
  );
};

export default OrderbookBars;
