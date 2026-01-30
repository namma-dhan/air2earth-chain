import { useEffect, useRef, useState } from 'react';
import 'normalize.css';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import * as Cesium from 'cesium';
import './AqiCesium.css';
import { Toolbox } from './components/shared/Toolbox';

const ACCESS_TOKEN = import.meta.env.VITE_CESIUM_ACCESS_TOKEN;
Cesium.Ion.defaultAccessToken = ACCESS_TOKEN;

// Station data from API - South India
const apiResponse = {
  "status": "ok",
  "data": [
    // Chennai stations
    { "lat": 13.1036, "lon": 80.2909, "uid": 13737, "aqi": "158", "station": { "name": "Royapuram, Chennai", "time": "2026-01-29T13:30:00+09:00" } },
    { "lat": 12.9533, "lon": 80.2357, "uid": 13738, "aqi": "154", "station": { "name": "Perungudi, Chennai", "time": "2026-01-29T15:30:00+09:00" } },
    { "lat": 13.4127, "lon": 80.1081, "uid": 13807, "aqi": "170", "station": { "name": "Anthoni Pillai Nagar, Gummidipoondi", "time": "2026-01-29T15:30:00+09:00" } },
    { "lat": 13.164544, "lon": 80.26285, "uid": 8185, "aqi": "173", "station": { "name": "Manali, Chennai", "time": "2026-01-29T15:30:00+09:00" } },
    { "lat": 13.0052189, "lon": 80.2398125, "uid": 11279, "aqi": "159", "station": { "name": "Velachery Res. Area, Chennai", "time": "2026-01-29T15:30:00+09:00" } },
    { "lat": 13.0664, "lon": 80.2112, "uid": 13740, "aqi": "154", "station": { "name": "Arumbakkam, Chennai", "time": "2026-01-29T15:30:00+09:00" } },
    { "lat": 13.1278, "lon": 80.2642, "uid": 13739, "aqi": "157", "station": { "name": "Kodungaiyur, Chennai", "time": "2026-01-29T15:30:00+09:00" } },
    { "lat": 13.0827, "lon": 80.2707, "uid": 13741, "aqi": "145", "station": { "name": "Anna Nagar, Chennai", "time": "2026-01-29T15:30:00+09:00" } },
    { "lat": 13.0569, "lon": 80.2425, "uid": 13742, "aqi": "162", "station": { "name": "T. Nagar, Chennai", "time": "2026-01-29T15:30:00+09:00" } },

    // Coimbatore stations
    { "lat": 11.0168, "lon": 76.9558, "uid": 14001, "aqi": "78", "station": { "name": "SIDCO, Coimbatore", "time": "2026-01-29T15:30:00+09:00" } },
    { "lat": 10.9925, "lon": 76.9614, "uid": 14002, "aqi": "65", "station": { "name": "RS Puram, Coimbatore", "time": "2026-01-29T15:30:00+09:00" } },
    { "lat": 11.0246, "lon": 77.0028, "uid": 14003, "aqi": "72", "station": { "name": "Gandhipuram, Coimbatore", "time": "2026-01-29T15:30:00+09:00" } },

    // Madurai stations
    { "lat": 9.9252, "lon": 78.1198, "uid": 14101, "aqi": "89", "station": { "name": "Meenakshi Temple Area, Madurai", "time": "2026-01-29T15:30:00+09:00" } },
    { "lat": 9.9399, "lon": 78.1213, "uid": 14102, "aqi": "95", "station": { "name": "Periyar Bus Stand, Madurai", "time": "2026-01-29T15:30:00+09:00" } },

    // Trichy stations
    { "lat": 10.7905, "lon": 78.7047, "uid": 14201, "aqi": "68", "station": { "name": "Srirangam, Trichy", "time": "2026-01-29T15:30:00+09:00" } },
    { "lat": 10.8155, "lon": 78.6965, "uid": 14202, "aqi": "74", "station": { "name": "Central Bus Stand, Trichy", "time": "2026-01-29T15:30:00+09:00" } },

    // Salem station
    { "lat": 11.6643, "lon": 78.1460, "uid": 14301, "aqi": "82", "station": { "name": "Steel Plant Area, Salem", "time": "2026-01-29T15:30:00+09:00" } },

    // Tirunelveli station
    { "lat": 8.7139, "lon": 77.7567, "uid": 14401, "aqi": "45", "station": { "name": "Palayamkottai, Tirunelveli", "time": "2026-01-29T15:30:00+09:00" } },

    // Vellore station
    { "lat": 12.9165, "lon": 79.1325, "uid": 14501, "aqi": "98", "station": { "name": "CMC Area, Vellore", "time": "2026-01-29T15:30:00+09:00" } },

    // Pondicherry stations
    { "lat": 11.9416, "lon": 79.8083, "uid": 14601, "aqi": "52", "station": { "name": "White Town, Puducherry", "time": "2026-01-29T15:30:00+09:00" } },
    { "lat": 11.9139, "lon": 79.8145, "uid": 14602, "aqi": "58", "station": { "name": "Lawspet, Puducherry", "time": "2026-01-29T15:30:00+09:00" } },

    // Bangalore stations (Karnataka)
    { "lat": 12.9716, "lon": 77.5946, "uid": 15001, "aqi": "112", "station": { "name": "MG Road, Bengaluru", "time": "2026-01-29T15:30:00+09:00" } },
    { "lat": 12.9352, "lon": 77.6245, "uid": 15002, "aqi": "125", "station": { "name": "BTM Layout, Bengaluru", "time": "2026-01-29T15:30:00+09:00" } },
    { "lat": 13.0358, "lon": 77.5970, "uid": 15003, "aqi": "118", "station": { "name": "Hebbal, Bengaluru", "time": "2026-01-29T15:30:00+09:00" } },
    { "lat": 12.9141, "lon": 77.6411, "uid": 15004, "aqi": "135", "station": { "name": "Silk Board, Bengaluru", "time": "2026-01-29T15:30:00+09:00" } },
    { "lat": 12.9783, "lon": 77.6408, "uid": 15005, "aqi": "108", "station": { "name": "Indiranagar, Bengaluru", "time": "2026-01-29T15:30:00+09:00" } },

    // Mysore station
    { "lat": 12.2958, "lon": 76.6394, "uid": 15101, "aqi": "55", "station": { "name": "Palace Area, Mysuru", "time": "2026-01-29T15:30:00+09:00" } },

    // Hyderabad stations (Telangana)
    { "lat": 17.3850, "lon": 78.4867, "uid": 16001, "aqi": "142", "station": { "name": "Charminar, Hyderabad", "time": "2026-01-29T15:30:00+09:00" } },
    { "lat": 17.4400, "lon": 78.3489, "uid": 16002, "aqi": "128", "station": { "name": "HITEC City, Hyderabad", "time": "2026-01-29T15:30:00+09:00" } },
    { "lat": 17.4239, "lon": 78.4738, "uid": 16003, "aqi": "138", "station": { "name": "Secunderabad, Hyderabad", "time": "2026-01-29T15:30:00+09:00" } },
    { "lat": 17.4156, "lon": 78.4347, "uid": 16004, "aqi": "145", "station": { "name": "Kukatpally, Hyderabad", "time": "2026-01-29T15:30:00+09:00" } },

    // Kochi stations (Kerala)
    { "lat": 9.9312, "lon": 76.2673, "uid": 17001, "aqi": "42", "station": { "name": "Fort Kochi", "time": "2026-01-29T15:30:00+09:00" } },
    { "lat": 9.9816, "lon": 76.2999, "uid": 17002, "aqi": "48", "station": { "name": "Ernakulam South, Kochi", "time": "2026-01-29T15:30:00+09:00" } },

    // Thiruvananthapuram stations
    { "lat": 8.5241, "lon": 76.9366, "uid": 17101, "aqi": "38", "station": { "name": "Technopark, Thiruvananthapuram", "time": "2026-01-29T15:30:00+09:00" } },
    { "lat": 8.4875, "lon": 76.9525, "uid": 17102, "aqi": "35", "station": { "name": "Kovalam, Thiruvananthapuram", "time": "2026-01-29T15:30:00+09:00" } },

    // Visakhapatnam stations (Andhra Pradesh)
    { "lat": 17.6868, "lon": 83.2185, "uid": 18001, "aqi": "95", "station": { "name": "Beach Road, Visakhapatnam", "time": "2026-01-29T15:30:00+09:00" } },
    { "lat": 17.7231, "lon": 83.3013, "uid": 18002, "aqi": "115", "station": { "name": "Steel Plant, Visakhapatnam", "time": "2026-01-29T15:30:00+09:00" } },

    // Vijayawada station
    { "lat": 16.5062, "lon": 80.6480, "uid": 18101, "aqi": "88", "station": { "name": "Benz Circle, Vijayawada", "time": "2026-01-29T15:30:00+09:00" } },

    // Tirupati station
    { "lat": 13.6288, "lon": 79.4192, "uid": 18201, "aqi": "62", "station": { "name": "Temple Area, Tirupati", "time": "2026-01-29T15:30:00+09:00" } },
  ]
};

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

const aqiData: StationData[] = apiResponse.data
  .filter((station) => station.aqi !== "-")
  .map((station) => ({
    name: station.station.name,
    latitude: station.lat,
    longitude: station.lon,
    aqi: parseInt(station.aqi),
    time: station.station.time,
    uid: station.uid,
    position: Cesium.Cartesian3.fromDegrees(station.lon, station.lat),
  }));

// Compute bounds from station coordinates with padding
const computeBounds = () => {
  const lons = aqiData.map(s => s.longitude);
  const lats = aqiData.map(s => s.latitude);
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
  if (aqi <= 50) return [0, 228, 0];       // Good - Green
  if (aqi <= 100) return [255, 255, 0];    // Moderate - Yellow
  if (aqi <= 150) return [255, 126, 0];    // Unhealthy for Sensitive - Orange
  if (aqi <= 200) return [255, 0, 0];      // Very Unhealthy - Red
  return [143, 63, 151];                    // Hazardous - Purple
}

// Create heatmap on canvas
function createHeatmapCanvas(
  width: number,
  height: number,
  data: { x: number; y: number; value: number }[],
  maxValue: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Clear canvas with transparency
  ctx.clearRect(0, 0, width, height);

  // Draw each data point as a radial gradient
  const radius = 180; // Larger radius for smoother blending

  data.forEach(point => {
    const [r, g, b] = getAqiRGB(point.value);
    const intensity = Math.min(point.value / maxValue, 1);

    // Create radial gradient for smooth blending
    const gradient = ctx.createRadialGradient(
      point.x, point.y, 0,
      point.x, point.y, radius
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
function getAqiInfo(aqi: number): { category: string; color: string; cssColor: string } {
  if (aqi <= 50) return { category: "Good", color: "green", cssColor: "#00e400" };
  if (aqi <= 100) return { category: "Moderate", color: "yellow", cssColor: "#ffff00" };
  if (aqi <= 150) return { category: "Unhealthy for Sensitive", color: "orange", cssColor: "#ff7e00" };
  if (aqi <= 200) return { category: "Very Unhealthy", color: "red", cssColor: "#ff0000" };
  return { category: "Hazardous", color: "purple", cssColor: "#8f3f97" };
}

function getCesiumColor(aqi: number): Cesium.Color {
  if (aqi <= 50) return Cesium.Color.fromCssColorString("#00e400");
  if (aqi <= 100) return Cesium.Color.fromCssColorString("#ffff00");
  if (aqi <= 150) return Cesium.Color.fromCssColorString("#ff7e00");
  if (aqi <= 200) return Cesium.Color.fromCssColorString("#ff0000");
  return Cesium.Color.fromCssColorString("#8f3f97");
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

  const [popup, setPopup] = useState<PopupInfo>({ visible: false, x: 0, y: 0, station: null });
  const [viewer, setViewer] = useState<Cesium.Viewer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

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
        const buildingConditions: [string, string][] = aqiData.map(station => {
          const latMin = station.latitude - 0.1;
          const latMax = station.latitude + 0.1;
          const lonMin = station.longitude - 0.1;
          const lonMax = station.longitude + 0.1;
          const condition = `\${feature['cesium#latitude']} > ${latMin} && \${feature['cesium#latitude']} < ${latMax} && \${feature['cesium#longitude']} > ${lonMin} && \${feature['cesium#longitude']} < ${lonMax}`;
          return [condition, getAqiColorCondition(station.aqi)];
        });

        // Add default condition
        buildingConditions.push(["true", "color('rgba(200, 200, 200, 0.6)')"]);

        // Style buildings with AQI colors based on their location
        osmBuildingsTileset.style = new Cesium.Cesium3DTileStyle({
          color: {
            conditions: buildingConditions
          }
        });

        console.log('3D OSM Buildings loaded with AQI styling');
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

          const buildingConditions: [string, string][] = aqiData.map(station => {
            const latMin = station.latitude - 0.1;
            const latMax = station.latitude + 0.1;
            const lonMin = station.longitude - 0.1;
            const lonMax = station.longitude + 0.1;
            const condition = `\${feature['cesium#latitude']} > ${latMin} && \${feature['cesium#latitude']} < ${latMax} && \${feature['cesium#longitude']} > ${lonMin} && \${feature['cesium#longitude']} < ${lonMax}`;
            return [condition, getAqiColorCondition(station.aqi)];
          });
          buildingConditions.push(["true", "color('rgba(200, 200, 200, 0.6)')"]);

          osmBuildingsTileset.style = new Cesium.Cesium3DTileStyle({
            color: {
              conditions: buildingConditions
            }
          });
        } else {
          // Original building colors when zoomed in close
          osmBuildingsTileset.style = new Cesium.Cesium3DTileStyle({
            color: "color('white')"
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
      const heatmapData = aqiData.map(station => {
        const x = Math.round(((station.longitude - bounds.west) / lonRange) * heatmapWidth);
        const y = Math.round(((bounds.north - station.latitude) / latRange) * heatmapHeight);
        console.log(`Station ${station.name}: pixel (${x}, ${y}), AQI: ${station.aqi}`);
        return { x, y, value: station.aqi };
      });

      // Create heatmap canvas
      const heatmapCanvas = createHeatmapCanvas(heatmapWidth, heatmapHeight, heatmapData, 200);
      const imageUrl = heatmapCanvas.toDataURL('image/png');
      console.log('Heatmap image created, URL length:', imageUrl.length);

      // Add heatmap as a ground overlay using SingleTileImageryProvider
      let heatmapLayer: Cesium.ImageryLayer | null = null;
      try {
        const heatmapProvider = await Cesium.SingleTileImageryProvider.fromUrl(imageUrl, {
          rectangle: Cesium.Rectangle.fromDegrees(
            bounds.west,
            bounds.south,
            bounds.east,
            bounds.north
          ),
        });

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
        const cameraHeight = viewer.camera.positionCartographic.height;

        // Define height thresholds for heatmap visibility
        const fadeStartHeight = 15000; // Start fading at 15km
        const fadeEndHeight = 3000;    // Fully hidden at 3km
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
            const fadeRatio = (cameraHeight - fadeEndHeight) / (fadeStartHeight - fadeEndHeight);
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
          position: Cesium.Cartesian3.fromDegrees(station.longitude, station.latitude, 100),
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
            translucencyByDistance: new Cesium.NearFarScalar(5000, 1.0, 300000, 0.0),
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

      handler.setInputAction((click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
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
            const stationData = pickedObject.id.properties.stationData?.getValue(Cesium.JulianDate.now());

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
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

      // Close popup on right-click or camera move
      handler.setInputAction(() => {
        setPopup({ visible: false, x: 0, y: 0, station: null });
      }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

      viewer.camera.moveEnd.addEventListener(() => {
        setPopup(prev => prev.visible ? { ...prev, visible: false } : prev);
      });

      // Fly camera to fit all stations
      viewer.camera.flyTo({
        destination: Cesium.Rectangle.fromDegrees(
          bounds.west,
          bounds.south,
          bounds.east,
          bounds.north
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
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, []);

  const closePopup = () => {
    setPopup({ visible: false, x: 0, y: 0, station: null });
  };

  return (
    <div className="app-container">
      <div ref={containerRef} className="cesiumContainer" />

      {/* Eco Toolbox for placing trees, gardens, purifiers */}
      <Toolbox viewer={viewer} />

      {/* AQI Legend */}
      <div className="legend">
        <h3>Air Quality Index</h3>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#00e400' }}></span>
          <span>0-50: Good</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#ffff00' }}></span>
          <span>51-100: Moderate</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#ff7e00' }}></span>
          <span>101-150: Unhealthy (Sensitive)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#ff0000' }}></span>
          <span>151-200: Very Unhealthy</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#8f3f97' }}></span>
          <span>201+: Hazardous</span>
        </div>
      </div>

      {/* Station Popup */}
      {popup.visible && popup.station && (
        <div
          className="station-popup"
          style={{
            left: Math.min(popup.x, window.innerWidth - 280),
            top: Math.min(popup.y, window.innerHeight - 200)
          }}
        >
          <button className="popup-close" onClick={closePopup}>×</button>
          <h4>{popup.station.name}</h4>
          <div className="popup-content">
            <div className="popup-aqi" style={{ backgroundColor: getAqiInfo(popup.station.aqi).cssColor }}>
              <span className="aqi-value">{popup.station.aqi}</span>
              <span className="aqi-label">AQI</span>
            </div>
            <div className="popup-details">
              <p><strong>Category:</strong> {getAqiInfo(popup.station.aqi).category}</p>
              <p><strong>Latitude:</strong> {popup.station.latitude.toFixed(4)}°</p>
              <p><strong>Longitude:</strong> {popup.station.longitude.toFixed(4)}°</p>
              <p><strong>Updated:</strong> {new Date(popup.station.time).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AqiCesiumApp;