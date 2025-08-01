import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { PressureZone, OrderbookSnapshot } from '@/types/orderbook';

interface PressureZoneVisualsProps {
  zones: PressureZone[];
  latestSnapshot?: OrderbookSnapshot;
}

const PressureZoneVisuals: React.FC<PressureZoneVisualsProps> = ({
  zones,
  latestSnapshot
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const pulseTime = useRef(0);
  
  useFrame((state, delta) => {
    pulseTime.current += delta;
    
    if (groupRef.current) {
      groupRef.current.children.forEach((child, index) => {
        if (child instanceof THREE.Mesh && zones[index]) {
          const zone = zones[index];
          const pulseFactor = 1 + Math.sin(pulseTime.current * 2 + index) * 0.05 * zone.intensity / 10;
          child.scale.y = pulseFactor;
        }
      });
    }
  });
  
  if (!zones.length || !latestSnapshot) return null;
  
  const midPrice = (latestSnapshot.bids[0]?.price + latestSnapshot.asks[0]?.price) / 2;
  
  return (
    <group ref={groupRef}>
      {zones.map((zone, index) => {
        const x = (zone.price - midPrice) * 0.02;
        const width = Math.abs(zone.priceRange[1] - zone.priceRange[0]) * 0.02;
        const height = Math.log10(zone.volume + 1) * 6;
        const opacity = 0.3 + (zone.intensity / 10) * 0.4;
        const color = zone.type === 'bid' ? 0x00ff88 : 0xff4444;
        
        return (
          <group key={index}>
            {/* Main pressure zone */}
            <mesh position={[x, height / 2, 0]}>
              <boxGeometry args={[width, height, 20]} />
              <meshStandardMaterial
                color={color}
                transparent
                opacity={opacity}
                emissive={color}
                emissiveIntensity={zone.intensity * 0.05}
                side={THREE.DoubleSide}
              />
            </mesh>
            
            {/* Glow effect for high intensity */}
            {zone.intensity > 5 && (
              <mesh position={[x, height / 2, 0]}>
                <boxGeometry args={[width * 1.2, height * 1.2, 22]} />
                <meshStandardMaterial
                  color={color}
                  transparent
                  opacity={0.1}
                  emissive={color}
                  emissiveIntensity={0.3}
                  side={THREE.BackSide}
                />
              </mesh>
            )}
            
            {/* Label for significant zones */}
            {zone.intensity > 7 && (
              <Text
                position={[x, height + 2, 0]}
                fontSize={0.8}
                color="#ffffff"
                anchorX="center"
                anchorY="bottom"
              >
                ${zone.price.toFixed(0)}
              </Text>
            )}
          </group>
        );
      })}
      
      {/* Pressure balance indicator */}
      <group position={[0, 25, 0]}>
        {(() => {
          const bidPressure = zones
            .filter(z => z.type === 'bid')
            .reduce((sum, z) => sum + z.intensity * z.volume, 0);
          const askPressure = zones
            .filter(z => z.type === 'ask')
            .reduce((sum, z) => sum + z.intensity * z.volume, 0);
          const totalPressure = bidPressure + askPressure;
          const balance = totalPressure > 0 ? (bidPressure - askPressure) / totalPressure : 0;
          
          return (
            <>
              <mesh>
                <boxGeometry args={[20, 1, 0.5]} />
                <meshStandardMaterial color="#333333" />
              </mesh>
              <mesh position={[balance * 10, 0, 0.1]}>
                <boxGeometry args={[1, 1.5, 0.5]} />
                <meshStandardMaterial
                  color={balance > 0 ? 0x00ff88 : 0xff4444}
                  emissive={balance > 0 ? 0x00ff88 : 0xff4444}
                  emissiveIntensity={0.3}
                />
              </mesh>
              <Text
                position={[0, 2, 0]}
                fontSize={0.8}
                color="#ffffff"
                anchorX="center"
              >
                Balance: {(balance * 100).toFixed(1)}%
              </Text>
            </>
          );
        })()}
      </group>
    </group>
  );
};

export default PressureZoneVisuals;