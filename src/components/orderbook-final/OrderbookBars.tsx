import React, { useRef, useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { OrderbookSnapshot } from "@/types/orderbook";
import { Html } from "@react-three/drei";

interface OrderbookBarsProps {
  snapshots: OrderbookSnapshot[];
  theme: "dark" | "light";
  maxLevels?: number;
  maxSnapshots?: number;
}

const OrderbookBars: React.FC<OrderbookBarsProps> = ({
  snapshots,
  theme,
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
    const priceScale = Math.min(0.02, 60 / priceRange); // Dynamic scaling to fit within ±30 units

    recentSnapshots.forEach((snapshot, timeIndex) => {
      if (!snapshot.bids?.length || !snapshot.asks?.length) return;

      const midPrice = (snapshot.bids[0].price + snapshot.asks[0].price) / 2;
      const z = timeIndex * 1.5; // Further reduced spacing along time axis

      // Process bids
      snapshot.bids.slice(0, maxLevels).forEach((bid, levelIndex) => {
        const x = (bid.price - midPrice) * priceScale; // Dynamic scaling
        const height = Math.min(12, Math.log10(bid.quantity + 1) * 2.5); // Reduced height scale
        const opacity = 1 - (levelIndex / maxLevels) * 0.5;
        const position = new THREE.Vector3(x, height / 2, z);

        bids.push({
          position,
          scale: new THREE.Vector3(0.5, height, 0.5),
          color: new THREE.Color(0x00ff88).multiplyScalar(opacity),
        });

        // Store metadata for hover
        metadata.set(`bid-${bids.length - 1}`, {
          price: bid.price,
          quantity: bid.quantity,
          time: new Date(snapshot.timestamp),
          type: "bid",
        });
      });

      // Process asks
      snapshot.asks.slice(0, maxLevels).forEach((ask, levelIndex) => {
        const x = (ask.price - midPrice) * priceScale; // Dynamic scaling
        const height = Math.min(12, Math.log10(ask.quantity + 1) * 2.5); // Reduced height scale
        const opacity = 1 - (levelIndex / maxLevels) * 0.5;
        const position = new THREE.Vector3(x, height / 2, z);

        asks.push({
          position,
          scale: new THREE.Vector3(0.5, height, 0.5),
          color: new THREE.Color(0xff4444).multiplyScalar(opacity),
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
        onPointerMove={(e) => handlePointerMove(e, "ask")}
        onPointerOut={handlePointerOut}
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
            } rounded-xl sm:rounded-2xl shadow-2xl whitespace-nowrap backdrop-blur-md ${
              theme === "dark"
                ? "bg-gray-900/95 text-white border-gray-700"
                : "bg-white/95 text-gray-900 border-gray-300"
            } border-2 ${
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
                hoveredBar.type === "bid" ? "text-green-400" : "text-red-400"
              }`}
            >
              {hoveredBar.type.toUpperCase()} ORDER
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
                  {hoveredBar.time.toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        </Html>
      )}

      {/* Visual separator between bid and ask */}
      <mesh position={[0, 6, Math.min(75, maxSnapshots * 1.5 / 2)]}>
        <planeGeometry args={[0.05, 15, 1, 1]} />
        <meshBasicMaterial
          color={theme === "dark" ? "#444444" : "#cccccc"}
          transparent
          opacity={0.3}
        />
      </mesh>
    </group>
  );
};

export default OrderbookBars;
