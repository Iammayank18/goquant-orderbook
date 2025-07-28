import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Grid } from '@react-three/drei';
import { FilterSettings, VenueType } from '@/types/orderbook';
import { useOrderbookTestData } from '@/hooks/useOrderbookTestData';
import SimpleOrderbook3DFixed from '@/components/orderbook/SimpleOrderbook3DFixed';
import ErrorBoundary from '@/components/ErrorBoundary';

const SimpleOrderbook3DPage: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  
  const settings: FilterSettings = {
    venues: ['binance'] as VenueType[],
    priceRange: [0, 100000],
    quantityThreshold: 0,
    timeRange: 300,
    showPressureZones: false,
    showVolumeProfile: false
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const { snapshots, isConnected } = useOrderbookTestData('BTCUSDT', settings);
  
  const midPrice = snapshots.length > 0 
    ? (snapshots[snapshots.length - 1].bids[0]?.price + snapshots[snapshots.length - 1].asks[0]?.price) / 2 
    : 0;

  if (!mounted) {
    return <div className="w-full h-screen bg-black flex items-center justify-center">
      <div className="text-white">Loading...</div>
    </div>;
  }

  return (
    <div className="w-full h-screen bg-black">
      {/* Header */}
      <div className="absolute top-4 left-4 z-10 space-y-2">
        <div className="bg-gray-900 rounded-lg px-4 py-2 border border-gray-800">
          <h1 className="text-white text-xl font-bold">Simple 3D Orderbook</h1>
          <div className="flex items-center gap-2 mt-1">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-gray-400 text-sm">
              {isConnected ? 'Test Data Active' : 'Disconnected'}
            </span>
          </div>
        </div>
        
        <div className="bg-gray-900 rounded-lg px-4 py-2 border border-gray-800">
          <div className="text-gray-400 text-sm">Mid Price</div>
          <div className="text-white text-lg font-mono">
            ${midPrice.toFixed(2)}
          </div>
        </div>
        
        <div className="bg-gray-900 rounded-lg px-4 py-2 border border-gray-800">
          <div className="text-gray-400 text-sm">Snapshots</div>
          <div className="text-white text-lg font-mono">
            {snapshots.length}
          </div>
        </div>
      </div>
      
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 space-y-2">
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`px-4 py-2 rounded-lg ${
            autoRotate ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'
          }`}
        >
          Auto Rotate
        </button>
        
        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`px-4 py-2 rounded-lg ${
            showGrid ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'
          }`}
        >
          Show Grid
        </button>
      </div>
      
      {/* 3D Canvas */}
      <ErrorBoundary>
        <Canvas>
          <PerspectiveCamera makeDefault position={[20, 20, 40]} fov={60} />
          
          {/* Lighting */}
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <directionalLight position={[-10, 10, -10]} intensity={0.5} />
          
          {/* Grid */}
          {showGrid && (
            <Grid
              args={[100, 100]}
              position={[0, -0.1, 0]}
              cellSize={2}
              cellThickness={0.5}
              cellColor="#333333"
              sectionSize={10}
              sectionThickness={1}
              sectionColor="#666666"
              fadeDistance={100}
              fadeStrength={1}
            />
          )}
          
          {/* Orderbook Visualization */}
          <SimpleOrderbook3DFixed
            snapshots={snapshots}
            autoRotate={autoRotate}
          />
          
          {/* Camera Controls */}
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            zoomSpeed={0.5}
            panSpeed={0.5}
            rotateSpeed={0.5}
          />
        </Canvas>
      </ErrorBoundary>
    </div>
  );
};

export default SimpleOrderbook3DPage;