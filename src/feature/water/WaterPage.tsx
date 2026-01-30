import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Cesium from 'cesium';
import { debounce } from 'lodash';
import {
  estimateRoofArea,
  calculateWaterHarvestingPotential,
  calculateDailyLiters,
  createWaterPotentialIndicator
} from './utils/calculations';
import 'cesium/Widgets/widgets.css';

// Note: Ensure CESIUM_BASE_URL is set for static assets if using a custom build.
// For many sandbox environments, we can rely on standard imports.
(window as any).CESIUM_BASE_URL = 'https://cdn.jsdelivr.net/npm/cesium@1.114.0/Build/Cesium/';

const CESIUM_ACCESS_TOKEN = (import.meta as any).env?.VITE_CESIUM_ACCESS_TOKEN || '';
Cesium.Ion.defaultAccessToken = CESIUM_ACCESS_TOKEN;

const WaterPage: React.FC = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const highlightedFeatureRef = useRef<any>(null);
  const hoveredEntityRef = useRef<Cesium.Entity | null>(null);
  const buildingDataRef = useRef<Map<string, { potential: number; liters: number; area: number }>>(new Map());
  const rainStageRef = useRef<Cesium.PostProcessStage | null>(null);

  // UI State
  const [isRaining, setIsRaining] = useState(false);
  const [rainIntensity, setRainIntensity] = useState(1.0);
  const [rainAngle, setRainAngle] = useState(-0.6);
  const [rainSize, setRainSize] = useState(0.6);
  const [rainSpeed, setRainSpeed] = useState(60.0);

  // Sync atmospheric effects with rain state
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    if (isRaining) {
      const shadowDarkness = 0.3 + rainIntensity * 0.4;
      if (viewer.scene.shadowMap) viewer.scene.shadowMap.darkness = shadowDarkness;
      if (viewer.scene.skyAtmosphere) {
        viewer.scene.skyAtmosphere.hueShift = 0.1 * rainIntensity;
        viewer.scene.skyAtmosphere.saturationShift = -0.3 * rainIntensity;
        viewer.scene.skyAtmosphere.brightnessShift = -0.2 * rainIntensity;
      }
    } else {
      if (viewer.scene.shadowMap) viewer.scene.shadowMap.darkness = 0.3;
      if (viewer.scene.skyAtmosphere) {
        viewer.scene.skyAtmosphere.hueShift = 0.0;
        viewer.scene.skyAtmosphere.saturationShift = 0.0;
        viewer.scene.skyAtmosphere.brightnessShift = 0.0;
      }
    }
  }, [isRaining, rainIntensity]);

  // Create Rain Shader
  const createRainStage = (viewer: Cesium.Viewer) => {
    const fragmentShader = `
      uniform sampler2D colorTexture;
      uniform float tiltAngle;
      uniform float rainSize;
      uniform float rainSpeed;
      uniform float intensity;
      
      in vec2 v_textureCoordinates;

      float hash(float x) {
        return fract(sin(x * 133.3) * 13.13);
      }

      void main(void) {
        float time = czm_frameNumber / rainSpeed;
        vec2 resolution = czm_viewport.zw;
        vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
        
        vec3 rainColor = vec3(0.6, 0.8, 1.0);
        
        float a = tiltAngle;
        float si = sin(a), co = cos(a);
        uv = mat2(co, -si, si, co) * uv;
        uv *= length(uv + vec2(0.0, 4.9)) * rainSize + 1.0;
        
        float v = 1.0 - sin(hash(floor(uv.x * 100.0)) * 2.0);
        float streak = clamp(abs(sin(20.0 * time * v + uv.y * (5.0 / (2.0 + v)))) - 0.95, 0.0, 1.0) * 20.0;
        
        rainColor *= v * streak * intensity;
        
        vec4 originalColor = texture(colorTexture, v_textureCoordinates);
        out_FragColor = mix(originalColor, vec4(rainColor, 1.0), 0.3 * intensity);
      }
    `;

    const stage = new Cesium.PostProcessStage({
      name: "rain_effect",
      fragmentShader: fragmentShader,
      uniforms: {
        tiltAngle: () => rainAngle,
        rainSize: () => rainSize,
        rainSpeed: () => rainSpeed,
        intensity: () => (isRaining ? rainIntensity : 0.0),
      },
    });

    viewer.scene.postProcessStages.add(stage);
    rainStageRef.current = stage;
  };

  const highlightBuilding = useCallback((feature: any, liters: number) => {
    if (highlightedFeatureRef.current) {
      highlightedFeatureRef.current.color = Cesium.Color.WHITE;
    }

    let color = Cesium.Color.LIGHTSKYBLUE;
    if (liters > 5000) color = Cesium.Color.DEEPSKYBLUE;
    else if (liters > 2500) color = Cesium.Color.DODGERBLUE;
    else if (liters > 1000) color = Cesium.Color.CORNFLOWERBLUE;

    feature.color = color;
    highlightedFeatureRef.current = feature;
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const viewer = new Cesium.Viewer(containerRef.current, {
      terrain: Cesium.Terrain.fromWorldTerrain(),
      vrButton: true,
      animation: false,
      timeline: false,
      navigationHelpButton: false,
      sceneModePicker: false,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      // @ts-ignore
      shouldAnimate: true
    });

    viewerRef.current = viewer;
    if (viewer.scene.skyAtmosphere) {
      viewer.scene.skyAtmosphere.show = true;
    }

    // View Ahmedabad context
    const latitude = 23.0225;
    const longitude = 72.5714;
    const altitude = 1000;
    const position = Cesium.Cartesian3.fromDegrees(longitude, latitude, altitude);
    viewer.scene.camera.setView({
      destination: position,
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-35.0),
        roll: 0.0,
      },
    });

    // Initialize OSM Buildings
    Cesium.createOsmBuildingsAsync().then((tileset) => {
      viewer.scene.primitives.add(tileset);
      tileset.shadows = Cesium.ShadowMode.ENABLED;
    });

    if (viewer.scene.shadowMap) {
      viewer.scene.shadowMap.enabled = true;
      viewer.scene.shadowMap.size = 2048;
    }
    viewer.scene.light = new Cesium.SunLight();

    const fixedTime = new Date();
    fixedTime.setUTCHours(11, 0, 0, 0);
    viewer.clock.currentTime = Cesium.JulianDate.fromDate(fixedTime);
    viewer.clock.shouldAnimate = false;

    createRainStage(viewer);

    // Mouse Move Handler
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    const debouncedMouseMove = debounce((movement) => {
      const scene = viewer.scene;
      const pickedObject = scene.pick(movement.endPosition);

      if (Cesium.defined(pickedObject) && pickedObject.primitive instanceof Cesium.Cesium3DTileset) {
        const cartesian = scene.pickPosition(movement.endPosition);
        if (Cesium.defined(cartesian)) {
          // Clear previous hover entity
          if (hoveredEntityRef.current) {
            viewer.entities.remove(hoveredEntityRef.current);
          }

          // Check if it's a feature we can analyze
          if (pickedObject instanceof Cesium.Cesium3DTileFeature) {
            const elementId = pickedObject.getProperty("elementId");
            const height = pickedObject.getProperty("cesium#estimatedHeight") || 10;
            const levels = pickedObject.getProperty("building:levels") || Math.max(1, Math.floor(height / 3.5));
            const roofAngle = pickedObject.getProperty("roof:angle") || 0;

            const buildingKey = `${elementId}`;
            let data = buildingDataRef.current.get(buildingKey);

            if (!data) {
              const area = estimateRoofArea(height, levels);
              const potential = calculateWaterHarvestingPotential(area, roofAngle);
              const liters = calculateDailyLiters(potential, area, isRaining, rainIntensity);
              data = { area, potential, liters };
              buildingDataRef.current.set(buildingKey, data);
            }

            // Create Billboard
            const tooltipPosition = Cesium.Cartesian3.clone(cartesian);
            Cesium.Cartesian3.add(tooltipPosition, new Cesium.Cartesian3(0, 0, 15), tooltipPosition);

            hoveredEntityRef.current = viewer.entities.add({
              position: tooltipPosition,
              billboard: {
                image: createWaterPotentialIndicator(data.potential, data.liters),
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                scale: 0.6,
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
              },
            });

            highlightBuilding(pickedObject, data.liters);
          }
        }
      } else {
        if (hoveredEntityRef.current) {
          viewer.entities.remove(hoveredEntityRef.current);
          hoveredEntityRef.current = null;
        }
        if (highlightedFeatureRef.current) {
          highlightedFeatureRef.current.color = Cesium.Color.WHITE;
          highlightedFeatureRef.current = null;
        }
      }
    }, 50);

    handler.setInputAction(debouncedMouseMove, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    return () => {
      handler.destroy();
      viewer.destroy();
    };
  }, [highlightBuilding]);

  return (
    <div className="relative w-full h-full min-h-screen">
      <div ref={containerRef} className="absolute inset-0 w-full h-full bg-slate-900" />

      {/* Control Panel */}
      <div className="absolute top-5 left-5 z-10 w-72 p-5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl text-white">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span className="text-blue-400">💧</span> Water Analyst
          </h1>
          <button
            onClick={() => navigate('/')}
            className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded transition-colors"
          >
            ← Exit
          </button>
        </div>

        <button
          onClick={() => setIsRaining(!isRaining)}
          className={`w-full py-3 px-6 mb-5 rounded-lg font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${isRaining
            ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900'
            : 'bg-gradient-to-r from-blue-400 to-blue-600 text-white'
            } hover:-translate-y-1 active:scale-95`}
        >
          {isRaining ? '☀️ Stop Simulation' : '🌧️ Start Rainfall'}
        </button>

        {isRaining && (
          <div className="space-y-4 pt-4 border-t border-white/10 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider opacity-70">
                Intensity: {rainIntensity.toFixed(1)}
              </label>
              <input
                type="range"
                min="0.1"
                max="2.0"
                step="0.1"
                value={rainIntensity}
                onChange={(e) => setRainIntensity(parseFloat(e.target.value))}
                className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-400"
              />
              <div className="flex justify-between text-[10px] opacity-50">
                <span>Mist</span>
                <span>Downpour</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider opacity-70">
                Wind Angle: {rainAngle.toFixed(1)}
              </label>
              <input
                type="range"
                min="-1.5"
                max="1.5"
                step="0.1"
                value={rainAngle}
                onChange={(e) => setRainAngle(parseFloat(e.target.value))}
                className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider opacity-70">
                Drop Size: {rainSize.toFixed(1)}
              </label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.1"
                value={rainSize}
                onChange={(e) => setRainSize(parseFloat(e.target.value))}
                className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider opacity-70">
                Fall Speed: {rainSpeed.toFixed(0)}
              </label>
              <input
                type="range"
                min="20"
                max="120"
                step="10"
                value={rainSpeed}
                onChange={(e) => setRainSpeed(parseFloat(e.target.value))}
                className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-400"
              />
            </div>
          </div>
        )}

        <div className="mt-6 p-3 bg-white/5 rounded-lg border border-white/10 text-xs opacity-80">
          <p className="mb-2"><strong>Instructions:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Hover over buildings to analyze.</li>
            <li>Buildings are color-coded by yield.</li>
            <li>Rain intensity impacts potential.</li>
          </ul>
        </div>
      </div>

      {/* Footer Info */}
      <div className="absolute bottom-5 right-5 z-10 px-4 py-2 bg-black/40 backdrop-blur-sm rounded text-[10px] text-white/60">
        Ahmedabad, Gujarat Visualization • Data powered by OSM & Cesium
      </div>
    </div>
  );
};

export default WaterPage;
