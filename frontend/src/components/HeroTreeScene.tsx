'use client';

import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { useGLTF, PresentationControls, shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';

// ──────────────────────────────────────────────────────────────
// Holographic/X-Ray Tree
// ──────────────────────────────────────────────────────────────
function HolographicTree() {
    const { scene } = useGLTF('/tree/scene.gltf');

    // Custom holographic shader material
    const holoMaterial = useMemo(() => {
        return new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: new THREE.Color('#44cc88') }, // Green wireframe
                uRimColor: { value: new THREE.Color('#ccffdd') }, // Bright green rim
                uRimPower: { value: 3.0 },
            },
            vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
            fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        uniform vec3 uColor;
        uniform vec3 uRimColor;
        uniform float uRimPower;
        uniform float uTime;
        
        void main() {
          vec3 viewDir = normalize(cameraPosition - vPosition);
          float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), uRimPower);
          
          // Simple scanline effect moving upwards
          float scan = sin(vPosition.y * 20.0 - uTime * 2.0) * 0.5 + 0.5;
          
          // Mix base color with bright rim
          vec3 finalColor = mix(uColor * 0.3, uRimColor, fresnel);
          
          // Add scanline boost
          finalColor += vec3(scan * 0.1);
          
          // Alpha based on fresnel + scan (ghostly look)
          float alpha = fresnel * 0.8 + scan * 0.15;
          
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false, // Essential for overlapping transparency
            blending: THREE.AdditiveBlending,
        });
    }, []);

    // Update time uniform every frame
    useFrame(({ clock }) => {
        holoMaterial.uniforms.uTime.value = clock.elapsedTime;
    });

    const { root, s, cx, cy, cz } = useMemo(() => {
        const root = scene.clone(true);

        // Compute bounding box for centering/scaling
        const box = new THREE.Box3().setFromObject(root);
        const size = box.getSize(new THREE.Vector3());
        const ctr = box.getCenter(new THREE.Vector3());
        const s = 6.5 / Math.max(size.x, size.y, size.z);

        // Identify and replace material on all meshes
        root.traverse((obj) => {
            if ((obj as THREE.Mesh).isMesh) {
                const mesh = obj as THREE.Mesh;
                mesh.material = holoMaterial;
                mesh.castShadow = false;
                mesh.receiveShadow = false;
            }
        });

        return { root, s, cx: ctr.x, cy: ctr.y, cz: ctr.z };
    }, [scene, holoMaterial]);

    return (
        <PresentationControls
            global={false}
            cursor={true}
            snap={false}
            speed={1.5}
            zoom={1}
            rotation={[0, 0, 0]}
            polar={[-Math.PI / 4, Math.PI / 4]}
            azimuth={[-Infinity, Infinity]}
        >
            <group scale={s} position={[-cx * s, -cy * s + 0.5, -cz * s]}>
                <primitive object={root} />
            </group>
        </PresentationControls>
    );
}

// ──────────────────────────────────────────────────────────────
// Scroll-driven camera zoom
// ──────────────────────────────────────────────────────────────
function ScrollCamera({ scrollProgress }: { scrollProgress: React.MutableRefObject<number> }) {
    useFrame(({ camera }) => {
        const t = scrollProgress.current;
        const targetZ = 9.5 - t * 8.3;
        const targetY = 0.4 + t * 2.2;
        // Lerp position
        camera.position.z += (targetZ - camera.position.z) * 0.07;
        camera.position.y += (targetY - camera.position.y) * 0.07;
        camera.lookAt(0, 0.3 + t * 1.4, 0);
    });
    return null;
}

// ──────────────────────────────────────────────────────────────
// Grid Floor (Nature Beyond Tech style)
// ──────────────────────────────────────────────────────────────
function GridFloor() {
    return (
        <group position={[0, -2.5, 0]}>
            {/* Main grid */}
            <gridHelper args={[30, 30, 0x444444, 0x111111]} />
            {/* Subtle radial fade overlay if needed, or just keep it simple */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                <planeGeometry args={[30, 30]} />
                <meshBasicMaterial color="#000000" transparent opacity={0.6} depthWrite={false} />
            </mesh>
        </group>
    );
}

// ──────────────────────────────────────────────────────────────
// Main export
// ──────────────────────────────────────────────────────────────
export default function HeroTreeScene({
    scrollProgress,
}: {
    scrollProgress?: React.MutableRefObject<number>;
}) {
    const defaultScroll = useRef(0);
    const scrollRef = scrollProgress ?? defaultScroll;

    return (
        <div style={{ position: 'absolute', inset: 0 }}>
            {/* Dark background for hologram contrast */}
            <Canvas
                camera={{ position: [0, 0.4, 9.5], fov: 50, near: 0.1, far: 180 }}
                dpr={[1, 1.6]}
                gl={{ antialias: true }}
            >
                <color attach="background" args={['#050505']} />
                <fog attach="fog" args={['#050505', 10, 50]} />

                {/* ── Minimal Lighting ── 
            Holograms are self-illuminated, but scene lighting adds depth
        */}
                <ambientLight intensity={1.5} color="#ccffdd" />
                <spotLight position={[10, 10, 5]} intensity={0.8} color="#aaffcc" />

                <Suspense fallback={null}>
                    <HolographicTree />
                </Suspense>

                <GridFloor />
                <ScrollCamera scrollProgress={scrollRef} />
            </Canvas>
        </div>
    );
}

useGLTF.preload('/tree/scene.gltf');
