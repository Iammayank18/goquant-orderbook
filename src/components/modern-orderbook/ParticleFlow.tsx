import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { OrderbookSnapshot } from "@/types/orderbook";

interface ParticleFlowProps {
  snapshots: OrderbookSnapshot[];
  enabled: boolean;
}

const ParticleFlow: React.FC<ParticleFlowProps> = ({ snapshots, enabled }) => {
  const particlesRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);

  // Create particle system
  const particles = useMemo(() => {
    if (!enabled || !snapshots.length) return null;

    const particleCount = 1000;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const velocities = new Float32Array(particleCount * 3);

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Random positions
      positions[i3] = (Math.random() - 0.5) * 50;
      positions[i3 + 1] = Math.random() * 20;
      positions[i3 + 2] = (Math.random() - 0.5) * 50;

      // Colors based on type (bid/ask)
      const isBid = Math.random() > 0.5;
      if (isBid) {
        colors[i3] = 0;
        colors[i3 + 1] = 0.85;
        colors[i3 + 2] = 1;
      } else {
        colors[i3] = 1;
        colors[i3 + 1] = 0;
        colors[i3 + 2] = 0.43;
      }

      // Random sizes
      sizes[i] = Math.random() * 0.5 + 0.1;

      // Random velocities
      velocities[i3] = (Math.random() - 0.5) * 0.1;
      velocities[i3 + 1] = Math.random() * 0.05;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.1;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.userData.velocities = velocities;

    return geometry;
  }, [enabled, snapshots.length]);

  // Animate particles
  useFrame((state, delta) => {
    if (!enabled || !particlesRef.current || !particles) return;

    timeRef.current += delta;
    const positions = particles.attributes.position;
    const velocities = particles.userData.velocities;

    // Get latest orderbook data
    const latest = snapshots[snapshots.length - 1];
    if (!latest) return;

    const midPrice = (latest.bids[0]?.price + latest.asks[0]?.price) / 2 || 0;
    const spread = latest.asks[0]?.price - latest.bids[0]?.price || 1;

    for (let i = 0; i < positions.count; i++) {
      const i3 = i * 3;

      // Update positions
      positions.array[i3] += velocities[i3];
      positions.array[i3 + 1] += velocities[i3 + 1];
      positions.array[i3 + 2] += velocities[i3 + 2];

      // Apply forces based on orderbook
      const x = positions.array[i3];
      const distFromMid = Math.abs(x);
      
      // Attract to spread area
      if (distFromMid < spread * 0.01) {
        velocities[i3 + 1] += 0.001; // Move up
      }

      // Boundary checks and reset
      if (positions.array[i3 + 1] > 25 || positions.array[i3 + 1] < 0) {
        positions.array[i3] = (Math.random() - 0.5) * 50;
        positions.array[i3 + 1] = 0;
        positions.array[i3 + 2] = (Math.random() - 0.5) * 50;
      }

      // Add some randomness
      velocities[i3] += (Math.random() - 0.5) * 0.001;
      velocities[i3 + 2] += (Math.random() - 0.5) * 0.001;
    }

    positions.needsUpdate = true;
  });

  if (!enabled || !particles) return null;

  return (
    <points ref={particlesRef} geometry={particles}>
      <pointsMaterial
        size={0.3}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

export default ParticleFlow;