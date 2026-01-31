import React, { useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { XR, createXRStore } from '@react-three/xr';
import * as THREE from 'three';

// Create XR store for session management
const xrStore = createXRStore();

interface CesiumTextureScreenProps {
  cesiumCanvas: HTMLCanvasElement | null;
}

// Component that displays Cesium canvas as a texture on a curved screen
function CesiumTextureScreen({ cesiumCanvas }: CesiumTextureScreenProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const textureRef = useRef<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    if (cesiumCanvas) {
      textureRef.current = new THREE.CanvasTexture(cesiumCanvas);
      textureRef.current.minFilter = THREE.LinearFilter;
      textureRef.current.magFilter = THREE.LinearFilter;
      
      if (meshRef.current) {
        (meshRef.current.material as THREE.MeshBasicMaterial).map = textureRef.current;
        (meshRef.current.material as THREE.MeshBasicMaterial).needsUpdate = true;
      }
    }
  }, [cesiumCanvas]);

  // Update texture every frame
  useFrame(() => {
    if (textureRef.current && cesiumCanvas) {
      textureRef.current.needsUpdate = true;
    }
  });

  // Create curved screen geometry (like IMAX)
  const curveSegments = 64;
  const curveRadius = 8;
  const curveAngle = Math.PI * 0.6; // 108 degrees
  const screenHeight = 6;

  return (
    <mesh ref={meshRef} position={[0, 1.6, 0]}>
      <cylinderGeometry 
        args={[curveRadius, curveRadius, screenHeight, curveSegments, 1, true, 
               Math.PI / 2 - curveAngle / 2, curveAngle]} 
      />
      <meshBasicMaterial side={THREE.BackSide} />
    </mesh>
  );
}

// Environment with floor grid
function VREnvironment() {
  return (
    <>
      {/* Floor grid */}
      <gridHelper args={[20, 20, 0x444444, 0x222222]} rotation={[0, 0, 0]} />
      
      {/* Ambient lighting */}
      <ambientLight intensity={0.5} />
      
      {/* Skybox-like background */}
      <mesh>
        <sphereGeometry args={[50, 32, 32]} />
        <meshBasicMaterial color="#0a0a1a" side={THREE.BackSide} />
      </mesh>
    </>
  );
}

interface VRSceneProps {
  cesiumCanvas: HTMLCanvasElement | null;
  onExitVR?: () => void;
}

export const VRScene: React.FC<VRSceneProps> = ({ cesiumCanvas, onExitVR }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Enter VR on mount
  useEffect(() => {
    xrStore.enterVR();
  }, []);

  return (
    <div 
      ref={containerRef} 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100vw', 
        height: '100vh',
        zIndex: 9999,
        background: '#000'
      }}
    >
      <Canvas>
        <XR store={xrStore}>
          <Suspense fallback={null}>
            <VREnvironment />
            <CesiumTextureScreen cesiumCanvas={cesiumCanvas} />
          </Suspense>
        </XR>
      </Canvas>
      
      {/* Exit button overlay */}
      <button
        onClick={() => {
          xrStore.getState().session?.end();
          if (onExitVR) onExitVR();
        }}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          padding: '12px 24px',
          background: 'rgba(239, 68, 68, 0.9)',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: 'pointer',
          zIndex: 10000
        }}
      >
        🚪 Exit VR Mode
      </button>
    </div>
  );
};

// Export the store for external use
export { xrStore };

export default VRScene;
