import React from 'react';
import { Box } from '@react-three/drei';

const TestBars: React.FC = () => {
  return (
    <group>
      {/* Test bid bars (green) */}
      {Array.from({ length: 5 }).map((_, i) => (
        <Box
          key={`bid-${i}`}
          position={[-i * 2 - 2, 2, 0]}
          args={[1.5, 4, 1.5]}
        >
          <meshStandardMaterial color="#00ff00" />
        </Box>
      ))}
      
      {/* Test ask bars (red) */}
      {Array.from({ length: 5 }).map((_, i) => (
        <Box
          key={`ask-${i}`}
          position={[i * 2 + 2, 2, 0]}
          args={[1.5, 4, 1.5]}
        >
          <meshStandardMaterial color="#ff0000" />
        </Box>
      ))}
    </group>
  );
};

export default TestBars;