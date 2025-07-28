import { useThree } from '@react-three/fiber';
import { useCallback } from 'react';
import * as THREE from 'three';

export const useCameraControls = () => {
  const { camera } = useThree();

  const zoomIn = useCallback(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      camera.position.addScaledVector(direction, 5);
    }
  }, [camera]);

  const zoomOut = useCallback(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      camera.position.addScaledVector(direction, -5);
    }
  }, [camera]);

  const resetCamera = useCallback(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.position.set(20, 20, 20);
      camera.lookAt(0, 0, 0);
    }
  }, [camera]);

  return { zoomIn, zoomOut, resetCamera };
};