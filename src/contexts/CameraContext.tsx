import React, { createContext, useContext, useRef } from 'react';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

interface CameraContextType {
  controlsRef: React.MutableRefObject<OrbitControlsImpl | null>;
}

const CameraContext = createContext<CameraContextType | null>(null);

export const CameraProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  return (
    <CameraContext.Provider value={{ controlsRef }}>
      {children}
    </CameraContext.Provider>
  );
};

export const useCameraControls = () => {
  const context = useContext(CameraContext);
  if (!context) {
    throw new Error('useCameraControls must be used within CameraProvider');
  }
  return context;
};