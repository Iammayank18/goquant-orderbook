import React, { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

interface CameraControllerProps {
  autoRotate: boolean;
  rotationSpeed?: number;
  enableDamping?: boolean;
  dampingFactor?: number;
  minDistance?: number;
  maxDistance?: number;
  target?: [number, number, number];
  cameraDistance?: number;
  onCameraChange?: (position: THREE.Vector3, target: THREE.Vector3) => void;
}

const CameraController: React.FC<CameraControllerProps> = ({
  autoRotate,
  rotationSpeed = 0.5,
  enableDamping = true,
  dampingFactor = 0.05,
  minDistance = 10,
  maxDistance = 100,
  target = [0, 0, 0],
  cameraDistance = 40,
  onCameraChange
}) => {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();
  const rotationAngle = useRef(0);

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.target.set(...target);
    }
  }, [target]);

  useEffect(() => {
    if (!autoRotate && camera) {
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      direction.normalize();
      
      const newPosition = new THREE.Vector3(...target);
      newPosition.sub(direction.multiplyScalar(cameraDistance));
      
      camera.position.lerp(newPosition, 0.1);
      camera.lookAt(...target);
    }
  }, [cameraDistance, camera, target, autoRotate]);

  useFrame((state, delta) => {
    if (autoRotate && controlsRef.current && !controlsRef.current.enabled) {
      rotationAngle.current += rotationSpeed * delta;
      const radius = 30; // Fixed radius to prevent infinite zoom
      const height = 15; // Fixed height
      
      camera.position.x = Math.cos(rotationAngle.current) * radius;
      camera.position.z = Math.sin(rotationAngle.current) * radius;
      camera.position.y = height;
      
      camera.lookAt(...target);
      
      if (onCameraChange) {
        onCameraChange(camera.position.clone(), new THREE.Vector3(...target));
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping={enableDamping}
      dampingFactor={dampingFactor}
      minDistance={minDistance}
      maxDistance={maxDistance}
      maxPolarAngle={Math.PI / 2 + 0.2}
      minPolarAngle={0.2}
      enablePan={true}
      panSpeed={0.5}
      rotateSpeed={0.5}
      zoomSpeed={0.5}
      enabled={!autoRotate}
      onChange={() => {
        if (onCameraChange && controlsRef.current) {
          onCameraChange(
            camera.position.clone(),
            controlsRef.current.target.clone()
          );
        }
      }}
    />
  );
};

export default CameraController;