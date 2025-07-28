import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Box, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { OrderbookSnapshot } from '@/types/orderbook';

interface SimpleOrderbookProps {
  snapshot: OrderbookSnapshot | null;
}

const OrderbookBars: React.FC<{ snapshot: OrderbookSnapshot | null }> = ({ snapshot }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.2;
    }
  });

  if (!snapshot) {
    // Show a test cube if no data
    return (
      <Box position={[0, 0, 0]} args={[2, 2, 2]}>
        <meshStandardMaterial color="orange" />
      </Box>
    );
  }

  return (
    <group ref={groupRef}>
      {/* Bid bars */}
      {snapshot.bids.slice(0, 20).map((bid, index) => {
        const height = Math.log(bid.quantity + 1) * 2;
        const x = -index * 1.5 - 2;
        
        return (
          <Box
            key={`bid-${index}`}
            position={[x, height / 2, 0]}
            args={[1, height, 1]}
          >
            <meshStandardMaterial color="#00ff00" />
          </Box>
        );
      })}
      
      {/* Ask bars */}
      {snapshot.asks.slice(0, 20).map((ask, index) => {
        const height = Math.log(ask.quantity + 1) * 2;
        const x = index * 1.5 + 2;
        
        return (
          <Box
            key={`ask-${index}`}
            position={[x, height / 2, 0]}
            args={[1, height, 1]}
          >
            <meshStandardMaterial color="#ff0000" />
          </Box>
        );
      })}
    </group>
  );
};

const SimpleOrderbook3D: React.FC<SimpleOrderbookProps> = ({ snapshot }) => {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Canvas camera={{ position: [0, 10, 30], fov: 60 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <OrderbookBars snapshot={snapshot} />
        <OrbitControls />
        <gridHelper args={[50, 50]} />
      </Canvas>
    </div>
  );
};

export default SimpleOrderbook3D;