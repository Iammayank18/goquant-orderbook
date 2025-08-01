import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import dynamic from "next/dynamic";
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera, Stats, OrbitControls } from "@react-three/drei";
import { FilterSettings, VenueType, PressureZone } from "@/types/orderbook";
import { useOrderbookData } from "@/hooks/useOrderbookData";
import { PressureZoneDetector } from "@/utils/pressureZoneDetector";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Activity,
  Settings,
  Menu,
  X,
  TrendingUp,
  TrendingDown,
  Moon,
  Sun,
  Wifi,
  WifiOff,
  Info,
  RefreshCw,
} from "lucide-react";

// Lazy load heavy components
const Orderbook3DScene = dynamic(
  () => import("@/components/orderbook-final/Orderbook3DScene"),
  { ssr: false }
);

const ProfessionalControlPanel = dynamic(
  () => import("@/components/orderbook-professional/ProfessionalControlPanel"),
  { ssr: false }
);

const ProfessionalLegend = dynamic(
  () => import("@/components/orderbook-professional/ProfessionalLegend"),
  { ssr: false }
);

interface ViewSettings {
  autoRotate: boolean;
  showGrid: boolean;
  showAxes: boolean;
  cameraDistance: number;
  showOrderFlow: boolean;
  showImbalance: boolean;
  showSpread: boolean;
}

export default function OrderbookProfessionalPage() {
  const [mounted, setMounted] = useState(false);
  const [symbol] = useState("BTCUSDT");
  const [showStats, setShowStats] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [showLegend, setShowLegend] = useState(true);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isDark, setIsDark] = useState(true);

  // Responsive breakpoints
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");

  // Initialize dark mode
  useEffect(() => {
    setMounted(true);

    // Check for saved preference or default to dark
    const savedDarkMode = localStorage.getItem("darkMode");
    const prefersDark = savedDarkMode ? savedDarkMode === "true" : true;

    setIsDark(prefersDark);
    if (prefersDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Initialize legend visibility based on screen size
    if (window.innerWidth < 640) {
      setShowLegend(false);
    }
  }, []);

  // View settings
  const [viewSettings, setViewSettings] = useState<ViewSettings>({
    autoRotate: true,
    showGrid: true,
    showAxes: true,
    cameraDistance: 80,
    showOrderFlow: false,
    showImbalance: false,
    showSpread: true,
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
        // console.error("Error detecting pressure zones:", error);
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

  const toggleDarkMode = useCallback(() => {
    const newDarkMode = !isDark;
    setIsDark(newDarkMode);

    if (newDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    localStorage.setItem("darkMode", String(newDarkMode));
  }, [isDark]);

  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">
            Loading orderbook visualization...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !isConnected) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <WifiOff className="h-5 w-5" />
              Connection Error
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={reconnect} className="w-full gap-2">
              <RefreshCw className="h-4 w-4" />
              Reconnect
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Main Content Area */}
      <div className="flex h-full flex-col">
        {/* Professional Header */}
        <header className="flex-shrink-0 border-b bg-card">
          <div className="flex h-14 items-center px-4 lg:px-6">
            {isMobile ? (
              // Mobile Header
              <>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-semibold">3D Order Book</h1>
                  <Badge
                    variant={isConnected ? "default" : "destructive"}
                    className="gap-1"
                  >
                    {isConnected ? (
                      <Wifi className="h-3 w-3" />
                    ) : (
                      <WifiOff className="h-3 w-3" />
                    )}
                  </Badge>
                </div>
                <div className="ml-auto flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleDarkMode}
                    className="h-8 w-8"
                  >
                    {isDark ? (
                      <Sun className="h-4 w-4" />
                    ) : (
                      <Moon className="h-4 w-4" />
                    )}
                  </Button>
                  <Sheet open={showControls} onOpenChange={setShowControls}>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Menu className="h-4 w-4" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="w-full flex flex-col">
                      <SheetHeader className="flex-shrink-0">
                        <SheetTitle>Settings</SheetTitle>
                        <SheetDescription>
                          Customize your visualization
                        </SheetDescription>
                      </SheetHeader>
                      <div className="flex-1 overflow-y-auto px-6 pb-6">
                        <ProfessionalControlPanel
                          viewSettings={viewSettings}
                          filterSettings={filterSettings}
                          stats={stats}
                          onViewSettingsChange={setViewSettings}
                          onFilterSettingsChange={setFilterSettings}
                        />
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </>
            ) : (
              // Desktop Header
              <>
                <div className="flex items-center gap-4">
                  <h1 className="text-xl font-semibold">3D Order Book</h1>
                  <Badge
                    variant={isConnected ? "default" : "destructive"}
                    className="gap-1"
                  >
                    {isConnected ? (
                      <Wifi className="h-3 w-3" />
                    ) : (
                      <WifiOff className="h-3 w-3" />
                    )}
                    {isConnected ? "Connected" : "Disconnected"}
                  </Badge>
                </div>

                {/* Center Info */}
                {!isTablet && (
                  <div className="flex flex-1 items-center justify-center gap-6">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Symbol:
                      </span>
                      <span className="font-mono font-semibold">{symbol}</span>
                    </div>
                    <Separator orientation="vertical" className="h-6" />
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Price:
                      </span>
                      <span className="font-mono font-semibold">
                        ${metrics.midPrice.toFixed(2)}
                      </span>
                      <Badge
                        variant={
                          metrics.imbalance > 0 ? "default" : "destructive"
                        }
                        className="ml-1 gap-1"
                      >
                        {metrics.imbalance > 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {(Math.abs(metrics.imbalance) * 100).toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Right Actions */}
                <div className="ml-auto flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowLegend(!showLegend)}
                    title={showLegend ? "Hide legend" : "Show legend"}
                    className="hidden sm:inline-flex"
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleDarkMode}
                    title="Toggle dark mode"
                  >
                    {isDark ? (
                      <Sun className="h-4 w-4" />
                    ) : (
                      <Moon className="h-4 w-4" />
                    )}
                  </Button>
                  <Sheet open={showControls} onOpenChange={setShowControls}>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Settings className="h-4 w-4" />
                        <span className="hidden sm:inline">Settings</span>
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="w-full sm:max-w-lg flex flex-col">
                      <SheetHeader className="flex-shrink-0">
                        <SheetTitle>Visualization Settings</SheetTitle>
                        <SheetDescription>
                          Customize your 3D orderbook visualization
                        </SheetDescription>
                      </SheetHeader>
                      <div className="flex-1 overflow-y-auto px-6 pb-6">
                        <ProfessionalControlPanel
                          viewSettings={viewSettings}
                          filterSettings={filterSettings}
                          stats={stats}
                          onViewSettingsChange={setViewSettings}
                          onFilterSettingsChange={setFilterSettings}
                        />
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Metrics Bar */}
        {isMobile ? (
          // Mobile Metrics - Compact View
          <div className="flex-shrink-0 border-b bg-card/50 px-4 py-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono font-medium">
                  ${metrics.midPrice.toFixed(2)}
                </span>
                <Badge
                  variant={metrics.imbalance > 0 ? "default" : "destructive"}
                  className="h-5 gap-0.5"
                >
                  {metrics.imbalance > 0 ? (
                    <TrendingUp className="h-2.5 w-2.5" />
                  ) : (
                    <TrendingDown className="h-2.5 w-2.5" />
                  )}
                  {(Math.abs(metrics.imbalance) * 100).toFixed(0)}%
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Sprd:</span>
                <span className="font-mono">${metrics.spread.toFixed(2)}</span>
              </div>
            </div>
          </div>
        ) : (
          // Desktop Metrics - Full View
          <div className="flex-shrink-0 border-b bg-card/50 px-4 py-2">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Spread:</span>
                <span className="font-mono font-medium">
                  ${metrics.spread.toFixed(2)}
                </span>
              </div>
              <Separator
                orientation="vertical"
                className="h-4 hidden sm:block"
              />
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Bid Vol:</span>
                <span className="font-mono font-medium text-green-600 dark:text-green-400">
                  {metrics.bidVolume.toFixed(2)}
                </span>
              </div>
              <Separator
                orientation="vertical"
                className="h-4 hidden sm:block"
              />
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Ask Vol:</span>
                <span className="font-mono font-medium text-red-600 dark:text-red-400">
                  {metrics.askVolume.toFixed(2)}
                </span>
              </div>
              <Separator
                orientation="vertical"
                className="h-4 hidden lg:block"
              />
              <div className="flex items-center gap-2 hidden lg:flex">
                <span className="text-muted-foreground">Active Venues:</span>
                <div className="flex gap-1">
                  {activeVenues.map((venue) => (
                    <Badge key={venue} variant="secondary" className="text-xs">
                      {venue}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3D Visualization Container */}
        <div className="flex-1 relative min-h-0 bg-gradient-to-br from-slate-950 via-blue-950/20 to-slate-950">
          {/* Legend - Hidden on mobile, positioned differently on tablet */}
          {showLegend && !isMobile && (
            <div
              className={cn(
                "absolute z-20",
                isTablet ? "right-4 top-4" : "left-4 top-4"
              )}
            >
              <ProfessionalLegend metrics={metrics} />
            </div>
          )}

          {/* Canvas */}
          <Canvas
            shadows={!isMobile}
            dpr={isMobile ? [1, 1] : [1, 2]}
            className={cn(
              "absolute inset-0",
              isInteracting ? "cursor-grabbing" : "cursor-grab"
            )}
            gl={{
              antialias: !isMobile,
              powerPreference: isMobile ? "default" : "high-performance",
              alpha: true,
              stencil: false,
              depth: true,
            }}
            onPointerDown={() => setIsInteracting(true)}
            onPointerUp={() => setIsInteracting(false)}
            onPointerLeave={() => setIsInteracting(false)}
          >
            <PerspectiveCamera
              makeDefault
              position={[0, isMobile ? 30 : 40, viewSettings.cameraDistance]}
              fov={isMobile ? 60 : 50}
            />

            <Orderbook3DScene
              snapshots={snapshots}
              pressureZones={pressureZones}
              viewSettings={viewSettings}
              filterSettings={filterSettings}
              isMobile={isMobile}
            />

            <OrbitControls
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              zoomSpeed={0.7}
              rotateSpeed={isMobile ? 0.8 : 0.5}
              minDistance={isMobile ? 30 : 40}
              maxDistance={isMobile ? 120 : 200}
              maxPolarAngle={Math.PI * 0.85}
              minPolarAngle={Math.PI * 0.1}
              enableDamping={true}
              dampingFactor={0.05}
              target={[0, 7, 25]}
            />

            {showStats && !isMobile && (
              <Stats className="!bottom-4 !left-4 !top-auto" />
            )}
          </Canvas>

          {/* Bottom Controls */}
          <div
            className={cn(
              "absolute z-20 flex items-center gap-2",
              isMobile ? "bottom-2 right-2" : "bottom-4 right-4"
            )}
          >
            {/* Mobile Legend Toggle */}
            {isMobile && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowLegend(!showLegend)}
                className="h-8 w-8"
              >
                <Info className="h-4 w-4" />
              </Button>
            )}

            {/* Performance Toggle - Desktop only */}
            {!isMobile && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowStats(!showStats)}
                className="gap-2"
              >
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {showStats ? "Hide" : "Show"} Stats
                </span>
              </Button>
            )}
          </div>

          {/* Mobile Legend Overlay */}
          {isMobile && showLegend && (
            <div className="absolute left-4 right-4 bottom-20 z-20">
              <Card className="bg-card/95 backdrop-blur-sm border shadow-lg">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded bg-green-500" />
                        <span>Bids</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded bg-red-500" />
                        <span>Asks</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowLegend(false)}
                      className="h-6 w-6 -mr-1"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
