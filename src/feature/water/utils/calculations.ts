/**
 * Estimates roof area based on height and number of levels.
 */
export function estimateRoofArea(height: number, levels: number): number {
  const averageFloorHeight = height / (levels > 0 ? levels : 1);
  const footprintSide = averageFloorHeight * 5;
  return Math.pow(footprintSide, 2);
}

/**
 * Calculates a percentage potential based on roof geometry.
 */
export function calculateWaterHarvestingPotential(area: number, roofAngle: number = 0): number {
  const basePotential = 60;
  const areaEffect = Math.log(area + 1) * 1.5;
  const angleEffect = Math.max(0, 20 - roofAngle / 1.5);
  let totalPotential = basePotential + areaEffect + angleEffect;
  totalPotential = Math.min(totalPotential, 95);
  totalPotential = Math.max(totalPotential, 40);
  return Number(totalPotential.toFixed(2));
}

/**
 * Estimates daily water collection in Liters.
 */
export function calculateDailyLiters(
  potential: number, 
  area: number, 
  isRaining: boolean, 
  intensity: number
): number {
  const baseRainfall = 2.5;
  const rainMultiplier = isRaining ? 1 + intensity * 2.5 : 1;
  const averageDailyRainfall_mm = baseRainfall * rainMultiplier;

  const maxLiters = area * (averageDailyRainfall_mm / 1000) * 1000; // area (sqm) * rainfall (m) * 1000 L/m3
  const collectedLiters = maxLiters * (potential / 100);

  return Math.round(collectedLiters);
}

/**
 * Generates a dynamic canvas for the Cesium Billboard tooltip.
 */
export function createWaterPotentialIndicator(potential: number, liters: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const width = 400;
  const height = 550;
  
  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  
  ctx.scale(dpr, dpr);

  // Background
  ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
  
  // Custom roundRect implementation if not available
  if (ctx.roundRect) {
    ctx.roundRect(0, 0, width, height, 20);
  } else {
    // Basic fallback for older/limited environments
    ctx.rect(0, 0, width, height);
  }
  ctx.fill();

  const centerX = width / 2;
  const centerY = 180;
  const radius = 130;

  // Gauge Track
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, Math.PI, 2 * Math.PI);
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 25;
  ctx.lineCap = "round";
  ctx.stroke();

  // Gauge Progress
  ctx.beginPath();
  const maxPotential = 100;
  const progressAngle = (Math.min(potential, maxPotential) / maxPotential) * Math.PI;
  ctx.arc(centerX, centerY, radius, Math.PI, Math.PI + progressAngle);
  ctx.strokeStyle = "#3b82f6";
  ctx.stroke();

  // Center Content
  ctx.fillStyle = "#1e293b";
  ctx.font = "bold 60px Inter, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`${liters}`, centerX, centerY + 80);
  
  ctx.font = "bold 24px Inter, Arial, sans-serif";
  ctx.fillStyle = "#64748b";
  ctx.fillText("LITERS / DAY", centerX, centerY + 115);

  ctx.fillStyle = "#3b82f6";
  ctx.font = "bold 32px Inter, Arial, sans-serif";
  ctx.fillText(`${potential.toFixed(0)}% Efficiency`, centerX, centerY + 170);

  // Detailed Stats
  ctx.fillStyle = "#f1f5f9";
  if (ctx.roundRect) {
    ctx.roundRect(40, 380, width - 80, 130, 15);
  } else {
    ctx.rect(40, 380, width - 80, 130);
  }
  ctx.fill();

  ctx.fillStyle = "#475569";
  ctx.font = "18px Inter, Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("ESTIMATED COLLECTION", 60, 420);
  
  ctx.fillStyle = "#1e293b";
  ctx.font = "bold 22px Inter, Arial, sans-serif";
  ctx.fillText("Rainwater Harvesting Model", 60, 455);
  ctx.font = "16px Inter, Arial, sans-serif";
  ctx.fillText("Active Monitoring System v2.1", 60, 485);

  return canvas;
}
