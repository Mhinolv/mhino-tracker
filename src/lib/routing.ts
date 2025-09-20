interface RoutePoint {
  lat: number;
  lng: number;
}

interface RouteResponse {
  routes: Array<{
    geometry: string;
  }>;
}

const ORS_API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjY0NDhhNGIzYjBlMjRmMThiNGE1NmQyYTU2M2ZjMDZhIiwiaCI6Im11cm11cjY0In0=';
const ORS_BASE_URL = 'https://api.openrouteservice.org/v2/directions/driving-car';

// Persistent cache using localStorage
const CACHE_KEY = 'mhino_tracker_routes';
const CACHE_VERSION = '1.0';

interface CacheData {
  version: string;
  routes: { [key: string]: [number, number][] };
  lastUpdated: number;
}

class RouteCache {
  private cache: Map<string, [number, number][]>;

  constructor() {
    this.cache = new Map();
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(CACHE_KEY);
      if (stored) {
        const data: CacheData = JSON.parse(stored);

        // Check cache version and age (expire after 7 days)
        const now = Date.now();
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

        if (data.version === CACHE_VERSION && (now - data.lastUpdated) < maxAge) {
          Object.entries(data.routes).forEach(([key, value]) => {
            this.cache.set(key, value);
          });
          console.log('Loaded', this.cache.size, 'cached routes from localStorage');
        } else {
          console.log('Cache expired or version mismatch, clearing');
          localStorage.removeItem(CACHE_KEY);
        }
      }
    } catch (error) {
      console.warn('Failed to load route cache from localStorage:', error);
      localStorage.removeItem(CACHE_KEY);
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;

    try {
      const data: CacheData = {
        version: CACHE_VERSION,
        routes: Object.fromEntries(this.cache),
        lastUpdated: Date.now()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      console.log('Saved', this.cache.size, 'routes to localStorage cache');
    } catch (error) {
      console.warn('Failed to save route cache to localStorage:', error);
    }
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  get(key: string): [number, number][] | undefined {
    return this.cache.get(key);
  }

  set(key: string, value: [number, number][]): void {
    this.cache.set(key, value);
    this.saveToStorage();
  }

  clear(): void {
    this.cache.clear();
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CACHE_KEY);
    }
  }
}

const routeCache = new RouteCache();

// Decode polyline geometry (Google's polyline algorithm)
function decodePolyline(encoded: string): [number, number][] {
  const coordinates: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let result = 1;
    let shift = 0;
    let b;

    do {
      b = encoded.charCodeAt(index++) - 63 - 1;
      result += b << shift;
      shift += 5;
    } while (b >= 0x1f);

    lat += (result & 1) !== 0 ? ~(result >> 1) : (result >> 1);

    result = 1;
    shift = 0;

    do {
      b = encoded.charCodeAt(index++) - 63 - 1;
      result += b << shift;
      shift += 5;
    } while (b >= 0x1f);

    lng += (result & 1) !== 0 ? ~(result >> 1) : (result >> 1);

    coordinates.push([lat / 1e5, lng / 1e5]);
  }

  return coordinates;
}

function getCacheKey(start: RoutePoint, end: RoutePoint): string {
  return `${start.lat.toFixed(6)},${start.lng.toFixed(6)}-${end.lat.toFixed(6)},${end.lng.toFixed(6)}`;
}

export async function getRoute(start: RoutePoint, end: RoutePoint): Promise<[number, number][]> {
  const cacheKey = getCacheKey(start, end);

  // Check cache first
  if (routeCache.has(cacheKey)) {
    console.log('Using cached route for:', cacheKey);
    return routeCache.get(cacheKey)!;
  }

  console.log('Fetching route from ORS API for:', start, 'to', end);

  try {
    const requestBody = {
      coordinates: [
        [start.lng, start.lat],
        [end.lng, end.lat]
      ]
    };

    console.log('ORS API request:', requestBody);

    const response = await fetch(`${ORS_BASE_URL}?api_key=${ORS_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    console.log('ORS API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ORS API error response:', errorText);
      throw new Error(`ORS API error: ${response.status}`);
    }

    const data: RouteResponse = await response.json();
    console.log('ORS API response data:', data);

    if (!data.routes || data.routes.length === 0) {
      throw new Error('No route found');
    }

    // Decode the polyline geometry string
    const geometry = data.routes[0].geometry;
    console.log('Encoded geometry:', geometry);
    const coordinates = decodePolyline(geometry);
    console.log('Decoded coordinates count:', coordinates.length);

    // Cache the result
    routeCache.set(cacheKey, coordinates);

    return coordinates;
  } catch (error) {
    console.warn('Failed to get route from ORS:', error);
    // Fallback to direct line
    return [[start.lat, start.lng], [end.lat, end.lng]];
  }
}

// Store the last known waypoints to detect changes
let lastWaypoints: [number, number][] = [];
let lastRoutePoints: [number, number][] = [];

export async function getRouteForWaypoints(waypoints: [number, number][]): Promise<[number, number][]> {
  if (waypoints.length < 2) {
    return waypoints;
  }

  // Check if waypoints have changed
  const waypointsChanged = !arraysEqual(waypoints, lastWaypoints);

  if (!waypointsChanged && lastRoutePoints.length > 0) {
    console.log('Using cached complete route - no new locations detected');
    return lastRoutePoints;
  }

  // Determine which segments are new
  const existingSegments = findExistingSegments(lastWaypoints, waypoints);
  const newSegments = findNewSegments(lastWaypoints, waypoints);

  console.log(`Route update: ${existingSegments.length} cached segments, ${newSegments.length} new segments to fetch`);

  const allRoutePoints: [number, number][] = [];

  // Process all segments in order
  for (let i = 0; i < waypoints.length - 1; i++) {
    const start = { lat: waypoints[i][0], lng: waypoints[i][1] };
    const end = { lat: waypoints[i + 1][0], lng: waypoints[i + 1][1] };
    const segmentKey = getCacheKey(start, end);

    try {
      const routeSegment = await getRoute(start, end);

      // Add all points except the last one (to avoid duplicates)
      if (i === 0) {
        allRoutePoints.push(...routeSegment);
      } else {
        allRoutePoints.push(...routeSegment.slice(1));
      }
    } catch (error) {
      console.warn(`Failed to get route segment ${i}:`, error);
      // Fallback to direct connection
      if (i === 0) {
        allRoutePoints.push(waypoints[i]);
      }
      allRoutePoints.push(waypoints[i + 1]);
    }
  }

  // Update cache
  lastWaypoints = [...waypoints];
  lastRoutePoints = [...allRoutePoints];

  return allRoutePoints;
}

// Helper functions
function arraysEqual(a: [number, number][], b: [number, number][]): boolean {
  if (a.length !== b.length) return false;
  return a.every((point, index) =>
    Math.abs(point[0] - b[index][0]) < 0.000001 &&
    Math.abs(point[1] - b[index][1]) < 0.000001
  );
}

function findExistingSegments(oldWaypoints: [number, number][], newWaypoints: [number, number][]): string[] {
  const existing: string[] = [];

  for (let i = 0; i < oldWaypoints.length - 1; i++) {
    const start = { lat: oldWaypoints[i][0], lng: oldWaypoints[i][1] };
    const end = { lat: oldWaypoints[i + 1][0], lng: oldWaypoints[i + 1][1] };
    const key = getCacheKey(start, end);

    // Check if this segment still exists in new waypoints
    for (let j = 0; j < newWaypoints.length - 1; j++) {
      const newStart = { lat: newWaypoints[j][0], lng: newWaypoints[j][1] };
      const newEnd = { lat: newWaypoints[j + 1][0], lng: newWaypoints[j + 1][1] };
      const newKey = getCacheKey(newStart, newEnd);

      if (key === newKey) {
        existing.push(key);
        break;
      }
    }
  }

  return existing;
}

function findNewSegments(oldWaypoints: [number, number][], newWaypoints: [number, number][]): string[] {
  const newSegments: string[] = [];

  for (let i = 0; i < newWaypoints.length - 1; i++) {
    const start = { lat: newWaypoints[i][0], lng: newWaypoints[i][1] };
    const end = { lat: newWaypoints[i + 1][0], lng: newWaypoints[i + 1][1] };
    const key = getCacheKey(start, end);

    // Check if this segment existed in old waypoints
    let isNew = true;
    for (let j = 0; j < oldWaypoints.length - 1; j++) {
      const oldStart = { lat: oldWaypoints[j][0], lng: oldWaypoints[j][1] };
      const oldEnd = { lat: oldWaypoints[j + 1][0], lng: oldWaypoints[j + 1][1] };
      const oldKey = getCacheKey(oldStart, oldEnd);

      if (key === oldKey) {
        isNew = false;
        break;
      }
    }

    if (isNew) {
      newSegments.push(key);
    }
  }

  return newSegments;
}