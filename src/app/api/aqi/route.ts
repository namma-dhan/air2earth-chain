import { type NextRequest, NextResponse } from "next/server";

const OPENWEATHER_API_KEY =
	process.env.OPENWEATHER_API_KEY || "5ce1a56ac2ad0a8e49b5b8f4a48f7580";

// In-memory cache: { lat, lon, time, data }[]
const CACHE: { lat: number; lon: number; time: number; data: any }[] = [];
const CACHE_RADIUS_KM = 10;
const CACHE_TIME_WINDOW_SEC = 1800; // +/- 30 minutes

function getDistanceFromLatLonInKm(
	lat1: number,
	lon1: number,
	lat2: number,
	lon2: number,
): number {
	const R = 6371;
	const dLat = deg2rad(lat2 - lat1);
	const dLon = deg2rad(lon2 - lon1);
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(deg2rad(lat1)) *
			Math.cos(deg2rad(lat2)) *
			Math.sin(dLon / 2) *
			Math.sin(dLon / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
}

function deg2rad(deg: number): number {
	return deg * (Math.PI / 180);
}

function findInCache(lat: number, lon: number, time: number) {
	for (const entry of CACHE) {
		const dist = getDistanceFromLatLonInKm(lat, lon, entry.lat, entry.lon);
		const timeDiff = Math.abs(entry.time - time);
		if (dist <= CACHE_RADIUS_KM && timeDiff <= CACHE_TIME_WINDOW_SEC) {
			return entry.data;
		}
	}
	return null;
}

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const lat = searchParams.get("lat");
	const lon = searchParams.get("lon");
	const time = searchParams.get("time");

	if (!lat || !lon) {
		return NextResponse.json(
			{ error: "Missing lat/lon parameters" },
			{ status: 400 },
		);
	}

	if (!OPENWEATHER_API_KEY) {
		return NextResponse.json(
			{ error: "Server missing OPENWEATHER_API_KEY" },
			{ status: 500 },
		);
	}

	const targetTime = time ? parseInt(time) : Math.floor(Date.now() / 1000);

	// Check cache first
	const cachedData = findInCache(parseFloat(lat), parseFloat(lon), targetTime);
	if (cachedData) {
		console.log(`[CACHE HIT] Lat:${lat} Lon:${lon} Time:${targetTime}`);
		return NextResponse.json(cachedData);
	}

	const now = Math.floor(Date.now() / 1000);
	const ONE_HOUR = 3600;
	const FIVE_DAYS = 5 * 24 * 3600;

	let url = "";
	let mode = "current";

	if (Math.abs(targetTime - now) < ONE_HOUR) {
		mode = "current";
		url = `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`;
	} else if (targetTime > now && targetTime < now + FIVE_DAYS) {
		mode = "forecast";
		url = `http://api.openweathermap.org/data/2.5/air_pollution/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`;
	} else {
		mode = "history";
		const start = targetTime - ONE_HOUR;
		const end = targetTime + ONE_HOUR;
		url = `http://api.openweathermap.org/data/2.5/air_pollution/history?lat=${lat}&lon=${lon}&start=${start}&end=${end}&appid=${OPENWEATHER_API_KEY}`;
	}

	console.log(
		`[${mode.toUpperCase()}] Requesting AQI for time ${new Date(targetTime * 1000).toISOString()}`,
	);

	try {
		const response = await fetch(url);
		if (!response.ok) {
			const text = await response.text();
			throw new Error(`OpenWeather API Error: ${response.status} - ${text}`);
		}

		const data = await response.json();

		if (mode === "forecast" || mode === "history") {
			if (data.list && data.list.length > 0) {
				const closest = data.list.reduce((prev: any, curr: any) =>
					Math.abs(curr.dt - targetTime) < Math.abs(prev.dt - targetTime)
						? curr
						: prev,
				);

				const result = {
					coord: data.coord,
					list: [closest],
					mode: mode,
				};

				CACHE.push({
					lat: parseFloat(lat),
					lon: parseFloat(lon),
					time: targetTime,
					data: result,
				});
				if (CACHE.length > 500) CACHE.shift();

				return NextResponse.json(result);
			} else {
				return NextResponse.json({
					list: [],
					mode: mode,
					message: "No data found for this time range",
				});
			}
		} else {
			const result = { ...data, mode: mode };
			CACHE.push({
				lat: parseFloat(lat),
				lon: parseFloat(lon),
				time: targetTime,
				data: result,
			});
			if (CACHE.length > 500) CACHE.shift();

			return NextResponse.json(result);
		}
	} catch (error: any) {
		console.error("Proxy Error:", error);
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}
