import React, { useRef, useState, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface TouchControlsProps {
  enabled: boolean;
  rotationSpeed?: number;
  zoomSpeed?: number;
  minDistance?: number;
  maxDistance?: number;
}

const TouchControls: React.FC<TouchControlsProps> = ({
  enabled,
  rotationSpeed = 0.01,
  zoomSpeed = 0.1,
  minDistance = 10,
  maxDistance = 150
}) => {
  const { camera, gl } = useThree();
  const [touches, setTouches] = useState<Touch[]>([]);
  const lastTouchDistance = useRef<number>(0);
  const lastTouchX = useRef<number>(0);
  const lastTouchY = useRef<number>(0);
  const cameraSpherical = useRef(new THREE.Spherical());
  const cameraPosition = useRef(new THREE.Vector3());

  useEffect(() => {
    if (!enabled) return;

    const domElement = gl.domElement;

    const handleTouchStart = (event: TouchEvent) => {
      event.preventDefault();
      setTouches(Array.from(event.touches));
      
      if (event.touches.length === 1) {
        lastTouchX.current = event.touches[0].clientX;
        lastTouchY.current = event.touches[0].clientY;
      } else if (event.touches.length === 2) {
        const dx = event.touches[0].clientX - event.touches[1].clientX;
        const dy = event.touches[0].clientY - event.touches[1].clientY;
        lastTouchDistance.current = Math.sqrt(dx * dx + dy * dy);
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      event.preventDefault();
      
      if (event.touches.length === 1) {
        // Single touch - rotate camera
        const deltaX = event.touches[0].clientX - lastTouchX.current;
        const deltaY = event.touches[0].clientY - lastTouchY.current;
        
        lastTouchX.current = event.touches[0].clientX;
        lastTouchY.current = event.touches[0].clientY;
        
        // Update camera position
        cameraPosition.current.copy(camera.position);
        cameraSpherical.current.setFromVector3(cameraPosition.current);
        
        // Rotate
        cameraSpherical.current.theta -= deltaX * rotationSpeed;
        cameraSpherical.current.phi = Math.max(
          0.1,
          Math.min(Math.PI - 0.1, cameraSpherical.current.phi + deltaY * rotationSpeed)
        );
        
        cameraPosition.current.setFromSpherical(cameraSpherical.current);
        camera.position.copy(cameraPosition.current);
        camera.lookAt(0, 0, 0);
      } else if (event.touches.length === 2) {
        // Two touches - pinch zoom
        const dx = event.touches[0].clientX - event.touches[1].clientX;
        const dy = event.touches[0].clientY - event.touches[1].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (lastTouchDistance.current > 0) {
          const delta = distance - lastTouchDistance.current;
          const zoomDelta = delta * zoomSpeed;
          
          // Update camera distance
          cameraPosition.current.copy(camera.position);
          cameraSpherical.current.setFromVector3(cameraPosition.current);
          
          cameraSpherical.current.radius = Math.max(
            minDistance,
            Math.min(maxDistance, cameraSpherical.current.radius - zoomDelta)
          );
          
          cameraPosition.current.setFromSpherical(cameraSpherical.current);
          camera.position.copy(cameraPosition.current);
        }
        
        lastTouchDistance.current = distance;
      }
    };

    const handleTouchEnd = (event: TouchEvent) => {
      setTouches(Array.from(event.touches));
      if (event.touches.length === 0) {
        lastTouchDistance.current = 0;
      }
    };

    domElement.addEventListener('touchstart', handleTouchStart, { passive: false });
    domElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    domElement.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      domElement.removeEventListener('touchstart', handleTouchStart);
      domElement.removeEventListener('touchmove', handleTouchMove);
      domElement.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, camera, gl, rotationSpeed, zoomSpeed, minDistance, maxDistance]);

  return null;
};

export default TouchControls;