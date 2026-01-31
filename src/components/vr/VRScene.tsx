import React, { useEffect, useRef, useCallback, useState } from 'react';
import * as Cesium from 'cesium';

interface ImmersiveVRSceneProps {
  viewer: Cesium.Viewer | null;
  onExitVR?: () => void;
}

// Store original settings to restore on exit
interface OriginalSettings {
  fov: number;
  resolutionScale: number;
  maximumScreenSpaceError: number;
}

/**
 * ImmersiveVRScene - Optimized VR mode for Quest compatibility
 * 
 * Reduces scene complexity to prevent browser crashes on mobile VR.
 */
export const ImmersiveVRScene: React.FC<ImmersiveVRSceneProps> = ({ viewer, onExitVR }) => {
  const [isActive, setIsActive] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Preparing VR...');
  const xrSessionRef = useRef<XRSession | null>(null);
  const originalSettingsRef = useRef<OriginalSettings | null>(null);
  const animationIdRef = useRef<number | null>(null);

  // Optimize scene for VR performance
  const optimizeForVR = useCallback((v: Cesium.Viewer) => {
    if (v.isDestroyed()) return;

    // Store original settings
    const frustum = v.camera.frustum as Cesium.PerspectiveFrustum;

    originalSettingsRef.current = {
      fov: frustum instanceof Cesium.PerspectiveFrustum ? (frustum.fov ?? Cesium.Math.toRadians(60)) : Cesium.Math.toRadians(60),
      resolutionScale: v.resolutionScale,
      maximumScreenSpaceError: v.scene.globe.maximumScreenSpaceError,
    };

    // Apply VR optimizations
    setStatusMessage('Optimizing scene...');

    // 1. Reduce resolution for better performance (Quest browser has limited resources)
    v.resolutionScale = 0.65;

    // 2. Disable all post-processing (wind, pollution shaders are GPU intensive)
    v.scene.postProcessStages.removeAll();

    // 3. Reduce 3D tileset detail (higher error = lower detail = better performance)
    v.scene.globe.maximumScreenSpaceError = 6;

    // 4. Wider FOV for VR
    if (frustum instanceof Cesium.PerspectiveFrustum) {
      frustum.fov = Cesium.Math.toRadians(100);
    }

    // 5. Disable shadows if enabled
    v.shadows = false;

    // 6. Disable fog for performance
    v.scene.fog.enabled = false;

    // Force a render to apply changes
    v.scene.requestRender();
  }, []);

  // Restore original settings
  const restoreSettings = useCallback((v: Cesium.Viewer) => {
    if (v.isDestroyed() || !originalSettingsRef.current) return;

    const settings = originalSettingsRef.current;

    // Restore resolution
    v.resolutionScale = settings.resolutionScale;

    // Restore globe detail
    v.scene.globe.maximumScreenSpaceError = settings.maximumScreenSpaceError;

    // Restore FOV
    const frustum = v.camera.frustum as Cesium.PerspectiveFrustum;
    if (frustum instanceof Cesium.PerspectiveFrustum) {
      frustum.fov = settings.fov;
      frustum.xOffset = 0;
    }

    // Re-enable fog
    v.scene.fog.enabled = true;

    // Dispatch event so parent can restore post-processing shaders
    window.dispatchEvent(new CustomEvent('vr-mode-exit'));

    v.scene.requestRender();
  }, []);

  const exitVR = useCallback(async () => {
    // End XR session if active
    if (xrSessionRef.current) {
      try {
        await xrSessionRef.current.end();
      } catch (e) {
        // Session may already be ended
      }
      xrSessionRef.current = null;
    }

    // Stop any animation loop
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
    }

    // Restore original settings
    if (viewer && !viewer.isDestroyed()) {
      restoreSettings(viewer);
    }

    setIsActive(false);
    if (onExitVR) onExitVR();
  }, [viewer, onExitVR, restoreSettings]);

  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) {
      exitVR();
      return;
    }

    const initVR = async () => {
      try {
        // First optimize the scene for VR
        optimizeForVR(viewer);

        // Check if WebXR is available
        if ('xr' in navigator) {
          setStatusMessage('Checking VR support...');
          const xr = (navigator as any).xr;
          const supported = await xr.isSessionSupported('immersive-vr');
          
          if (supported) {
            try {
              setStatusMessage('Starting VR session...');
              
              // Request immersive VR session with minimal features for Quest compatibility
              const session: XRSession = await xr.requestSession('immersive-vr', {
                optionalFeatures: ['local-floor']
              });
              
              xrSessionRef.current = session;

              // Handle session end
              session.addEventListener('end', () => {
                xrSessionRef.current = null;
                exitVR();
              });

              // Lightweight XR frame loop - minimal work per frame
              const onXRFrame = (_time: DOMHighResTimeStamp, _frame: XRFrame) => {
                if (xrSessionRef.current) {
                  xrSessionRef.current.requestAnimationFrame(onXRFrame);
                }
              };
              
              session.requestAnimationFrame(onXRFrame);
              setIsActive(true);
              
            } catch (e) {
              console.log('Could not start immersive VR, using fallback mode');
              setIsActive(true);
            }
          } else {
            // Fallback: just enable optimized view
            setStatusMessage('VR not supported, using optimized view');
            setIsActive(true);
          }
        } else {
          // No WebXR, use simple fullscreen mode
          setStatusMessage('Entering optimized view...');
          setIsActive(true);
        }
      } catch (error) {
        console.error('VR initialization error:', error);
        setIsActive(true);
      }
    };

    initVR();

    return () => {
      if (xrSessionRef.current) {
        xrSessionRef.current.end().catch(() => {});
      }
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [viewer, exitVR, optimizeForVR]);

  if (!isActive) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}>
        <div style={{ color: 'white', textAlign: 'center' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '3px solid #333',
            borderTopColor: '#10b981',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p>{statusMessage}</p>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100vw', 
        height: '100vh',
        zIndex: 9999,
        pointerEvents: 'none'
      }}
    >
      {/* Exit VR button - visible on screen */}
      <button
        onClick={exitVR}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          padding: '16px 32px',
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '16px',
          fontSize: '18px',
          fontWeight: 'bold',
          cursor: 'pointer',
          zIndex: 10000,
          boxShadow: '0 4px 20px rgba(239, 68, 68, 0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          pointerEvents: 'auto'
        }}
      >
        🚪 Exit VR Mode
      </button>
      
      {/* VR Status indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '12px 24px',
          background: 'rgba(0, 0, 0, 0.8)',
          color: '#10b981',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          pointerEvents: 'none'
        }}
      >
        <span style={{ 
          width: '10px', 
          height: '10px', 
          background: '#10b981', 
          borderRadius: '50%',
          animation: 'pulse 2s infinite'
        }} />
        {xrSessionRef.current ? 'VR Active - Look around!' : 'VR Mode - Use touch to navigate'}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

// Legacy VRScene export for backwards compatibility
interface VRSceneProps {
  cesiumCanvas: HTMLCanvasElement | null;
  onExitVR?: () => void;
}

export const VRScene: React.FC<VRSceneProps> = ({ onExitVR }) => {
  useEffect(() => {
    console.warn('VRScene with cesiumCanvas prop is deprecated. Use ImmersiveVRScene with viewer prop.');
    if (onExitVR) setTimeout(onExitVR, 100);
  }, [onExitVR]);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <div style={{ color: 'white', textAlign: 'center' }}>
        <p>Please use the updated VR button.</p>
        <button 
          onClick={onExitVR}
          style={{
            marginTop: '20px',
            padding: '12px 24px',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Exit
        </button>
      </div>
    </div>
  );
};

export default ImmersiveVRScene;
