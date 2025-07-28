import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PressureZone } from '@/types/orderbook';

interface PressureZoneViewProps {
  zones: PressureZone[];
  midPrice: number;
  visible: boolean;
}

const PressureZoneView: React.FC<PressureZoneViewProps> = ({ zones, midPrice, visible }) => {
  const meshRef = useRef<THREE.Group>(null);
  const pulseTime = useRef(0);

  const zoneGeometries = useMemo(() => {
    if (!visible) return [];
    
    return zones.map((zone) => {
      const width = Math.abs(zone.priceRange[1] - zone.priceRange[0]) * 0.1;
      const height = Math.log(zone.volume + 1) * 3;
      const depth = 2;
      
      const geometry = new THREE.BoxGeometry(width, height, depth);
      const material = new THREE.MeshStandardMaterial({
        color: zone.type === 'bid' ? '#00ff88' : '#ff0044',
        transparent: true,
        opacity: 0.3 + (zone.intensity / 10) * 0.4,
        emissive: zone.type === 'bid' ? '#00ff88' : '#ff0044',
        emissiveIntensity: zone.intensity / 10
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      const centerPrice = (zone.priceRange[0] + zone.priceRange[1]) / 2;
      mesh.position.set(
        (centerPrice - midPrice) * 0.1,
        height / 2,
        0
      );
      
      return mesh;
    });
  }, [zones, midPrice, visible]);

  useFrame((state) => {
    if (!meshRef.current || !visible) return;
    
    pulseTime.current += 0.02;
    
    meshRef.current.children.forEach((child, index) => {
      if (child instanceof THREE.Mesh) {
        const zone = zones[index];
        const pulseFactor = 1 + Math.sin(pulseTime.current + index) * 0.1 * (zone.intensity / 10);
        child.scale.y = pulseFactor;
        
        if (child.material instanceof THREE.MeshStandardMaterial) {
          child.material.emissiveIntensity = (zone.intensity / 10) * (0.5 + Math.sin(pulseTime.current * 2) * 0.3);
        }
      }
    });
  });

  if (!visible) return null;

  return (
    <group ref={meshRef}>
      {zoneGeometries.map((mesh, index) => (
        <primitive key={index} object={mesh} />
      ))}
    </group>
  );
};

export default PressureZoneView;