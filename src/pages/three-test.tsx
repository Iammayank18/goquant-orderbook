import React from 'react';
import dynamic from 'next/dynamic';

const TestScene = dynamic(() => {
  return import('@react-three/fiber').then((module) => {
    const { Canvas } = module;
    const { Box } = require('@react-three/drei');
    
    return function TestScene() {
      return (
        <Canvas>
          <ambientLight />
          <pointLight position={[10, 10, 10]} />
          <Box position={[0, 0, 0]} args={[2, 2, 2]}>
            <meshStandardMaterial color="orange" />
          </Box>
          <Box position={[-3, 0, 0]} args={[1, 1, 1]}>
            <meshStandardMaterial color="green" />
          </Box>
          <Box position={[3, 0, 0]} args={[1, 1, 1]}>
            <meshStandardMaterial color="red" />
          </Box>
        </Canvas>
      );
    };
  });
}, { ssr: false });

const ThreeTestPage: React.FC = () => {
  return (
    <div className="h-screen bg-black">
      <div className="p-4 text-white">
        <h1>Three.js Test</h1>
        <p>You should see 3 colored cubes below:</p>
      </div>
      <div className="h-[calc(100vh-100px)]">
        <TestScene />
      </div>
    </div>
  );
};

export default ThreeTestPage;