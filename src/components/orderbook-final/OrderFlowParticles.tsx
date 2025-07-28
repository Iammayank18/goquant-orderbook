import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OrderbookSnapshot } from '@/types/orderbook';

interface OrderFlowParticlesProps {
  snapshots: OrderbookSnapshot[];
  theme: 'dark' | 'light';
  particleCount?: number;
}

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  size: number;
  life: number;
  maxLife: number;
  type: 'bid' | 'ask';
}

const OrderFlowParticles: React.FC<OrderFlowParticlesProps> = ({
  snapshots,
  theme,
  particleCount = 100
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const particlesRef = useRef<Particle[]>([]);
  
  // Initialize particles
  useMemo(() => {
    particlesRef.current = Array.from({ length: particleCount }, () => {
      const isBid = Math.random() > 0.5;
      return {
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 40,
          Math.random() * 20,
          Math.random() * 50
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.1,
          isBid ? 0.2 : -0.2,
          0.3
        ),
        color: new THREE.Color(isBid ? 0x00ff88 : 0xff4444),
        size: Math.random() * 0.5 + 0.2,
        life: Math.random() * 100,
        maxLife: 100,
        type: isBid ? 'bid' : 'ask'
      };
    });
  }, [particleCount]);
  
  useFrame((state, delta) => {
    if (!meshRef.current || snapshots.length === 0) return;
    
    const tempObject = new THREE.Object3D();
    const tempColor = new THREE.Color();
    const latest = snapshots[snapshots.length - 1];
    const midPrice = (latest.bids[0]?.price + latest.asks[0]?.price) / 2;
    
    particlesRef.current.forEach((particle, i) => {
      // Update particle physics
      particle.position.add(particle.velocity.clone().multiplyScalar(delta * 60));
      particle.life += delta * 60;
      
      // Apply forces
      if (particle.type === 'bid') {
        particle.velocity.y += 0.01 * delta;
      } else {
        particle.velocity.y -= 0.01 * delta;
      }
      
      // Reset particle if needed
      if (particle.life > particle.maxLife || particle.position.z > 60) {
        const isBid = Math.random() > 0.5;
        const orderData = isBid ? latest.bids[0] : latest.asks[0];
        
        if (orderData) {
          particle.position.set(
            (orderData.price - midPrice) * 0.02,
            0,
            0
          );
          particle.velocity.set(
            (Math.random() - 0.5) * 0.1,
            isBid ? Math.random() * 2 : -Math.random() * 2,
            0.5
          );
          particle.type = isBid ? 'bid' : 'ask';
          particle.color.set(isBid ? 0x00ff88 : 0xff4444);
          particle.size = Math.log10(orderData.quantity + 1) * 0.3;
          particle.life = 0;
        }
      }
      
      // Update instance
      const scale = particle.size * (1 - particle.life / particle.maxLife);
      tempObject.position.copy(particle.position);
      tempObject.scale.setScalar(scale);
      tempObject.updateMatrix();
      meshRef.current!.setMatrixAt(i, tempObject.matrix);
      
      tempColor.copy(particle.color);
      tempColor.multiplyScalar(1 - particle.life / particle.maxLife);
      meshRef.current!.setColorAt(i, tempColor);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });
  
  return (
    <instancedMesh 
      ref={meshRef} 
      args={[undefined, undefined, particleCount]}
      frustumCulled={false}
    >
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial
        vertexColors
        transparent
        opacity={0.8}
        emissive={theme === 'dark' ? 0xffffff : 0x000000}
        emissiveIntensity={0.1}
        blending={THREE.AdditiveBlending}
      />
    </instancedMesh>
  );
};

export default OrderFlowParticles;