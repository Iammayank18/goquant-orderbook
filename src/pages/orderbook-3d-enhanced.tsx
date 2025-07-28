import React, { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera, Grid, Stats } from "@react-three/drei";
import { FilterSettings, VenueType, PressureZone } from "@/types/orderbook";
import { useOrderbookTestData } from "@/hooks/useOrderbookTestData";
import { useResponsive } from "@/hooks/useResponsive";
import { PressureZoneDetector } from "@/utils/pressureZoneDetector";
import ControlPanelEnhanced from "@/components/orderbook/ControlPanelEnhanced";
import Orderbook3DEnhanced from "@/components/orderbook/Orderbook3DEnhanced";
import PressureZoneEnhanced from "@/components/orderbook/PressureZoneEnhanced";
import VolumeProfileEnhanced from "@/components/orderbook/VolumeProfileEnhanced";
import CameraController from "@/components/orderbook/CameraController";
import TouchControls from "@/components/orderbook/TouchControls";
import OrderFlowAnimation from "@/components/orderbook/OrderFlowAnimation";
import OrderImbalanceIndicator from "@/components/orderbook/OrderImbalanceIndicator";
import ErrorBoundary from "@/components/ErrorBoundary";
import {
  Loader2,
  AlertCircle,
  Menu,
  X,
  Download,
  WifiOff,
  Wifi,
} from "lucide-react";

const Orderbook3DEnhancedPage: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [symbol] = useState("BTCUSDT");
  const [autoRotate, setAutoRotate] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [showOrderFlow, setShowOrderFlow] = useState(false);
  const [showImbalance, setShowImbalance] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [cameraDistance, setCameraDistance] = useState(50);
  const { isMobile } = useResponsive();

  const [settings, setSettings] = useState<FilterSettings>({
    venues: ["binance"] as VenueType[],
    priceRange: [0, 100000],
    quantityThreshold: 0,
    timeRange: 300,
    showPressureZones: true,
    showVolumeProfile: true,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    snapshots,
    isConnected,
    activeVenues,
    error,
    reconnect,
    clearSnapshots,
  } = useOrderbookTestData(symbol, settings);

  const pressureZoneDetector = useMemo(() => new PressureZoneDetector(), []);

  const pressureZones = useMemo(() => {
    if (!settings.showPressureZones || snapshots.length === 0) return [];

    const allZones: PressureZone[] = [];
    const recentSnapshots = snapshots.slice(-10); // Analyze last 10 snapshots

    recentSnapshots.forEach((snapshot) => {
      try {
        const zones = pressureZoneDetector.detectPressureZones(snapshot);
        allZones.push(...zones);
      } catch (error) {
        console.error("Error detecting pressure zones:", error);
      }
    });

    // Aggregate and sort zones by intensity
    return allZones.sort((a, b) => b.intensity - a.intensity).slice(0, 10); // Top 10 pressure zones
  }, [snapshots, settings.showPressureZones, pressureZoneDetector]);

  const midPrice = useMemo(() => {
    if (!mounted || snapshots.length === 0) return 0;
    const latest = snapshots[snapshots.length - 1];
    return (latest.bids[0]?.price + latest.asks[0]?.price) / 2 || 0;
  }, [snapshots, mounted]);

  const pressureBalance = useMemo(() => {
    return pressureZoneDetector.analyzePressureBalance(pressureZones);
  }, [pressureZones, pressureZoneDetector]);

  const handleSettingsChange = (updates: Partial<FilterSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  const handleZoomIn = () => {
    setCameraDistance((prev) => Math.max(10, prev * 0.8));
  };

  const handleZoomOut = () => {
    setCameraDistance((prev) => Math.min(150, prev * 1.2));
  };

  const handleReset = () => {
    setAutoRotate(true);
    setShowGrid(true);
    setShowOrderFlow(false);
    setShowImbalance(false);
    setCameraDistance(50);
    setSettings({
      venues: ["binance"] as VenueType[],
      priceRange: [0, 100000],
      quantityThreshold: 0,
      timeRange: 300,
      showPressureZones: true,
      showVolumeProfile: true,
    });
    clearSnapshots();
  };

  const handleExport = () => {
    const exportData = {
      timestamp: Date.now(),
      symbol,
      snapshots: snapshots.slice(-50),
      pressureZones,
      pressureBalance,
      settings,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orderbook-${symbol}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className={`flex h-screen ${
        theme === "dark" ? "bg-black" : "bg-gray-50"
      } relative`}
    >
      <div className="flex-1 relative">
        {/* Status Bar */}
        <div className="absolute top-4 left-4 z-10 space-y-2">
          <div
            className={`${
              theme === "dark" ? "bg-gray-900" : "bg-white"
            } rounded-lg px-4 py-2 border ${
              theme === "dark" ? "border-gray-800" : "border-gray-200"
            } shadow-lg`}
          >
            <h1
              className={`${
                theme === "dark" ? "text-white" : "text-gray-900"
              } text-xl font-bold`}
            >
              {symbol} 3D Orderbook
            </h1>
            <div className="flex items-center gap-4 mt-1">
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <Wifi className="w-4 h-4 text-green-500" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-500" />
                )}
                <span
                  className={`text-sm ${
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {isConnected ? "Live" : "Disconnected"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm ${
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Venues: {activeVenues.join(", ") || "None"}
                </span>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-900/50 rounded-lg px-4 py-2 border border-red-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-red-400 text-sm">{error}</span>
              <button
                onClick={reconnect}
                className="ml-auto text-xs bg-red-800 px-2 py-1 rounded hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          )}

          {/* Market Stats */}
          <div
            className={`${
              theme === "dark" ? "bg-gray-900" : "bg-white"
            } rounded-lg px-4 py-2 border ${
              theme === "dark" ? "border-gray-800" : "border-gray-200"
            }`}
          >
            <div
              className={`text-sm ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Mid Price
            </div>
            <div
              className={`text-lg font-mono ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
              ${midPrice.toFixed(2)}
            </div>
          </div>

          {/* Pressure Balance */}
          {pressureBalance && (
            <div
              className={`${
                theme === "dark" ? "bg-gray-900" : "bg-white"
              } rounded-lg px-4 py-2 border ${
                theme === "dark" ? "border-gray-800" : "border-gray-200"
              }`}
            >
              <div
                className={`text-sm ${
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Pressure Balance
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div
                  className={`text-sm font-mono ${
                    pressureBalance.dominantSide === "bid"
                      ? "text-green-500"
                      : pressureBalance.dominantSide === "ask"
                      ? "text-red-500"
                      : theme === "dark"
                      ? "text-gray-400"
                      : "text-gray-600"
                  }`}
                >
                  {pressureBalance.dominantSide.toUpperCase()}{" "}
                  {(pressureBalance.imbalance * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          )}

          {/* Performance Stats */}
          <div
            className={`${
              theme === "dark" ? "bg-gray-900" : "bg-white"
            } rounded-lg px-4 py-2 border ${
              theme === "dark" ? "border-gray-800" : "border-gray-200"
            } text-xs`}
          >
            <div
              className={`${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Performance
            </div>
            <div
              className={`${
                theme === "dark" ? "text-gray-500" : "text-gray-500"
              }`}
            >
              Snapshots: {snapshots.length} | Zones: {pressureZones.length}
            </div>
          </div>
        </div>

        {/* 3D Visualization */}
        <div className="w-full h-full">
          {mounted && (
            <ErrorBoundary>
              <Canvas shadows dpr={[1, 2]}>
                <PerspectiveCamera
                  makeDefault
                  position={[0, 30, cameraDistance]}
                  fov={60}
                />

                {/* Lighting */}
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 20, 10]} intensity={1} castShadow />
                <directionalLight position={[-10, 20, -10]} intensity={0.5} />

                {/* Grid */}
                {showGrid && (
                  <Grid
                    args={[200, 200]}
                    position={[0, -0.1, 0]}
                    cellSize={5}
                    cellThickness={0.5}
                    cellColor={theme === "dark" ? "#333333" : "#cccccc"}
                    sectionSize={20}
                    sectionThickness={1}
                    sectionColor={theme === "dark" ? "#666666" : "#999999"}
                    fadeDistance={150}
                    fadeStrength={1}
                  />
                )}

                {/* Main 3D Orderbook */}
                <Orderbook3DEnhanced
                  snapshots={snapshots}
                  pressureZones={pressureZones}
                  autoRotate={autoRotate}
                  selectedVenues={settings.venues}
                  showPressureZones={settings.showPressureZones}
                  showOrderFlow={showOrderFlow}
                  timeRange={settings.timeRange}
                />

                {/* Pressure Zones */}
                <PressureZoneEnhanced
                  zones={pressureZones}
                  midPrice={midPrice}
                  visible={settings.showPressureZones}
                  showLabels={!isMobile}
                />

                {/* Volume Profile */}
                <VolumeProfileEnhanced
                  snapshots={snapshots}
                  visible={settings.showVolumeProfile}
                  priceBins={30}
                  showValueArea={true}
                />

                {/* Order Flow Animation */}
                <OrderFlowAnimation
                  snapshots={snapshots}
                  visible={showOrderFlow}
                  flowSpeed={1.5}
                  particleCount={150}
                />

                {/* Order Imbalance Indicator */}
                <OrderImbalanceIndicator
                  snapshots={snapshots}
                  visible={showImbalance}
                  position={[0, 40, 0]}
                />

                {/* Camera Controls */}
                <CameraController
                  autoRotate={autoRotate}
                  rotationSpeed={0.3}
                  enableDamping={true}
                  dampingFactor={0.05}
                  minDistance={10}
                  maxDistance={150}
                  cameraDistance={cameraDistance}
                />

                {/* Touch Controls for Mobile */}
                <TouchControls
                  enabled={isMobile}
                  rotationSpeed={0.01}
                  zoomSpeed={0.1}
                  minDistance={10}
                  maxDistance={150}
                />

                {/* Performance Stats */}
                <Stats className="!absolute !top-auto !left-auto !bottom-4 !right-4" />
              </Canvas>
            </ErrorBoundary>
          )}
        </div>

        {/* Mobile Controls Toggle */}
        {isMobile && (
          <button
            onClick={() => setShowControls(!showControls)}
            className="absolute top-4 right-4 z-20 bg-gray-900 rounded-lg p-2 border border-gray-800"
          >
            {showControls ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <Menu className="w-6 h-6 text-white" />
            )}
          </button>
        )}
      </div>

      {/* Control Panel */}
      <div
        className={`${
          isMobile
            ? `absolute inset-0 bg-black/90 z-30 transform transition-transform ${
                showControls ? "translate-x-0" : "translate-x-full"
              }`
            : ""
        }`}
      >
        <ControlPanelEnhanced
          settings={settings}
          onSettingsChange={handleSettingsChange}
          autoRotate={autoRotate}
          onAutoRotateToggle={() => setAutoRotate(!autoRotate)}
          showGrid={showGrid}
          onGridToggle={() => setShowGrid(!showGrid)}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onReset={handleReset}
          showOrderFlow={showOrderFlow}
          onOrderFlowToggle={() => setShowOrderFlow(!showOrderFlow)}
          showImbalance={showImbalance}
          onImbalanceToggle={() => setShowImbalance(!showImbalance)}
          theme={theme}
          onThemeToggle={() => setTheme(theme === "dark" ? "light" : "dark")}
          onExport={handleExport}
        />
      </div>
    </div>
  );
};

export default Orderbook3DEnhancedPage;
