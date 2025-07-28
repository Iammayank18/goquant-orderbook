import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { PressureZone } from '@/types/orderbook';

interface PressureZoneEnhancedProps {
  zones: PressureZone[];
  midPrice: number;
  visible: boolean;
  showLabels?: boolean;
  animationSpeed?: number;
}

const PressureZoneEnhanced: React.FC<PressureZoneEnhancedProps> = ({
  zones,
  midPrice,
  visible,
  showLabels = true,
  animationSpeed = 1
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const heatmapRef = useRef<THREE.Mesh>(null);
  const pulseTime = useRef(0);

  // Create heatmap texture for pressure zones
  const heatmapTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    
    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, 'rgba(0, 0, 255, 0.2)');
    gradient.addColorStop(0.25, 'rgba(0, 255, 255, 0.4)');
    gradient.addColorStop(0.5, 'rgba(0, 255, 0, 0.6)');
    gradient.addColorStop(0.75, 'rgba(255, 255, 0, 0.8)');
    gradient.addColorStop(1, 'rgba(255, 0, 0, 1)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);

  useFrame((state, delta) => {
    if (!visible || !groupRef.current) return;
    
    pulseTime.current += delta * animationSpeed;
    
    // Animate pressure zones with pulsing effect
    groupRef.current.children.forEach((child, index) => {
      if (child instanceof THREE.Mesh) {
        const zone = zones[index];
        if (zone) {
          const pulseScale = 1 + Math.sin(pulseTime.current * 2 + index) * 0.1 * zone.intensity / 10;
          child.scale.y = pulseScale;
        }
      }
    });
  });

  if (!visible || zones.length === 0) return null;

  return (
    <group ref={groupRef}>
      {/* Render individual pressure zones */}
      {zones.map((zone, index) => {
        const priceOffset = (zone.price - midPrice) / midPrice * 100;
        const width = Math.abs(zone.priceRange[1] - zone.priceRange[0]) / midPrice * 100;
        const height = Math.log10(zone.volume + 1) * 5;
        const opacity = 0.3 + (zone.intensity / 10) * 0.5;
        
        return (
          <group key={index}>
            {/* Main pressure zone box */}
            <mesh position={[priceOffset, height / 2, 0]}>
              <boxGeometry args={[width, height, 10]} />
              <meshStandardMaterial
                color={zone.type === 'bid' ? '#00ff88' : '#ff4444'}
                transparent
                opacity={opacity}
                emissive={zone.type === 'bid' ? '#00ff88' : '#ff4444'}
                emissiveIntensity={zone.intensity * 0.1}
              />
            </mesh>
            
            {/* Glow effect for high intensity zones */}
            {zone.intensity > 5 && (
              <mesh position={[priceOffset, height / 2, 0]}>
                <boxGeometry args={[width * 1.2, height * 1.2, 12]} />
                <meshStandardMaterial
                  color={zone.type === 'bid' ? '#00ff88' : '#ff4444'}
                  transparent
                  opacity={0.2}
                  emissive={zone.type === 'bid' ? '#00ff88' : '#ff4444'}
                  emissiveIntensity={0.5}
                  side={THREE.BackSide}
                />
              </mesh>
            )}
            
            {/* Zone label */}
            {showLabels && (
              <Text
                position={[priceOffset, height + 2, 0]}
                fontSize={0.8}
                color="#ffffff"
                anchorX="center"
                anchorY="bottom"
              >
                {`$${zone.price.toFixed(0)} | Vol: ${zone.volume.toFixed(2)}`}
              </Text>
            )}
            
            {/* Intensity indicator */}
            <mesh position={[priceOffset, height + 1, 0]}>
              <cylinderGeometry args={[0.2, 0.2, zone.intensity / 2, 8]} />
              <meshStandardMaterial
                color="#ffff00"
                emissive="#ffff00"
                emissiveIntensity={0.5}
              />
            </mesh>
          </group>
        );
      })}
      
      {/* Heatmap overlay */}
      <mesh ref={heatmapRef} position={[0, -1, -5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[200, 50]} />
        <meshBasicMaterial
          map={heatmapTexture}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Pressure balance indicator */}
      {zones.length > 0 && (
        <group position={[0, 30, 0]}>
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
                <mesh position={[0, 0, 0]}>
                  <boxGeometry args={[20, 2, 0.5]} />
                  <meshStandardMaterial color="#333333" />
                </mesh>
                <mesh position={[balance * 10, 0, 0.1]}>
                  <boxGeometry args={[1, 2.5, 0.5]} />
                  <meshStandardMaterial
                    color={balance > 0 ? '#00ff88' : '#ff4444'}
                    emissive={balance > 0 ? '#00ff88' : '#ff4444'}
                    emissiveIntensity={0.5}
                  />
                </mesh>
                <Text
                  position={[0, 3, 0]}
                  fontSize={1}
                  color="#ffffff"
                  anchorX="center"
                >
                  {`Pressure Balance: ${(balance * 100).toFixed(1)}%`}
                </Text>
              </>
            );
          })()}
        </group>
      )}
    </group>
  );
};

export default PressureZoneEnhanced;