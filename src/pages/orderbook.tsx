import React, { useState, useMemo, Suspense, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { FilterSettings, VenueType } from '@/types/orderbook';
import { useOrderbookWithTestData } from '@/hooks/useOrderbookWithTestData';
import { useResponsive } from '@/hooks/useResponsive';
import { useThrottledValue } from '@/hooks/useThrottledValue';
import ControlPanel from '@/components/orderbook/ControlPanel';
import ErrorBoundary from '@/components/ErrorBoundary';
import { PressureZoneDetector } from '@/utils/pressureZoneDetector';
import { AlertCircle, Loader2, Menu, X, TestTube } from 'lucide-react';

const OrderbookVisualization = dynamic(() => import('@/components/orderbook/OrderbookVisualization'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  )
});

const OrderbookPage: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [symbol] = useState('BTCUSDT');
  const [autoRotate, setAutoRotate] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [cameraDistance, setCameraDistance] = useState(40);
  const { isMobile } = useResponsive();
  const [settings, setSettings] = useState<FilterSettings>({
    venues: ['binance' as VenueType],
    priceRange: [0, 100000],
    quantityThreshold: 0,
    timeRange: 900,
    showPressureZones: true,
    showVolumeProfile: false
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const { snapshots: liveSnapshots, isConnected, error, isTestData } = useOrderbookWithTestData(symbol, settings);
  
  // Throttle snapshots to prevent performance issues
  const snapshots = useThrottledValue(liveSnapshots, 100);
  
  const pressureZoneDetector = useMemo(() => new PressureZoneDetector(), []);
  
  const pressureZones = useMemo(() => {
    if (!settings.showPressureZones || snapshots.length === 0) return [];
    
    const latestSnapshot = snapshots[snapshots.length - 1];
    if (!latestSnapshot || !latestSnapshot.bids || !latestSnapshot.asks) return [];
    
    try {
      return pressureZoneDetector.detectPressureZones(latestSnapshot);
    } catch (error) {
      console.error('Error detecting pressure zones:', error);
      return [];
    }
  }, [snapshots, settings.showPressureZones, pressureZoneDetector]);

  const midPrice = useMemo(() => {
    if (!mounted || snapshots.length === 0) return 0;
    const latest = snapshots[snapshots.length - 1];
    return (latest.bids[0]?.price + latest.asks[0]?.price) / 2 || 0;
  }, [snapshots, mounted]);

  const handleSettingsChange = (updates: Partial<FilterSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const handleZoomIn = () => {
    setCameraDistance(prev => Math.max(10, prev * 0.8));
  };

  const handleZoomOut = () => {
    setCameraDistance(prev => Math.min(100, prev * 1.2));
  };

  const handleReset = () => {
    setAutoRotate(true);
    setShowGrid(true);
    setSettings({
      venues: ['binance' as VenueType],
      priceRange: [0, 100000],
      quantityThreshold: 0,
      timeRange: 300,
      showPressureZones: true,
      showVolumeProfile: false
    });
  };

  return (
    <div className="flex h-screen bg-black relative">
      <div className="flex-1 relative">
        <div className="absolute top-4 left-4 z-10 space-y-2">
          <div className="bg-gray-900 rounded-lg px-4 py-2 border border-gray-800">
            <h1 className="text-white text-xl font-bold">{symbol} Orderbook</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : isTestData ? 'bg-yellow-500' : 'bg-red-500'}`} />
              <span className="text-gray-400 text-sm">
                {isConnected ? 'Connected' : isTestData ? 'Test Data' : 'Disconnected'}
              </span>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-900/50 rounded-lg px-4 py-2 border border-red-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}
          
          <div className="bg-gray-900 rounded-lg px-4 py-2 border border-gray-800">
            <div className="text-gray-400 text-sm">Mid Price</div>
            <div className="text-white text-lg font-mono">
              ${midPrice.toFixed(2)}
            </div>
          </div>
          
          <div className="bg-gray-900 rounded-lg px-4 py-2 border border-gray-800 text-xs">
            <div className="text-gray-400">Debug Info:</div>
            <div className="text-gray-500">Snapshots: {snapshots.length}</div>
            <div className="text-gray-500">Latest: {snapshots[snapshots.length - 1]?.bids?.length || 0} bids, {snapshots[snapshots.length - 1]?.asks?.length || 0} asks</div>
          </div>
          
          <button
            onClick={() => {
              // Generate test data
              if (typeof window !== 'undefined') {
                const testData = [];
                for (let i = 0; i < 5; i++) {
                  const snapshot = {
                    bids: Array.from({ length: 10 }, (_, j) => ({
                      price: 96000 - j * 10,
                      quantity: Math.random() * 5 + 1,
                      total: 0
                    })),
                    asks: Array.from({ length: 10 }, (_, j) => ({
                      price: 96000 + (j + 1) * 10,
                      quantity: Math.random() * 5 + 1,
                      total: 0
                    })),
                    timestamp: Date.now() - (4 - i) * 1000,
                    venue: 'binance' as any
                  };
                  testData.push(snapshot);
                }
                // Store test data in window for debugging
                (window as any).__testSnapshots = testData;
                console.log('Generated test data:', testData);
                alert('Test data generated! Check console for details.');
              }
            }}
            className="bg-purple-900/50 rounded-lg px-4 py-2 border border-purple-800 flex items-center gap-2 hover:bg-purple-800/50 transition-colors"
          >
            <TestTube className="w-4 h-4 text-purple-400" />
            <span className="text-purple-400 text-sm">Generate Test Data</span>
          </button>
        </div>

        <div className="w-full h-full">
          {mounted && (
            <ErrorBoundary>
              <Suspense fallback={
                <div className="w-full h-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              }>
                <OrderbookVisualization
              snapshots={snapshots}
              pressureZones={pressureZones}
              autoRotate={autoRotate}
              showGrid={showGrid}
              showPressureZones={settings.showPressureZones}
              showVolumeProfile={settings.showVolumeProfile}
              midPrice={midPrice}
              cameraDistance={cameraDistance}
              />
              </Suspense>
            </ErrorBoundary>
          )}
        </div>
        
        {isMobile && (
          <button
            onClick={() => setShowControls(!showControls)}
            className="absolute top-4 right-4 z-20 bg-gray-900 rounded-lg p-2 border border-gray-800"
          >
            {showControls ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
          </button>
        )}
      </div>
      
      <div className={`${
        isMobile 
          ? `absolute inset-0 bg-black/90 z-30 transform transition-transform ${
              showControls ? 'translate-x-0' : 'translate-x-full'
            }`
          : ''
      }`}>
        <ControlPanel
        settings={settings}
        onSettingsChange={handleSettingsChange}
        autoRotate={autoRotate}
        onAutoRotateToggle={() => setAutoRotate(!autoRotate)}
        showGrid={showGrid}
        onGridToggle={() => setShowGrid(!showGrid)}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleReset}
        />
      </div>
    </div>
  );
};

export default OrderbookPage;