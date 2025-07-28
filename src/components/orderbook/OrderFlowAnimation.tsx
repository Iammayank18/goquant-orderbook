import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { OrderbookSnapshot } from '@/types/orderbook';
import { getVenueColor } from '@/utils/venueConfig';

interface OrderFlowAnimationProps {
  snapshots: OrderbookSnapshot[];
  visible: boolean;
  flowSpeed?: number;
  particleCount?: number;
}

interface FlowParticle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: string;
  type: 'bid' | 'ask';
  size: number;
  life: number;
  maxLife: number;
}

const OrderFlowAnimation: React.FC<OrderFlowAnimationProps> = ({
  snapshots,
  visible,
  flowSpeed = 1,
  particleCount = 100
}) => {
  const particlesRef = useRef<FlowParticle[]>([]);
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
  const tempObject = useMemo(() => new THREE.Object3D(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);

  // Initialize particles
  useMemo(() => {
    if (snapshots.length === 0) return;
    
    particlesRef.current = Array.from({ length: particleCount }, (_, i) => {
      const snapshot = snapshots[Math.floor(Math.random() * snapshots.length)];
      const isBid = Math.random() > 0.5;
      const orders = isBid ? snapshot.bids : snapshot.asks;
      
      if (orders.length === 0) {
        return createRandomParticle(snapshot);
      }
      
      const order = orders[Math.floor(Math.random() * Math.min(orders.length, 10))];
      const midPrice = (snapshot.bids[0]?.price + snapshot.asks[0]?.price) / 2 || 0;
      
      return {
        position: new THREE.Vector3(
          (order.price - midPrice) / midPrice * 100,
          Math.random() * 20,
          Math.random() * 50 - 100
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.1,
          isBid ? 0.1 : -0.1,
          0.5
        ),
        color: getVenueColor(snapshot.venue),
        type: isBid ? 'bid' : 'ask',
        size: Math.log10(order.quantity + 1) * 0.5,
        life: Math.random() * 100,
        maxLife: 100
      };
    });
  }, [snapshots, particleCount]);

  const createRandomParticle = (snapshot: OrderbookSnapshot): FlowParticle => {
    const isBid = Math.random() > 0.5;
    return {
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 100,
        Math.random() * 20,
        -100
      ),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.1,
        isBid ? 0.1 : -0.1,
        0.5
      ),
      color: getVenueColor(snapshot.venue),
      type: isBid ? 'bid' : 'ask',
      size: Math.random() * 0.5 + 0.2,
      life: 0,
      maxLife: 100
    };
  };

  useFrame((state, delta) => {
    if (!visible || !instancedMeshRef.current || snapshots.length === 0) return;
    
    particlesRef.current.forEach((particle, i) => {
      // Update particle position
      particle.position.x += particle.velocity.x * delta * flowSpeed * 60;
      particle.position.y += particle.velocity.y * delta * flowSpeed * 60;
      particle.position.z += particle.velocity.z * delta * flowSpeed * 60;
      
      // Update life
      particle.life += delta * flowSpeed * 60;
      
      // Reset particle if it's too old or out of bounds
      if (particle.life > particle.maxLife || particle.position.z > 50) {
        const snapshot = snapshots[snapshots.length - 1];
        const newParticle = createRandomParticle(snapshot);
        Object.assign(particle, newParticle);
      }
      
      // Apply gravity and flow dynamics
      if (particle.type === 'bid') {
        particle.velocity.y += 0.01 * delta * flowSpeed;
      } else {
        particle.velocity.y -= 0.01 * delta * flowSpeed;
      }
      
      // Update instance
      const scale = particle.size * (1 - particle.life / particle.maxLife);
      tempObject.position.copy(particle.position);
      tempObject.scale.setScalar(scale);
      tempObject.updateMatrix();
      instancedMeshRef.current!.setMatrixAt(i, tempObject.matrix);
      
      tempColor.set(particle.color);
      tempColor.multiplyScalar(1 - particle.life / particle.maxLife);
      instancedMeshRef.current!.setColorAt(i, tempColor);
    });
    
    instancedMeshRef.current.instanceMatrix.needsUpdate = true;
    if (instancedMeshRef.current.instanceColor) {
      instancedMeshRef.current.instanceColor.needsUpdate = true;
    }
  });

  if (!visible) return null;

  return (
    <instancedMesh 
      ref={instancedMeshRef} 
      args={[undefined, undefined, particleCount]}
      frustumCulled={false}
    >
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial
        vertexColors
        transparent
        opacity={0.8}
        emissive="#ffffff"
        emissiveIntensity={0.2}
        blending={THREE.AdditiveBlending}
      />
    </instancedMesh>
  );
};

export default OrderFlowAnimation;