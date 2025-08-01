import React, { useState, useEffect, Suspense, lazy } from "react";
import dynamic from "next/dynamic";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Stats } from "@react-three/drei";
import { useOptimizedOrderbook } from "@/hooks/useOptimizedOrderbook";
import { FilterSettings, VenueType } from "@/types/orderbook";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Wifi, WifiOff, Maximize2, Minimize2, Settings2 } from "lucide-react";

// Lazy load components
const ModernOrderbook3D = dynamic(
  () => import("@/components/modern-orderbook/ModernOrderbook3D"),
  { ssr: false }
);

const ModernDashboard = dynamic(
  () => import("@/components/modern-orderbook/ModernDashboard"),
  { ssr: false }
);

interface ViewSettings {
  autoRotate: boolean;
  showGrid: boolean;
  showAxes: boolean;
  showOrderFlow: boolean;
}

export default function ModernOrderbookPage() {
  const [mounted, setMounted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showDashboard, setShowDashboard] = useState(true);

  const [viewSettings, setViewSettings] = useState<ViewSettings>({
    autoRotate: true,
    showGrid: true,
    showAxes: true,
    showOrderFlow: false,
  });

  const [filterSettings] = useState<FilterSettings>({
    venues: ["binance"] as VenueType[],
    priceRange: [0, 100000],
    quantityThreshold: 0,
    timeRange: 300,
    showPressureZones: false,
    showVolumeProfile: false,
  });

  const { snapshots, isConnected, error, reconnect, stats } = useOptimizedOrderbook(
    "BTCUSDT",
    filterSettings
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (!mounted) {
    return (
      <div className="h-screen w-full bg-slate-950 flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-slate-700 border-t-cyan-500 rounded-full animate-spin" />
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-b-pink-500 rounded-full animate-spin animate-reverse" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-slate-950 text-white overflow-hidden flex flex-col">
      {/* Minimal Header */}
      <header className="flex-shrink-0 h-14 border-b border-slate-800 backdrop-blur-md bg-slate-900/50">
        <div className="h-full px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent">
              Quantum Orderbook
            </h1>
            <div className={cn(
              "flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium",
              isConnected 
                ? "bg-green-500/10 text-green-500 border border-green-500/20" 
                : "bg-red-500/10 text-red-500 border border-red-500/20"
            )}>
              {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isConnected ? "Live" : "Offline"}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setShowDashboard(!showDashboard)}
              className="h-8 w-8"
            >
              <Settings2 className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={toggleFullscreen}
              className="h-8 w-8"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 relative">
        {/* 3D Visualization */}
        <div className="absolute inset-0">
          <Canvas
            shadows
            dpr={[1, 2]}
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: "high-performance",
            }}
          >
            <PerspectiveCamera
              makeDefault
              position={[30, 30, 60]}
              fov={50}
            />
            
            <Suspense fallback={null}>
              <ModernOrderbook3D
                snapshots={snapshots}
                maxLevels={15}
                maxTimeSteps={30}
                showParticles={viewSettings.showOrderFlow}
              />
            </Suspense>

            <OrbitControls
              enablePan={true}
              enableZoom={true}
              enableRotate={!viewSettings.autoRotate}
              minDistance={20}
              maxDistance={200}
              maxPolarAngle={Math.PI * 0.85}
              minPolarAngle={Math.PI * 0.1}
              enableDamping
              dampingFactor={0.05}
              rotateSpeed={0.7}
              panSpeed={0.8}
            />

            {showStats && <Stats className="!bottom-4 !left-4" />}
          </Canvas>
        </div>

        {/* Dashboard Overlay */}
        {showDashboard && (
          <div className="absolute top-4 left-4 right-4 max-w-6xl mx-auto pointer-events-none">
            <div className="pointer-events-auto">
              <ModernDashboard
                snapshots={snapshots}
                isConnected={isConnected}
                stats={stats}
                viewSettings={viewSettings}
                onViewSettingsChange={setViewSettings}
              />
            </div>
          </div>
        )}

        {/* Performance Toggle */}
        <div className="absolute bottom-4 right-4">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowStats(!showStats)}
            className="text-xs bg-slate-900/80 backdrop-blur"
          >
            {showStats ? "Hide" : "Show"} Performance
          </Button>
        </div>

        {/* Error State */}
        {error && !isConnected && (
          <div className="absolute bottom-4 left-4 max-w-sm">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-sm text-red-400 mb-2">{error}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={reconnect}
                className="text-xs"
              >
                Reconnect
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}