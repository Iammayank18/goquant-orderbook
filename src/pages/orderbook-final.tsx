import React, { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera, Stats, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { FilterSettings, VenueType, PressureZone } from "@/types/orderbook";
import { useOrderbookData } from "@/hooks/useOrderbookDataFinal";
import { PressureZoneDetector } from "@/utils/pressureZoneDetector";
import { cn } from "@/lib/utils";

const Orderbook3DScene = dynamic(
  () => import("@/components/orderbook-final/Orderbook3DScene"),
  {
    ssr: false,
  }
);

const ControlPanel = dynamic(
  () => import("@/components/orderbook-final/ControlPanel"),
  {
    ssr: false,
  }
);

const MobileControlOverlay = dynamic(
  () => import("@/components/orderbook-final/MobileControlOverlay"),
  {
    ssr: false,
  }
);

const StatusBar = dynamic(
  () => import("@/components/orderbook-final/StatusBar"),
  {
    ssr: false,
  }
);

const ControlsHelp = dynamic(
  () => import("@/components/orderbook-final/ControlsHelp"),
  {
    ssr: false,
  }
);

export default function OrderbookFinalPage() {
  const [mounted, setMounted] = useState(false);
  const [symbol] = useState("BTCUSDT");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [showStats, setShowStats] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);

  // View settings
  const [viewSettings, setViewSettings] = useState({
    autoRotate: true,
    showGrid: true,
    showAxes: true,
    cameraDistance: 50,
    showOrderFlow: false,
    showImbalance: false,
  });

  // Filter settings
  const [filterSettings, setFilterSettings] = useState<FilterSettings>({
    venues: ["binance"] as VenueType[],
    priceRange: [0, 100000],
    quantityThreshold: 0,
    timeRange: 300,
    showPressureZones: true,
    showVolumeProfile: true,
  });

  useEffect(() => {
    setMounted(true);
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);

    // Handle orientation change
    const handleOrientationChange = () => {
      setTimeout(checkMobile, 100);
    };
    window.addEventListener("orientationchange", handleOrientationChange);

    // Keyboard shortcuts
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case "h":
          if (!e.ctrlKey && !e.metaKey) {
            setShowHelp((prev) => !prev);
          }
          break;
        case "r":
          if (!e.ctrlKey && !e.metaKey) {
            setViewSettings((prev) => ({
              ...prev,
              autoRotate: !prev.autoRotate,
            }));
          }
          break;
        case "g":
          if (!e.ctrlKey && !e.metaKey) {
            setViewSettings((prev) => ({ ...prev, showGrid: !prev.showGrid }));
          }
          break;
        case "a":
          if (!e.ctrlKey && !e.metaKey) {
            setViewSettings((prev) => ({ ...prev, showAxes: !prev.showAxes }));
          }
          break;
        case "s":
          if (!e.ctrlKey && !e.metaKey) {
            setShowStats((prev) => !prev);
          }
          break;
        case "t":
          if (!e.ctrlKey && !e.metaKey) {
            setTheme((prev) => (prev === "dark" ? "light" : "dark"));
          }
          break;
        case "escape":
          setShowHelp(false);
          setShowControls(false);
          break;
      }
    };
    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("resize", checkMobile);
      window.removeEventListener("orientationchange", handleOrientationChange);
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, []);

  // Get orderbook data
  const { snapshots, isConnected, activeVenues, error, reconnect, stats } =
    useOrderbookData(symbol, filterSettings);

  // Pressure zone detection
  const pressureZoneDetector = useMemo(() => new PressureZoneDetector(), []);

  const pressureZones = useMemo(() => {
    if (!filterSettings.showPressureZones || snapshots.length === 0) return [];

    const allZones: PressureZone[] = [];
    const recentSnapshots = snapshots.slice(-10);

    recentSnapshots.forEach((snapshot) => {
      try {
        const zones = pressureZoneDetector.detectPressureZones(snapshot);
        allZones.push(...zones);
      } catch (error) {
        console.error("Error detecting pressure zones:", error);
      }
    });

    return allZones.sort((a, b) => b.intensity - a.intensity).slice(0, 10);
  }, [snapshots, filterSettings.showPressureZones, pressureZoneDetector]);

  // Calculate metrics
  const metrics = useMemo(() => {
    if (snapshots.length === 0)
      return {
        midPrice: 0,
        spread: 0,
        bidVolume: 0,
        askVolume: 0,
        imbalance: 0,
      };

    const latest = snapshots[snapshots.length - 1];
    const midPrice = (latest.bids[0]?.price + latest.asks[0]?.price) / 2 || 0;
    const spread = latest.asks[0]?.price - latest.bids[0]?.price || 0;

    const bidVolume = latest.bids
      .slice(0, 10)
      .reduce((sum, bid) => sum + bid.quantity, 0);
    const askVolume = latest.asks
      .slice(0, 10)
      .reduce((sum, ask) => sum + ask.quantity, 0);
    const totalVolume = bidVolume + askVolume;
    const imbalance =
      totalVolume > 0 ? (bidVolume - askVolume) / totalVolume : 0;

    return { midPrice, spread, bidVolume, askVolume, imbalance };
  }, [snapshots]);

  if (!mounted) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex h-screen overflow-hidden relative",
        theme === "dark" ? "bg-gray-950 text-white" : "bg-gray-50 text-gray-900"
      )}
    >
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Status Bar */}
        <StatusBar
          symbol={symbol}
          isConnected={isConnected}
          activeVenues={activeVenues}
          error={error}
          metrics={metrics}
          pressureBalance={pressureZoneDetector.analyzePressureBalance(
            pressureZones
          )}
          theme={theme}
          onReconnect={reconnect}
        />

        {/* 3D Visualization */}
        <div className="flex-1 relative group">
          {/* Interactive Hint */}
          <div
            className={cn(
              "absolute top-4 left-4 pointer-events-none transition-opacity duration-300 z-10",
              "group-hover:opacity-100 opacity-0"
            )}
          >
            <div
              className={cn(
                "px-3 py-2 rounded-lg text-xs backdrop-blur-sm",
                theme === "dark"
                  ? "bg-gray-800/80 text-gray-300"
                  : "bg-white/80 text-gray-700"
              )}
            >
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                  />
                </svg>
                <span>
                  Click and drag to rotate • Scroll to zoom • Right-click to pan
                </span>
              </div>
            </div>
          </div>

          <Canvas
            shadows
            dpr={isMobile ? [1, 1] : [1, 2]}
            className={cn(
              "w-full h-full",
              isInteracting ? "cursor-grabbing" : "cursor-grab"
            )}
            gl={{ antialias: !isMobile, powerPreference: "high-performance" }}
            onPointerDown={() => setIsInteracting(true)}
            onPointerUp={() => setIsInteracting(false)}
            onPointerLeave={() => setIsInteracting(false)}
          >
            <PerspectiveCamera
              makeDefault
              position={[0, isMobile ? 20 : 30, viewSettings.cameraDistance]}
              fov={isMobile ? 70 : 60}
            />

            <Orderbook3DScene
              snapshots={snapshots}
              pressureZones={pressureZones}
              viewSettings={viewSettings}
              filterSettings={filterSettings}
              theme={theme}
              isMobile={isMobile}
            />

            <OrbitControls
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              zoomSpeed={isMobile ? 0.8 : 0.5}
              panSpeed={0.5}
              rotateSpeed={isMobile ? 0.8 : 0.5}
              minDistance={isMobile ? 15 : 20}
              maxDistance={isMobile ? 80 : 100}
              mouseButtons={{
                LEFT: THREE.MOUSE.ROTATE,
                MIDDLE: THREE.MOUSE.DOLLY,
                RIGHT: THREE.MOUSE.PAN,
              }}
              touches={{
                ONE: THREE.TOUCH.ROTATE,
                TWO: THREE.TOUCH.DOLLY_PAN,
              }}
              enableDamping={true}
              dampingFactor={0.05}
            />

            {showStats && <Stats />}
          </Canvas>

          {/* Bottom Controls */}
          <div className="absolute bottom-4 right-4 flex items-center gap-2">
            {/* Help Button */}
            <button
              onClick={() => setShowHelp(true)}
              className={cn(
                "p-2 rounded-lg shadow-lg",
                theme === "dark"
                  ? "bg-gray-800/90 text-gray-400 hover:bg-gray-700 backdrop-blur-sm"
                  : "bg-white/90 text-gray-600 hover:bg-gray-100 backdrop-blur-sm"
              )}
              title="Show navigation controls"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>

            {/* Performance Toggle */}
            <button
              onClick={() => setShowStats(!showStats)}
              className={cn(
                "px-3 py-1 rounded text-xs",
                theme === "dark"
                  ? "bg-gray-800 text-gray-400 hover:bg-gray-700"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              )}
            >
              {showStats ? "Hide" : "Show"} Stats
            </button>
          </div>

          {/* Mobile Controls */}
          {isMobile && (
            <>
              {/* Menu Toggle */}
              <button
                onClick={() => setShowControls(!showControls)}
                className={cn(
                  "absolute top-4 right-4 p-3 rounded-full shadow-lg z-30",
                  theme === "dark"
                    ? "bg-gray-800/90 text-white backdrop-blur-sm"
                    : "bg-white/90 text-gray-900 backdrop-blur-sm"
                )}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {showControls ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>

              {/* Quick Actions Bar */}
              <div
                className={cn(
                  "absolute bottom-20 left-4 right-4 flex gap-2 justify-center",
                  "transition-opacity duration-300",
                  showControls ? "opacity-0 pointer-events-none" : "opacity-100"
                )}
              >
                <button
                  onClick={() =>
                    setViewSettings({
                      ...viewSettings,
                      autoRotate: !viewSettings.autoRotate,
                    })
                  }
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium shadow-lg backdrop-blur-sm",
                    viewSettings.autoRotate
                      ? "bg-blue-600/90 text-white"
                      : theme === "dark"
                      ? "bg-gray-800/90 text-gray-300"
                      : "bg-white/90 text-gray-700"
                  )}
                >
                  {viewSettings.autoRotate ? "Auto-Rotating" : "Rotation Off"}
                </button>

                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium shadow-lg backdrop-blur-sm",
                    theme === "dark"
                      ? "bg-gray-800/90 text-gray-300"
                      : "bg-white/90 text-gray-700"
                  )}
                >
                  {theme === "dark" ? "☀️" : "🌙"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Control Panel - Desktop */}
      {!isMobile && (
        <ControlPanel
          viewSettings={viewSettings}
          filterSettings={filterSettings}
          theme={theme}
          stats={stats}
          onViewSettingsChange={setViewSettings}
          onFilterSettingsChange={setFilterSettings}
          onThemeChange={setTheme}
        />
      )}

      {/* Control Panel - Mobile */}
      {isMobile && showControls && (
        <MobileControlOverlay
          viewSettings={viewSettings}
          filterSettings={filterSettings}
          theme={theme}
          stats={stats}
          onViewSettingsChange={setViewSettings}
          onFilterSettingsChange={setFilterSettings}
          onThemeChange={setTheme}
          onClose={() => setShowControls(false)}
        />
      )}

      {/* Controls Help Overlay */}
      {showHelp && (
        <ControlsHelp theme={theme} onClose={() => setShowHelp(false)} />
      )}
    </div>
  );
}
