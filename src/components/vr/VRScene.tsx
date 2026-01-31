import React, { useEffect, useRef, useCallback } from 'react';
import * as Cesium from 'cesium';

interface ImmersiveVRSceneProps {
  viewer: Cesium.Viewer | null;
  onExitVR?: () => void;
}

/**
 * ImmersiveVRScene - True stereoscopic VR using Cesium's native rendering
 * 
 * This component enables WebXR immersive VR by:
 * 1. Requesting a WebXR 'immersive-vr' session
 * 2. Using stereo rendering (two cameras for left/right eyes)
 * 3. Syncing head tracking with Cesium's camera orientation
 * 4. Rendering the actual 3D scene stereoscopically, not as a texture
 */
export const ImmersiveVRScene: React.FC<ImmersiveVRSceneProps> = ({ viewer, onExitVR }) => {
  const xrSessionRef = useRef<XRSession | null>(null);
  const xrRefSpaceRef = useRef<XRReferenceSpace | null>(null);
  const animationFrameIdRef = useRef<number>(0);
  const initialCameraStateRef = useRef<{
    position: Cesium.Cartesian3;
    heading: number;
    pitch: number;
    roll: number;
  } | null>(null);
  const baseOrientationRef = useRef<{ heading: number; pitch: number; roll: number } | null>(null);

  const exitVR = useCallback(async () => {
    if (xrSessionRef.current) {
      try {
        await xrSessionRef.current.end();
      } catch (e) {
        console.warn('Error ending XR session:', e);
      }
      xrSessionRef.current = null;
    }
    
    // Restore original camera state
    if (viewer && !viewer.isDestroyed() && initialCameraStateRef.current) {
      viewer.camera.setView({
        destination: initialCameraStateRef.current.position,
        orientation: {
          heading: initialCameraStateRef.current.heading,
          pitch: initialCameraStateRef.current.pitch,
          roll: initialCameraStateRef.current.roll
        }
      });
    }
    
    if (onExitVR) onExitVR();
  }, [viewer, onExitVR]);

  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return;

    // Get WebGL context through the scene's frameState (Cesium internal)
    const gl = (viewer.scene as any).context._gl as WebGLRenderingContext;

    // Store initial camera state
    initialCameraStateRef.current = {
      position: viewer.camera.position.clone(),
      heading: viewer.camera.heading,
      pitch: viewer.camera.pitch,
      roll: viewer.camera.roll
    };

    // Initialize VR session
    const initVR = async () => {
      if (!('xr' in navigator)) {
        console.error('WebXR not available');
        exitVR();
        return;
      }

      const xr = (navigator as any).xr;
      
      try {
        // Check support
        const supported = await xr.isSessionSupported('immersive-vr');
        if (!supported) {
          console.error('Immersive VR not supported');
          exitVR();
          return;
        }

        // Request session
        const session: XRSession = await xr.requestSession('immersive-vr', {
          optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking', 'layers']
        });

        xrSessionRef.current = session;

        // Make WebGL context XR compatible
        await (gl as any).makeXRCompatible();

        // Set up XR layer
        const xrLayer = new (window as any).XRWebGLLayer(session, gl);
        await session.updateRenderState({ baseLayer: xrLayer });

        // Get reference space
        xrRefSpaceRef.current = await session.requestReferenceSpace('local-floor');

        // Store base orientation for relative head tracking
        baseOrientationRef.current = {
          heading: viewer.camera.heading,
          pitch: viewer.camera.pitch,
          roll: viewer.camera.roll
        };

        // Handle session end
        session.addEventListener('end', () => {
          xrSessionRef.current = null;
          cancelAnimationFrame(animationFrameIdRef.current);
          if (onExitVR) onExitVR();
        });

        // Start render loop
        const onXRFrame = (_time: number, frame: XRFrame) => {
          if (!xrSessionRef.current) return;
          
          animationFrameIdRef.current = session.requestAnimationFrame(onXRFrame);

          const pose = frame.getViewerPose(xrRefSpaceRef.current!);
          if (!pose) return;

          const glLayer = session.renderState.baseLayer!;
          
          // Process each view (typically 2 for stereo)
          for (const view of pose.views) {
            const viewport = glLayer.getViewport(view)!;
            
            // Extract rotation from view transform
            const orientation = view.transform.orientation;
            
            // Convert quaternion to Euler angles
            const qx = orientation.x;
            const qy = orientation.y;
            const qz = orientation.z;
            const qw = orientation.w;

            // Calculate Euler angles from quaternion
            const sinr_cosp = 2 * (qw * qx + qy * qz);
            const cosr_cosp = 1 - 2 * (qx * qx + qy * qy);
            const roll = Math.atan2(sinr_cosp, cosr_cosp);

            const sinp = 2 * (qw * qy - qz * qx);
            const pitch = Math.abs(sinp) >= 1 
              ? Math.sign(sinp) * Math.PI / 2 
              : Math.asin(sinp);

            const siny_cosp = 2 * (qw * qz + qx * qy);
            const cosy_cosp = 1 - 2 * (qy * qy + qz * qz);
            const yaw = Math.atan2(siny_cosp, cosy_cosp);

            // Apply head orientation to camera relative to base orientation
            if (baseOrientationRef.current && !viewer.isDestroyed()) {
              // Map VR orientation to Cesium camera
              // Yaw maps to heading, pitch to pitch, roll to roll
              const newHeading = baseOrientationRef.current.heading - yaw;
              const newPitch = baseOrientationRef.current.pitch + pitch;
              const newRoll = roll;

              viewer.camera.setView({
                destination: viewer.camera.position,
                orientation: {
                  heading: Cesium.Math.zeroToTwoPi(newHeading),
                  pitch: Cesium.Math.clamp(newPitch, -Cesium.Math.PI_OVER_TWO, Cesium.Math.PI_OVER_TWO),
                  roll: newRoll
                }
              });
            }

            // Set viewport for this eye
            gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height);
            
            // Apply eye offset for stereo effect
            const eyeOffset = view.eye === 'left' ? -0.032 : (view.eye === 'right' ? 0.032 : 0);
            
            if (!viewer.isDestroyed()) {
              // Apply stereo offset by adjusting frustum
              const camera = viewer.camera;
              const frustum = camera.frustum as Cesium.PerspectiveFrustum;
              
              if (frustum instanceof Cesium.PerspectiveFrustum) {
                // Apply asymmetric frustum for stereo
                frustum.xOffset = eyeOffset;
              }

              // Render scene for this eye
              viewer.scene.render();
            }
          }
        };

        // Start the XR render loop
        session.requestAnimationFrame(onXRFrame);

      } catch (error) {
        console.error('Failed to start VR session:', error);
        exitVR();
      }
    };

    initVR();

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      if (xrSessionRef.current) {
        xrSessionRef.current.end().catch(() => {});
      }
    };
  }, [viewer, exitVR, onExitVR]);

  return (
    <div 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100vw', 
        height: '100vh',
        zIndex: 9999,
        background: 'transparent',
        pointerEvents: 'auto'
      }}
    >
      {/* Exit VR button - visible in desktop mirror view */}
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
          gap: '8px'
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
          gap: '8px'
        }}
      >
        <span style={{ 
          width: '10px', 
          height: '10px', 
          background: '#10b981', 
          borderRadius: '50%',
          animation: 'pulse 2s infinite'
        }} />
        VR Active - Look around to explore
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
// This now wraps the ImmersiveVRScene
interface VRSceneProps {
  cesiumCanvas: HTMLCanvasElement | null;
  onExitVR?: () => void;
}

export const VRScene: React.FC<VRSceneProps> = ({ onExitVR }) => {
  // This component is now deprecated - use ImmersiveVRScene with viewer prop instead
  // We keep it for backwards compatibility but it won't properly work
  // as it doesn't have access to the Cesium viewer
  
  useEffect(() => {
    console.warn('VRScene with cesiumCanvas prop is deprecated. Use ImmersiveVRScene with viewer prop instead.');
    // Exit immediately as we can't properly render VR without viewer access
    if (onExitVR) {
      setTimeout(onExitVR, 100);
    }
  }, [onExitVR]);

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
        <p>VR initialization failed.</p>
        <p style={{ fontSize: '14px', opacity: 0.7 }}>Please use the updated VR implementation.</p>
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
