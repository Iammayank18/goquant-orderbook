import React from 'react';
import { useThree } from '@react-three/fiber';
import { ZoomIn, ZoomOut } from 'lucide-react';

interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({ onZoomIn, onZoomOut }) => {
  const { camera } = useThree();

  const handleZoomIn = () => {
    camera.position.multiplyScalar(0.8);
    camera.updateProjectionMatrix();
    onZoomIn();
  };

  const handleZoomOut = () => {
    camera.position.multiplyScalar(1.2);
    camera.updateProjectionMatrix();
    onZoomOut();
  };

  return (
    <>
      <mesh position={[0, 0, 0]} visible={false} onClick={handleZoomIn} />
      <mesh position={[0, 0, 0]} visible={false} onClick={handleZoomOut} />
    </>
  );
};

export default ZoomControls;