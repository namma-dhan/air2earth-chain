'use client';

import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, PresentationControls } from '@react-three/drei';
import * as THREE from 'three';

// ──────────────────────────────────────────────────────────────
// Seeded RNG
// ──────────────────────────────────────────────────────────────
function createRNG(seed: number) {
    let s = seed >>> 0;
    return () => {
        s += 0x6d2b79f5;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// ──────────────────────────────────────────────────────────────
// Tree model — Aesthetic Green Glow
// ──────────────────────────────────────────────────────────────
function TreeModel() {
    const { scene } = useGLTF('/tree/scene.gltf');

    const cloned = useMemo(() => {
        const root = scene.clone(true);
        root.traverse((obj) => {
            if ((obj as THREE.Mesh).isMesh) {
                const mesh = obj as THREE.Mesh;
                mesh.castShadow = true;
                mesh.receiveShadow = true;

                if (mesh.material) {
                    const mat = mesh.material as THREE.MeshStandardMaterial;
                    mat.side = THREE.DoubleSide;
                    // Add subtle green emissive glow to leaves/bark
                    mat.emissive = new THREE.Color('#004411');
                    mat.emissiveIntensity = 0.4;
                    // Tint base color slightly green
                    mat.color.lerp(new THREE.Color('#88ffaa'), 0.15);
                }
            }
        });
        return root;
    }, [scene]);

    const { s, cx, cy, cz } = useMemo(() => {
        const box = new THREE.Box3().setFromObject(cloned);
        const size = box.getSize(new THREE.Vector3());
        const ctr = box.getCenter(new THREE.Vector3());
        // Larger scale
        const s = 6.5 / Math.max(size.x, size.y, size.z);
        return { s, cx: ctr.x, cy: ctr.y, cz: ctr.z };
    }, [cloned]);

    return (
        <PresentationControls
            global={false} // dragging anywhere on the canvas? No, let's keep it local if possible, or global but constrained
            cursor={true}
            snap={false}
            speed={1.5}
            zoom={1}
            rotation={[0, 0, 0]}
            polar={[-Math.PI / 4, Math.PI / 4]} // Limit vertical look
            azimuth={[-Infinity, Infinity]}     // Free horizontal spin
        >
            <group scale={s} position={[-cx * s, -cy * s - 0.5, -cz * s]}>
                <primitive object={cloned} />
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
        // Zoom from z=9.5 → z=1.2
        const targetZ = 9.5 - t * 8.3;
        // Tilt up slightly
        const targetY = 0.4 + t * 2.2;

        camera.position.z += (targetZ - camera.position.z) * 0.07;
        camera.position.y += (targetY - camera.position.y) * 0.07;
        camera.lookAt(0, 0.3 + t * 1.4, 0);
    });
    return null;
}

// ──────────────────────────────────────────────────────────────
// Aesthetic Particles - Floating Green Dust
// ──────────────────────────────────────────────────────────────
function ParticleField() {
    const geo = useMemo(() => {
        const rng = createRNG(9999);
        const pts: number[] = [];
        for (let i = 0; i < 400; i++) {
            // Spread wide
            pts.push((rng() - 0.5) * 20, (rng() - 0.5) * 12, (rng() - 0.5) * 12);
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
        return g;
    }, []);

    const ref = useRef<THREE.Points>(null);
    useFrame(({ clock }) => {
        if (ref.current) {
            ref.current.rotation.y = clock.elapsedTime * 0.02; // slow spin
        }
    });

    return (
        <points ref={ref} geometry={geo}>
            <pointsMaterial
                color="#88ffaa"
                size={0.05}
                transparent
                opacity={0.6}
                sizeAttenuation
                depthWrite={false}
            />
        </points>
    );
}

// ──────────────────────────────────────────────────────────────
// Subtle Ground Glow Ring
// ──────────────────────────────────────────────────────────────
function GroundHalo() {
    const ref = useRef<THREE.Mesh>(null);
    useFrame(({ clock }) => {
        if (ref.current) {
            (ref.current.material as THREE.MeshBasicMaterial).opacity =
                0.08 + Math.sin(clock.elapsedTime * 1.5) * 0.04;
        }
    });
    return (
        <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.2, 0]}>
            <ringGeometry args={[1.5, 6, 64]} />
            <meshBasicMaterial color="#00ff55" transparent opacity={0.1} side={THREE.DoubleSide} />
        </mesh>
    );
}


function LoadingRing() {
    const ref = useRef<THREE.Mesh>(null);
    return (
        <mesh ref={ref}>
            <torusGeometry args={[1, 0.04, 8, 64]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.35} />
        </mesh>
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
            <Canvas
                camera={{ position: [0, 0.4, 9.5], fov: 50, near: 0.1, far: 180 }}
                dpr={[1, 1.6]}
                gl={{ antialias: true }}
                shadows
            >
                <color attach="background" args={['#040b06']} />
                <fog attach="fog" args={['#040b06', 15, 60]} />

                {/* ── Aesthetic Green Lighting ── */}
                {/* Ambient fill - dark teal */}
                <ambientLight intensity={0.4} color="#001a11" />

                {/* Main rim light - bright neon green from top-right-back */}
                <spotLight
                    position={[8, 10, -5]}
                    angle={0.6}
                    penumbra={0.5}
                    intensity={4}
                    color="#aaffcc"
                    castShadow
                />

                {/* Fill from left - soft forest green */}
                <pointLight position={[-6, 4, 4]} intensity={1.5} color="#00aa44" distance={20} />

                {/* Subtle under-glow - toxic green */}
                <pointLight position={[0, -3, 2]} intensity={0.8} color="#00ff66" distance={10} />


                <Suspense fallback={<LoadingRing />}>
                    <TreeModel />
                </Suspense>

                <ParticleField />
                <GroundHalo />

                <ScrollCamera scrollProgress={scrollRef} />
            </Canvas>
        </div>
    );
}

useGLTF.preload('/tree/scene.gltf');
