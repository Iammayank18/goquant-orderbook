import React from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface AxesHelperProps {
  bounds: { x: number; y: number; z: number };
  theme: 'dark' | 'light';
}

const AxesHelper: React.FC<AxesHelperProps> = ({ bounds, theme }) => {
  const axisColor = theme === 'dark' ? '#666666' : '#999999';
  const textColor = theme === 'dark' ? '#ffffff' : '#000000';
  
  return (
    <group>
      {/* X-axis (Price) */}
      <group>
        <mesh>
          <boxGeometry args={[bounds.x * 2, 0.1, 0.1]} />
          <meshBasicMaterial color={axisColor} />
        </mesh>
        <mesh position={[bounds.x + 2, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.3, 1, 8]} />
          <meshBasicMaterial color={axisColor} />
        </mesh>
        <Text
          position={[bounds.x + 5, 0, 0]}
          fontSize={1.5}
          color={textColor}
          anchorX="center"
          anchorY="middle"
        >
          Price →
        </Text>
      </group>
      
      {/* Y-axis (Quantity) */}
      <group>
        <mesh position={[0, bounds.y / 2, 0]}>
          <boxGeometry args={[0.1, bounds.y, 0.1]} />
          <meshBasicMaterial color={axisColor} />
        </mesh>
        <mesh position={[0, bounds.y + 1, 0]}>
          <coneGeometry args={[0.3, 1, 8]} />
          <meshBasicMaterial color={axisColor} />
        </mesh>
        <Text
          position={[0, bounds.y + 3, 0]}
          fontSize={1.5}
          color={textColor}
          anchorX="center"
          anchorY="middle"
        >
          Quantity ↑
        </Text>
      </group>
      
      {/* Z-axis (Time) */}
      <group>
        <mesh position={[0, 0, bounds.z / 2]}>
          <boxGeometry args={[0.1, 0.1, bounds.z]} />
          <meshBasicMaterial color={axisColor} />
        </mesh>
        <mesh position={[0, 0, bounds.z + 1]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.3, 1, 8]} />
          <meshBasicMaterial color={axisColor} />
        </mesh>
        <Text
          position={[0, 0, bounds.z + 3]}
          fontSize={1.5}
          color={textColor}
          anchorX="center"
          anchorY="middle"
        >
          Time →
        </Text>
      </group>
      
      {/* Origin marker */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial color="#ffff00" />
      </mesh>
    </group>
  );
};

export default AxesHelper;