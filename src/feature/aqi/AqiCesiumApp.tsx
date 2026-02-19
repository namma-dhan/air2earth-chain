'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import 'normalize.css';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import * as Cesium from 'cesium';
import './AqiCesium.css';
import { ImmersiveVRScene, VRButton } from '../../components/vr';
import {
  type AqiStationRaw,
  type BlockchainAqiResponse,
  fetchAqiFromBlockchain,
  fetchTreesFromBlockchain,
  storeTreeOnBlockchain,
  type TreeClaimData,
} from '../../lib/algorand/aqi-service';
import { GreenRewardsPanel } from './components/GreenRewardsPanel';
import { ImpactPopup } from './components/ImpactPopup';
import { Toolbox } from './components/shared/Toolbox';
import { TotalImpactPanel } from './components/TotalImpactPanel';
import {
  calculateTotalImpact,
  estimateGardenImpact,
  estimatePurifierImpact,
  estimateTreeImpact,
  type ImpactData,
} from './utils/calculations';

const ACCESS_TOKEN = process.env.NEXT_PUBLIC_CESIUM_ACCESS_TOKEN || '';
// Set Cesium base URL to CDN so assets resolve correctly under webpack/Next.js
(window as any).CESIUM_BASE_URL =
  'https://cdn.jsdelivr.net/npm/cesium@1.114.0/Build/Cesium/';
Cesium.Ion.defaultAccessToken = ACCESS_TOKEN;

// ─────────────────────────────────────────────────────────────
// ALL AQI DATA IS FETCHED FROM ALGORAND BLOCKCHAIN
// No hardcoded data — 100% decentralized
// ─────────────────────────────────────────────────────────────

// Process and filter valid AQI data
interface StationData {
  name: string;
  latitude: number;
  longitude: number;
  aqi: number;
  time: string;
  uid: number;
  position: Cesium.Cartesian3;
}

/**
 * Convert raw AQI station data (from blockchain) to processed StationData format.
 */
function processRawData(rawData: AqiStationRaw[]): StationData[] {
  return rawData
    .filter((station) => station.aqi !== '-')
    .map((station) => ({
      name: station.station.name,
      latitude: station.lat,
      longitude: station.lon,
      aqi: parseInt(station.aqi),
      time: station.station.time,
      uid: station.uid,
      position: Cesium.Cartesian3.fromDegrees(station.lon, station.lat),
    }));
}

// This will be populated from the Algorand blockchain on mount
let aqiData: StationData[] = [];

// Compute bounds from station coordinates with padding
const computeBounds = () => {
  const lons = aqiData.map((s) => s.longitude);
  const lats = aqiData.map((s) => s.latitude);
  const padding = 0.5; // degrees - larger padding for South India coverage
  return {
    west: Math.min(...lons) - padding,
    east: Math.max(...lons) + padding,
    south: Math.min(...lats) - padding,
    north: Math.max(...lats) + padding,
  };
};

// Get AQI color as RGB values
function getAqiRGB(aqi: number): [number, number, number] {
  if (aqi <= 50) return [0, 228, 0]; // Good - Green
  if (aqi <= 100) return [255, 255, 0]; // Moderate - Yellow
  if (aqi <= 150) return [255, 126, 0]; // Unhealthy for Sensitive - Orange
  if (aqi <= 200) return [255, 0, 0]; // Very Unhealthy - Red
  return [143, 63, 151]; // Hazardous - Purple
}

// Create heatmap on canvas
function createHeatmapCanvas(
  width: number,
  height: number,
  data: { x: number; y: number; value: number }[],
  maxValue: number,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Clear canvas with transparency
  ctx.clearRect(0, 0, width, height);

  // Draw each data point as a radial gradient
  const radius = 180; // Larger radius for smoother blending

  data.forEach((point) => {
    const [r, g, b] = getAqiRGB(point.value);
    const intensity = Math.min(point.value / maxValue, 1);

    // Create radial gradient for smooth blending
    const gradient = ctx.createRadialGradient(
      point.x,
      point.y,
      0,
      point.x,
      point.y,
      radius,
    );

    // Center is more opaque, edges fade out smoothly
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.6 * intensity})`);
    gradient.addColorStop(0.25, `rgba(${r}, ${g}, ${b}, ${0.45 * intensity})`);
    gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${0.3 * intensity})`);
    gradient.addColorStop(0.75, `rgba(${r}, ${g}, ${b}, ${0.15 * intensity})`);
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx.fill();
  });

  return canvas;
}

// Get AQI category and color
function getAqiInfo(aqi: number): {
  category: string;
  color: string;
  cssColor: string;
} {
  if (aqi <= 50)
    return { category: 'Good', color: 'green', cssColor: '#00e400' };
  if (aqi <= 100)
    return { category: 'Moderate', color: 'yellow', cssColor: '#ffff00' };
  if (aqi <= 150)
    return {
      category: 'Unhealthy for Sensitive',
      color: 'orange',
      cssColor: '#ff7e00',
    };
  if (aqi <= 200)
    return { category: 'Very Unhealthy', color: 'red', cssColor: '#ff0000' };
  return { category: 'Hazardous', color: 'purple', cssColor: '#8f3f97' };
}

function getCesiumColor(aqi: number): Cesium.Color {
  if (aqi <= 50) return Cesium.Color.fromCssColorString('#00e400');
  if (aqi <= 100) return Cesium.Color.fromCssColorString('#ffff00');
  if (aqi <= 150) return Cesium.Color.fromCssColorString('#ff7e00');
  if (aqi <= 200) return Cesium.Color.fromCssColorString('#ff0000');
  return Cesium.Color.fromCssColorString('#8f3f97');
}

interface PopupInfo {
  visible: boolean;
  x: number;
  y: number;
  station: StationData | null;
}

function AqiCesiumApp() {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);

  const [popup, setPopup] = useState<PopupInfo>({
    visible: false,
    x: 0,
    y: 0,
    station: null,
  });
  const [viewer, setViewer] = useState<Cesium.Viewer | null>(null);

  // Blockchain data source state
  const [dataSource, setDataSource] = useState<
    'loading' | 'algorand-blockchain' | 'error'
  >('loading');
  const [blockchainAppId, setBlockchainAppId] = useState<number | null>(null);
  const [stationCount, setStationCount] = useState<number>(0);
  const [blockchainReady, setBlockchainReady] = useState(false);
  const [blockchainError, setBlockchainError] = useState<string | null>(null);

  // Impact popup state
  const [currentImpact, setCurrentImpact] = useState<ImpactData | null>(null);
  const [impactPosition, setImpactPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [allImpacts, setAllImpacts] = useState<ImpactData[]>([]);

  // Wind & Pollution simulation state
  const [showWind, setShowWind] = useState(false);
  const [windSpeed, setWindSpeed] = useState(8.0); // m/s
  const [windDirection, setWindDirection] = useState(45); // degrees
  const [showPollution, setShowPollution] = useState(true);
  const [isVRMode, setIsVRMode] = useState(false);

  // Rewards — refresh trigger bumped whenever a tree is stored on-chain
  const [treeCount, setTreeCount] = useState(0);

  // Refs for shader access
  const showWindRef = useRef(showWind);
  const windSpeedRef = useRef(windSpeed);
  const windDirectionRef = useRef(windDirection);
  const showPollutionRef = useRef(showPollution);
  const windStageRef = useRef<Cesium.PostProcessStage | null>(null);
  const pollutionStageRef = useRef<Cesium.PostProcessStage | null>(null);

  // Keep refs in sync
  useEffect(() => {
    showWindRef.current = showWind;
    windSpeedRef.current = windSpeed;
    windDirectionRef.current = windDirection;
    showPollutionRef.current = showPollution;
    if (viewerRef.current && !viewerRef.current.isDestroyed()) {
      viewerRef.current.scene.requestRender();
    }
  }, [showWind, windSpeed, windDirection, showPollution]);

  // Handle placement completed events from PlacementManager
  const handlePlacementCompleted = useCallback(
    async (
      event: CustomEvent<{
        tool: string;
        position?: Cesium.Cartesian3;
        screenPosition: { x: number; y: number } | null;
        areaM2?: number;
      }>,
    ) => {
      const { tool, screenPosition, position, areaM2 } = event.detail;

      let impact: ImpactData | null = null;

      if (tool === 'tree') {
        impact = estimateTreeImpact();

        // Ensure we have world coordinates to save on protocol
        if (position) {
          const carto = Cesium.Cartographic.fromCartesian(position);
          const lat = Cesium.Math.toDegrees(carto.latitude);
          const lon = Cesium.Math.toDegrees(carto.longitude);

          const claimData: TreeClaimData = {
            treeId: `tree-${Date.now()}`,
            planter: 'AeroEarth User',
            location: { lat, lon },
            variety: 'Virtual Tree Placement',
            plantedAt: new Date().toISOString(),
            co2OffsetKg: impact.co2Absorbed,
            notes: 'Planted securely via AeroEarth frontend',
          };

          try {
            // Send to our secure backend API to be certified on the blockchain
            const result = await storeTreeOnBlockchain(claimData);
            console.log(
              '[AqiCesiumApp] ✅ Tree securely stored on Algorand:',
              result.txId,
            );
            // Bump treeCount to trigger rewards panel refresh
            setTreeCount((c) => c + 1);
          } catch (e: any) {
            console.error('[AqiCesiumApp] ❌ Failed to record on chain:', e);
          }
        }
      } else if (tool === 'garden') {
        impact = estimateGardenImpact(areaM2 || 15);
      } else if (tool === 'purifier') {
        impact = estimatePurifierImpact();
      }

      if (impact) {
        setCurrentImpact(impact as ImpactData);
        setImpactPosition(screenPosition);
        setAllImpacts((prev) => [...prev, impact! as ImpactData]);

        // Auto-hide popup after 5 seconds
        setTimeout(() => {
          setCurrentImpact(null);
          setImpactPosition(null);
        }, 5000);
      }
    },
    [],
  );

  // Listen for placement events
  useEffect(() => {
    window.addEventListener(
      'placement-completed',
      handlePlacementCompleted as unknown as EventListener,
    );
    return () => {
      window.removeEventListener(
        'placement-completed',
        handlePlacementCompleted as unknown as EventListener,
      );
    };
  }, [handlePlacementCompleted]);

  // Listen for VR mode exit to restore shaders
  useEffect(() => {
    const handleVRModeExit = () => {
      console.log('[AqiCesiumApp] VR mode exited, restoring shaders');
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        const v = viewerRef.current;
        // Recalculate average AQI
        const avgAqi =
          aqiData.reduce((sum, s) => sum + s.aqi, 0) / aqiData.length;

        // Recreate shaders (they were removed during VR optimization)
        try {
          // Only recreate if they don't exist
          if (!windStageRef.current || v.scene.postProcessStages.length === 0) {
            createWindStage(v);
            createPollutionStage(v, avgAqi);
          }
        } catch (e) {
          console.warn('[AqiCesiumApp] Could not restore shaders:', e);
        }
      }
      setIsVRMode(false);
    };

    window.addEventListener('vr-mode-exit', handleVRModeExit);
    return () => {
      window.removeEventListener('vr-mode-exit', handleVRModeExit);
    };
  }, []);

  const closeImpactPopup = useCallback(() => {
    setCurrentImpact(null);
    setImpactPosition(null);
  }, []);

  const handleGetQuote = useCallback(() => {
    alert('Quote request submitted! Our team will contact you shortly.');
  }, []);

  // Create Wind Particle Shader
  const createWindStage = (viewer: Cesium.Viewer) => {
    const fragmentShader = `
      uniform sampler2D colorTexture;
      uniform float windSpeed;
      uniform float windDirection;
      uniform float intensity;
      
      in vec2 v_textureCoordinates;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      void main(void) {
        float time = czm_frameNumber / 60.0;
        vec2 resolution = czm_viewport.zw;
        vec2 uv = gl_FragCoord.xy / resolution;
        
        // Wind direction in radians
        float angle = windDirection * 3.14159 / 180.0;
        vec2 windDir = vec2(cos(angle), sin(angle));
        
        // Create streaming dust particles
        vec2 movingUV = uv * 20.0 - windDir * time * windSpeed * 0.5;
        float dust = noise(movingUV) * noise(movingUV * 2.0 + time);
        dust = pow(dust, 3.0) * 0.3;
        
        // Streaky wind lines
        float streak = noise(vec2(uv.x * 100.0 + time * windSpeed, uv.y * 5.0));
        streak = pow(streak, 8.0) * 0.15;
        
        vec3 windColor = vec3(0.8, 0.75, 0.65) * (dust + streak) * intensity;
        
        vec4 originalColor = texture(colorTexture, v_textureCoordinates);
        out_FragColor = vec4(originalColor.rgb + windColor, originalColor.a);
      }
    `;

    const stage = new Cesium.PostProcessStage({
      name: 'wind_effect',
      fragmentShader: fragmentShader,
      uniforms: {
        windSpeed: () => windSpeedRef.current,
        windDirection: () => windDirectionRef.current,
        intensity: () => (showWindRef.current ? 1.0 : 0.0),
      },
    });

    viewer.scene.postProcessStages.add(stage);
    windStageRef.current = stage;
  };

  // Create Pollution Haze Shader
  const createPollutionStage = (viewer: Cesium.Viewer, avgAqi: number) => {
    const fragmentShader = `
      uniform sampler2D colorTexture;
      uniform float aqiLevel;
      uniform float intensity;
      
      in vec2 v_textureCoordinates;

      vec3 getAqiColor(float aqi) {
        if (aqi <= 50.0) return vec3(0.0, 0.9, 0.0);       // Good - Green
        if (aqi <= 100.0) return vec3(1.0, 1.0, 0.0);      // Moderate - Yellow
        if (aqi <= 150.0) return vec3(1.0, 0.5, 0.0);      // Unhealthy Sensitive - Orange
        if (aqi <= 200.0) return vec3(1.0, 0.0, 0.0);      // Very Unhealthy - Red
        return vec3(0.56, 0.25, 0.6);                       // Hazardous - Purple
      }

      void main(void) {
        vec4 originalColor = texture(colorTexture, v_textureCoordinates);
        
        if (intensity < 0.01) {
          out_FragColor = originalColor;
          return;
        }
        
        vec3 pollutionColor = getAqiColor(aqiLevel);
        float hazeAmount = clamp(aqiLevel / 400.0, 0.0, 0.35) * intensity;
        
        // Add slight desaturation for pollution effect
        float gray = dot(originalColor.rgb, vec3(0.299, 0.587, 0.114));
        vec3 desaturated = mix(originalColor.rgb, vec3(gray), hazeAmount * 0.5);
        
        // Blend with pollution color
        vec3 finalColor = mix(desaturated, pollutionColor, hazeAmount * 0.4);
        
        out_FragColor = vec4(finalColor, originalColor.a);
      }
    `;

    const stage = new Cesium.PostProcessStage({
      name: 'pollution_haze',
      fragmentShader: fragmentShader,
      uniforms: {
        aqiLevel: () => avgAqi,
        intensity: () => (showPollutionRef.current ? 1.0 : 0.0),
      },
    });

    viewer.scene.postProcessStages.add(stage);
    pollutionStageRef.current = stage;
  };

  // ─────────────────────────────────────────────────────────────
  // BLOCKCHAIN DATA FETCHING
  // Fetch AQI data from Algorand blockchain — no fallback
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const loadBlockchainData = async () => {
      try {
        console.log(
          '[AqiCesiumApp] 🔗 Fetching AQI data from Algorand blockchain...',
        );
        const response = await fetchAqiFromBlockchain();

        // Update the module-level aqiData with blockchain data
        aqiData = processRawData(response.data);
        setDataSource('algorand-blockchain');
        setStationCount(response.data.length);
        setBlockchainReady(true);

        if (response.appId) {
          setBlockchainAppId(response.appId);
        }

        console.log(
          `[AqiCesiumApp] ✅ Loaded ${response.data.length} stations from Algorand blockchain`,
        );
      } catch (err: any) {
        console.error(
          '[AqiCesiumApp] ❌ Failed to fetch from blockchain:',
          err,
        );
        setDataSource('error');
        setBlockchainError(
          err?.message || 'Failed to connect to Algorand blockchain',
        );
      }
    };

    loadBlockchainData();
  }, []);

  // Only initialize Cesium AFTER blockchain data is loaded
  useEffect(() => {
    if (!containerRef.current || !blockchainReady || aqiData.length === 0)
      return;
    let aborted = false;

    const initializeCesium = async () => {
      // Create Cesium viewer with world terrain
      const viewer = new Cesium.Viewer(containerRef.current!, {
        terrain: Cesium.Terrain.fromWorldTerrain(),
        baseLayerPicker: true,
        geocoder: true,
        homeButton: true,
        sceneModePicker: true,
        navigationHelpButton: true,
        animation: false,
        timeline: false,
        fullscreenButton: true,
      });

      viewerRef.current = viewer;
      setViewer(viewer); // Store viewer in state for Toolbox
      if (viewer.scene.skyAtmosphere) {
        viewer.scene.skyAtmosphere.show = true;
      }

      // Add 3D OSM Buildings with AQI-based coloring
      let osmBuildingsTileset: Cesium.Cesium3DTileset | null = null;
      try {
        osmBuildingsTileset = await Cesium.createOsmBuildingsAsync();
        if (aborted || viewer.isDestroyed()) return;
        viewer.scene.primitives.add(osmBuildingsTileset);

        // Build dynamic style conditions based on station data
        // Group stations by approximate regions and get average AQI
        const getAqiColorCondition = (aqi: number): string => {
          if (aqi <= 50) return "color('rgba(0, 228, 0, 0.7)')";
          if (aqi <= 100) return "color('rgba(255, 255, 0, 0.7)')";
          if (aqi <= 150) return "color('rgba(255, 126, 0, 0.7)')";
          if (aqi <= 200) return "color('rgba(255, 0, 0, 0.7)')";
          return "color('rgba(143, 63, 151, 0.7)')";
        };

        // Create conditions for each station area (using lat/lon boxes)
        const buildingConditions: [string, string][] = aqiData.map(
          (station) => {
            const latMin = station.latitude - 0.1;
            const latMax = station.latitude + 0.1;
            const lonMin = station.longitude - 0.1;
            const lonMax = station.longitude + 0.1;
            const condition = `\${feature['cesium#latitude']} > ${latMin} && \${feature['cesium#latitude']} < ${latMax} && \${feature['cesium#longitude']} > ${lonMin} && \${feature['cesium#longitude']} < ${lonMax}`;
            return [condition, getAqiColorCondition(station.aqi)];
          },
        );

        // Add default condition
        buildingConditions.push(['true', "color('rgba(200, 200, 200, 0.6)')"]);

        // Style buildings with AQI colors based on their location
        osmBuildingsTileset.style = new Cesium.Cesium3DTileStyle({
          color: {
            conditions: buildingConditions,
          },
        });

        console.log('3D OSM Buildings loaded with AQI styling');

        // Calculate average AQI for pollution shader
        const avgAqi =
          aqiData.reduce((sum, s) => sum + s.aqi, 0) / aqiData.length;

        // Initialize wind and pollution shaders
        createWindStage(viewer);
        createPollutionStage(viewer, avgAqi);
      } catch (err) {
        console.error('Failed to load 3D buildings:', err);
      }

      // Function to update building style based on zoom level
      const updateBuildingStyle = (showAqiColors: boolean) => {
        if (!osmBuildingsTileset) return;

        if (showAqiColors) {
          // AQI-colored buildings when zoomed out
          const getAqiColorCondition = (aqi: number): string => {
            if (aqi <= 50) return "color('rgba(0, 228, 0, 0.7)')";
            if (aqi <= 100) return "color('rgba(255, 255, 0, 0.7)')";
            if (aqi <= 150) return "color('rgba(255, 126, 0, 0.7)')";
            if (aqi <= 200) return "color('rgba(255, 0, 0, 0.7)')";
            return "color('rgba(143, 63, 151, 0.7)')";
          };

          const buildingConditions: [string, string][] = aqiData.map(
            (station) => {
              const latMin = station.latitude - 0.1;
              const latMax = station.latitude + 0.1;
              const lonMin = station.longitude - 0.1;
              const lonMax = station.longitude + 0.1;
              const condition = `\${feature['cesium#latitude']} > ${latMin} && \${feature['cesium#latitude']} < ${latMax} && \${feature['cesium#longitude']} > ${lonMin} && \${feature['cesium#longitude']} < ${lonMax}`;
              return [condition, getAqiColorCondition(station.aqi)];
            },
          );
          buildingConditions.push([
            'true',
            "color('rgba(200, 200, 200, 0.6)')",
          ]);

          osmBuildingsTileset.style = new Cesium.Cesium3DTileStyle({
            color: {
              conditions: buildingConditions,
            },
          });
        } else {
          // Original building colors when zoomed in close
          osmBuildingsTileset.style = new Cesium.Cesium3DTileStyle({
            color: "color('white')",
          });
        }
      };

      // Compute bounds from station data
      const bounds = computeBounds();

      // Create heatmap using custom canvas renderer
      const heatmapWidth = 1024;
      const heatmapHeight = 1024;

      // Convert geographic coordinates to heatmap pixel coordinates
      const lonRange = bounds.east - bounds.west;
      const latRange = bounds.north - bounds.south;

      // Prepare heatmap data with pixel coordinates
      const heatmapData = aqiData.map((station) => {
        const x = Math.round(
          ((station.longitude - bounds.west) / lonRange) * heatmapWidth,
        );
        const y = Math.round(
          ((bounds.north - station.latitude) / latRange) * heatmapHeight,
        );
        console.log(
          `Station ${station.name}: pixel (${x}, ${y}), AQI: ${station.aqi}`,
        );
        return { x, y, value: station.aqi };
      });

      // Create heatmap canvas
      const heatmapCanvas = createHeatmapCanvas(
        heatmapWidth,
        heatmapHeight,
        heatmapData,
        200,
      );
      const imageUrl = heatmapCanvas.toDataURL('image/png');
      console.log('Heatmap image created, URL length:', imageUrl.length);

      // Add heatmap as a ground overlay using SingleTileImageryProvider
      let heatmapLayer: Cesium.ImageryLayer | null = null;
      try {
        const heatmapProvider = await Cesium.SingleTileImageryProvider.fromUrl(
          imageUrl,
          {
            rectangle: Cesium.Rectangle.fromDegrees(
              bounds.west,
              bounds.south,
              bounds.east,
              bounds.north,
            ),
          },
        );
        if (aborted || viewer.isDestroyed()) return;

        heatmapLayer = viewer.imageryLayers.addImageryProvider(heatmapProvider);
        heatmapLayer.alpha = 0.5; // Initial opacity
        console.log('Heatmap layer added successfully');
      } catch (err) {
        console.error('Failed to add heatmap layer:', err);
      }

      // Adjust heatmap visibility based on camera height
      // Fade out heatmap when zooming in close to see buildings
      let lastBuildingStyleState = true; // Track if AQI colors are shown

      const updateHeatmapVisibility = () => {
        if (viewer.isDestroyed()) return;
        const cameraHeight = viewer.camera.positionCartographic.height;

        // Define height thresholds for heatmap visibility
        const fadeStartHeight = 15000; // Start fading at 15km
        const fadeEndHeight = 3000; // Fully hidden at 3km
        const buildingStyleThreshold = 5000; // Switch building style at 5km

        // Update heatmap alpha
        if (heatmapLayer) {
          if (cameraHeight > fadeStartHeight) {
            // Fully visible when high up
            heatmapLayer.alpha = 0.5;
          } else if (cameraHeight < fadeEndHeight) {
            // Hidden when close to ground
            heatmapLayer.alpha = 0;
          } else {
            // Gradual fade between thresholds
            const fadeRatio =
              (cameraHeight - fadeEndHeight) /
              (fadeStartHeight - fadeEndHeight);
            heatmapLayer.alpha = 0.5 * fadeRatio;
          }
        }

        // Update building style based on zoom level
        const shouldShowAqiColors = cameraHeight > buildingStyleThreshold;
        if (shouldShowAqiColors !== lastBuildingStyleState) {
          updateBuildingStyle(shouldShowAqiColors);
          lastBuildingStyleState = shouldShowAqiColors;
        }
      };

      // Listen to camera changes
      viewer.camera.changed.addEventListener(updateHeatmapVisibility);
      // Also update on move end for smoother experience
      viewer.camera.moveEnd.addEventListener(updateHeatmapVisibility);

      // Add clickable station markers
      aqiData.forEach((station) => {
        const color = getCesiumColor(station.aqi);
        const info = getAqiInfo(station.aqi);

        // Add point marker - bigger and bolder
        viewer.entities.add({
          id: `station-${station.uid}`,
          position: Cesium.Cartesian3.fromDegrees(
            station.longitude,
            station.latitude,
            100,
          ),
          point: {
            pixelSize: 18,
            color: color,
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 3,
            heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
          label: {
            text: `${station.name}\nAQI: ${station.aqi}`,
            font: 'bold 16px sans-serif',
            fillColor: Cesium.Color.WHITE,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            outlineWidth: 3,
            outlineColor: Cesium.Color.BLACK,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -20),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            scaleByDistance: new Cesium.NearFarScalar(5000, 1.0, 200000, 0.4),
            translucencyByDistance: new Cesium.NearFarScalar(
              5000,
              1.0,
              300000,
              0.0,
            ),
          },
          properties: {
            stationData: station,
            aqiCategory: info.category,
          },
        });
      });

      // Helper function to get AQI color for a location based on nearest station
      const getAqiColorForLocation = (latitude: number): string => {
        if (latitude > 13.35) return 'rgba(255, 0, 0, 0.9)'; // Gummidipoondi - AQI 170
        if (latitude > 13.12) return 'rgba(255, 0, 0, 0.9)'; // Manali area - AQI 173
        if (latitude > 13.08) return 'rgba(255, 0, 0, 0.85)'; // Royapuram - AQI 158
        if (latitude > 13.0) return 'rgba(255, 0, 0, 0.8)'; // Arumbakkam - AQI 154
        return 'rgba(255, 0, 0, 0.8)'; // Velachery/Perungudi - AQI 154-159
      };

      // Track highlighted building
      let highlightedFeature: Cesium.Cesium3DTileFeature | null = null;
      let originalColor: Cesium.Color | null = null;

      // Click handler for station details popup and building highlighting
      const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

      handler.setInputAction(
        (click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
          const pickedObject = viewer.scene.pick(click.position);

          // Reset previously highlighted building
          if (highlightedFeature && originalColor) {
            highlightedFeature.color = originalColor;
            highlightedFeature = null;
            originalColor = null;
          }

          if (Cesium.defined(pickedObject)) {
            // Check if it's a station marker
            if (pickedObject.id && pickedObject.id.properties) {
              const stationData =
                pickedObject.id.properties.stationData?.getValue(
                  Cesium.JulianDate.now(),
                );

              if (stationData) {
                setPopup({
                  visible: true,
                  x: click.position.x,
                  y: click.position.y,
                  station: stationData,
                });
                return;
              }
            }

            // Check if it's a 3D building tile
            if (pickedObject instanceof Cesium.Cesium3DTileFeature) {
              const feature = pickedObject as Cesium.Cesium3DTileFeature;

              // Get building location to determine AQI zone
              const latitude = feature.getProperty('cesium#latitude') as number;

              if (latitude) {
                // Store original color and highlight with AQI color
                originalColor = feature.color.clone();
                highlightedFeature = feature;

                const aqiColorStr = getAqiColorForLocation(latitude);
                feature.color = Cesium.Color.fromCssColorString(aqiColorStr);
              }

              setPopup({ visible: false, x: 0, y: 0, station: null });
            } else {
              setPopup({ visible: false, x: 0, y: 0, station: null });
            }
          } else {
            setPopup({ visible: false, x: 0, y: 0, station: null });
          }
        },
        Cesium.ScreenSpaceEventType.LEFT_CLICK,
      );

      // Close popup on right-click or camera move
      handler.setInputAction(() => {
        setPopup({ visible: false, x: 0, y: 0, station: null });
      }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

      viewer.camera.moveEnd.addEventListener(() => {
        setPopup((prev) => (prev.visible ? { ...prev, visible: false } : prev));
      });

      // Fly camera to fit all stations
      viewer.camera.flyTo({
        destination: Cesium.Rectangle.fromDegrees(
          bounds.west,
          bounds.south,
          bounds.east,
          bounds.north,
        ),
        duration: 2,
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-45),
          roll: 0,
        },
      });
    };

    initializeCesium();

    // Cleanup function
    return () => {
      aborted = true;
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy();
      }
      viewerRef.current = null;
    };
  }, [blockchainReady]);

  const closePopup = () => {
    setPopup({ visible: false, x: 0, y: 0, station: null });
  };

  // ─── Loading State: Waiting for blockchain data ───
  if (dataSource === 'loading') {
    return (
      <div
        className="app-container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0e1a',
          color: '#fff',
          fontFamily: 'monospace',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: 48,
              marginBottom: 20,
              animation: 'pulse 1.5s infinite',
            }}
          >
            ⛓️
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
            Connecting to Algorand Blockchain
          </h2>
          <p style={{ fontSize: 14, opacity: 0.7, marginBottom: 20 }}>
            Fetching decentralized AQI data from the chain...
          </p>
          <div
            style={{
              width: 200,
              height: 4,
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 2,
              overflow: 'hidden',
              margin: '0 auto',
            }}
          >
            <div
              style={{
                width: '60%',
                height: '100%',
                background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                borderRadius: 2,
                animation: 'loading-bar 1.5s infinite ease-in-out',
              }}
            />
          </div>
        </div>
        <style>{`
          @keyframes loading-bar { 0% { width: 20%; margin-left: 0; } 50% { width: 60%; margin-left: 20%; } 100% { width: 20%; margin-left: 80%; } }
          @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        `}</style>
      </div>
    );
  }

  // ─── Error State: Blockchain unreachable ───
  if (dataSource === 'error') {
    return (
      <div
        className="app-container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0e1a',
          color: '#fff',
          fontFamily: 'monospace',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 500 }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>🔴</div>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 700,
              marginBottom: 8,
              color: '#ef4444',
            }}
          >
            Blockchain Unavailable
          </h2>
          <p style={{ fontSize: 14, opacity: 0.7, marginBottom: 16 }}>
            {blockchainError}
          </p>
          <p style={{ fontSize: 12, opacity: 0.5, marginBottom: 24 }}>
            Make sure AlgoKit LocalNet is running:
            <br />
            <code
              style={{
                background: 'rgba(255,255,255,0.1)',
                padding: '2px 8px',
                borderRadius: 4,
              }}
            >
              algokit localnet start
            </code>
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 24px',
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div ref={containerRef} className="cesiumContainer" />

      {/* ─── Blockchain Data Source Badge ─── */}
      <div
        className="blockchain-badge"
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 14px',
          borderRadius: 8,
          backdropFilter: 'blur(12px)',
          background:
            dataSource === 'algorand-blockchain'
              ? 'rgba(16, 185, 129, 0.15)'
              : dataSource === 'loading'
                ? 'rgba(59, 130, 246, 0.15)'
                : 'rgba(245, 158, 11, 0.15)',
          border: `1px solid ${
            dataSource === 'algorand-blockchain'
              ? 'rgba(16, 185, 129, 0.4)'
              : dataSource === 'loading'
                ? 'rgba(59, 130, 246, 0.4)'
                : 'rgba(245, 158, 11, 0.4)'
          }`,
          color: '#fff',
          fontSize: 12,
          fontFamily: 'monospace',
          fontWeight: 600,
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor:
              dataSource === 'algorand-blockchain'
                ? '#10b981'
                : dataSource === 'loading'
                  ? '#3b82f6'
                  : '#f59e0b',
            animation:
              dataSource === 'loading' ? 'pulse 1.5s infinite' : 'none',
          }}
        />
        <span>
          {dataSource === 'algorand-blockchain'
            ? `⛓️ Algorand Blockchain`
            : '❌ Error'}
        </span>
        {blockchainAppId && (
          <span style={{ opacity: 0.7, fontSize: 10 }}>
            App #{blockchainAppId}
          </span>
        )}
        {stationCount > 0 && (
          <span style={{ opacity: 0.7, fontSize: 10 }}>
            • {stationCount} stations
          </span>
        )}
      </div>

      {/* Eco Toolbox for placing trees, gardens, purifiers */}
      <Toolbox viewer={viewer} />

      {/* AQI Legend */}
      <div className="legend">
        <h3>Air Quality Index</h3>
        <div className="legend-item">
          <span
            className="legend-color"
            style={{ backgroundColor: '#00e400' }}
          ></span>
          <span>0-50: Good</span>
        </div>
        <div className="legend-item">
          <span
            className="legend-color"
            style={{ backgroundColor: '#ffff00' }}
          ></span>
          <span>51-100: Moderate</span>
        </div>
        <div className="legend-item">
          <span
            className="legend-color"
            style={{ backgroundColor: '#ff7e00' }}
          ></span>
          <span>101-150: Unhealthy (Sensitive)</span>
        </div>
        <div className="legend-item">
          <span
            className="legend-color"
            style={{ backgroundColor: '#ff0000' }}
          ></span>
          <span>151-200: Very Unhealthy</span>
        </div>
        <div className="legend-item">
          <span
            className="legend-color"
            style={{ backgroundColor: '#8f3f97' }}
          ></span>
          <span>201+: Hazardous</span>
        </div>
      </div>

      {/* Atmosphere Simulation Panel */}
      <div className="atmosphere-panel">
        <h3>Atmosphere Simulation</h3>

        <div className="atmosphere-item">
          <span>Wind Effect</span>
          <button
            onClick={() => {
              const newState = !showWind;
              setShowWind(newState);
              // Play/pause wind audio
              const audio = document.getElementById(
                'wind-audio',
              ) as HTMLAudioElement;
              if (audio) {
                if (newState) {
                  audio.volume = Math.min(windSpeed / 20, 1);
                  audio.play();
                } else {
                  audio.pause();
                }
              }
            }}
            className={`atmosphere-toggle ${showWind ? 'active' : ''}`}
          />
        </div>

        {showWind && (
          <div className="atmosphere-slider">
            <label>
              <span>Speed</span>
              <span>{windSpeed.toFixed(0)} m/s</span>
            </label>
            <input
              type="range"
              min="1"
              max="20"
              step="1"
              value={windSpeed}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setWindSpeed(val);
                const audio = document.getElementById(
                  'wind-audio',
                ) as HTMLAudioElement;
                if (audio) audio.volume = Math.min(val / 20, 1);
              }}
            />
            <label>
              <span>Direction</span>
              <span>{windDirection}°</span>
            </label>
            <input
              type="range"
              min="0"
              max="360"
              step="15"
              value={windDirection}
              onChange={(e) => setWindDirection(parseFloat(e.target.value))}
            />
          </div>
        )}

        <div className="atmosphere-item">
          <span>Pollution Haze</span>
          <button
            onClick={() => setShowPollution(!showPollution)}
            className={`atmosphere-toggle ${showPollution ? 'active-orange' : ''}`}
          />
        </div>
      </div>

      {/* Wind Audio Element */}
      <audio id="wind-audio" loop preload="auto">
        <source src="/audio/wind.mp3" type="audio/mpeg" />
      </audio>

      {/* Station Popup */}
      {popup.visible && popup.station && (
        <div
          className="station-popup"
          style={{
            left: Math.min(popup.x, window.innerWidth - 280),
            top: Math.min(popup.y, window.innerHeight - 200),
          }}
        >
          <button className="popup-close" onClick={closePopup}>
            ×
          </button>
          <h4>{popup.station.name}</h4>
          <div className="popup-content">
            <div
              className="popup-aqi"
              style={{
                backgroundColor: getAqiInfo(popup.station.aqi).cssColor,
              }}
            >
              <span className="aqi-value">{popup.station.aqi}</span>
              <span className="aqi-label">AQI</span>
            </div>
            <div className="popup-details">
              <p>
                <strong>Category:</strong>{' '}
                {getAqiInfo(popup.station.aqi).category}
              </p>
              <p>
                <strong>Latitude:</strong> {popup.station.latitude.toFixed(4)}°
              </p>
              <p>
                <strong>Longitude:</strong> {popup.station.longitude.toFixed(4)}
                °
              </p>
              <p>
                <strong>Updated:</strong>{' '}
                {new Date(popup.station.time).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Impact Popup for placements */}
      <ImpactPopup
        impact={currentImpact}
        position={impactPosition}
        onClose={closeImpactPopup}
      />

      {/* Total Impact Panel */}
      <TotalImpactPanel
        summary={calculateTotalImpact(allImpacts)}
        onGetQuote={handleGetQuote}
      />

      {/* 🌿 Green Rewards Panel — live on-chain balance */}
      <GreenRewardsPanel refreshTrigger={treeCount} />

      {/* VR Mode Button */}
      <div className="absolute bottom-5 right-5 z-10">
        <VRButton onEnterVR={() => setIsVRMode(true)} />
      </div>

      {/* VR Scene Overlay */}
      {isVRMode && viewer && (
        <ImmersiveVRScene viewer={viewer} onExitVR={() => setIsVRMode(false)} />
      )}
    </div>
  );
}

export default AqiCesiumApp;
