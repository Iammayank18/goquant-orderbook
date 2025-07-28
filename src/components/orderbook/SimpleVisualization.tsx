import React, { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Box, Text } from '@react-three/drei';
import { OrderbookSnapshot } from '@/types/orderbook';

interface SimpleVisualizationProps {
  snapshots: OrderbookSnapshot[];
}

const SimpleVisualization: React.FC<SimpleVisualizationProps> = ({ snapshots }) => {
  const [debug, setDebug] = useState<string>('');

  useEffect(() => {
    if (snapshots.length > 0) {
      const latest = snapshots[snapshots.length - 1];
      setDebug(`Snapshots: ${snapshots.length}, Bids: ${latest.bids?.length || 0}, Asks: ${latest.asks?.length || 0}`);
    }
  }, [snapshots]);

  return (
    <div className="w-full h-full relative">
      <div className="absolute top-4 left-4 z-10 bg-black/80 text-white p-2 rounded">
        <div>Debug: {debug}</div>
      </div>
      
      <Canvas camera={{ position: [0, 10, 20], fov: 60 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        
        <OrbitControls />
        <gridHelper args={[50, 50]} />
        
        {/* Render actual orderbook data */}
        {snapshots.slice(-5).map((snapshot, snapshotIdx) => {
          const z = snapshotIdx * 5;
          const midPrice = (snapshot.bids[0]?.price + snapshot.asks[0]?.price) / 2 || 96000;
          
          return (
            <group key={snapshotIdx}>
              {/* Bids (green) */}
              {snapshot.bids.slice(0, 10).map((bid, idx) => {
                const x = ((bid.price - midPrice) / 100) * 5; // Scale price difference
                const height = Math.min(bid.quantity * 2, 10);
                
                return (
                  <Box
                    key={`bid-${snapshotIdx}-${idx}`}
                    position={[x, height/2, z]}
                    args={[0.8, height, 0.8]}
                  >
                    <meshStandardMaterial color="#00ff00" />
                  </Box>
                );
              })}
              
              {/* Asks (red) */}
              {snapshot.asks.slice(0, 10).map((ask, idx) => {
                const x = ((ask.price - midPrice) / 100) * 5; // Scale price difference
                const height = Math.min(ask.quantity * 2, 10);
                
                return (
                  <Box
                    key={`ask-${snapshotIdx}-${idx}`}
                    position={[x, height/2, z]}
                    args={[0.8, height, 0.8]}
                  >
                    <meshStandardMaterial color="#ff0000" />
                  </Box>
                );
              })}
              
              {/* Mid price marker */}
              <Box position={[0, 0.1, z]} args={[0.2, 0.2, 0.2]}>
                <meshStandardMaterial color="#ffff00" />
              </Box>
            </group>
          );
        })}
      </Canvas>
    </div>
  );
};

export default SimpleVisualization;