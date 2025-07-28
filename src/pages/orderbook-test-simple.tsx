import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Box, Grid } from '@react-three/drei';

export default function OrderbookTestSimple() {
  return (
    <div className="w-full h-screen bg-black">
      <Canvas>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        
        <Box position={[0, 0, 0]} args={[2, 2, 2]}>
          <meshStandardMaterial color="orange" />
        </Box>
        
        <Grid
          args={[100, 100]}
          position={[0, -1, 0]}
          cellSize={1}
          cellThickness={0.5}
          cellColor="#666666"
        />
        
        <OrbitControls />
      </Canvas>
    </div>
  );
}