'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { LocationData } from '@/lib/google-sheets';

// Dynamically import Leaflet to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);
const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false }
);

interface MapProps {
  locations: LocationData[];
}

// Routing component that fetches real road routes and displays them
function RoutingControl({ waypoints }: { waypoints: [number, number][] }) {
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (waypoints.length < 2) {
      setRouteCoordinates([]);
      return;
    }

    setLoading(true);

    // Dynamically import the routing function to avoid SSR issues
    import('@/lib/routing').then(({ getRouteForWaypoints }) => {
      console.log('Fetching road route for waypoints:', waypoints.length, 'points');
      getRouteForWaypoints(waypoints)
        .then(roadRoute => {
          console.log('Road route received:', roadRoute.length, 'coordinate points');
          setRouteCoordinates(roadRoute);
        })
        .catch(error => {
          console.warn('Failed to get road route, falling back to straight lines:', error);
          setRouteCoordinates(waypoints);
        })
        .finally(() => {
          setLoading(false);
        });
    }).catch(error => {
      console.warn('Failed to load routing module:', error);
      setRouteCoordinates(waypoints);
      setLoading(false);
    });
  }, [waypoints]);

  if (loading || routeCoordinates.length < 2) return null;

  return (
    <Polyline
      positions={routeCoordinates}
      color="#3b82f6"
      weight={4}
      opacity={0.7}
    />
  );
}

export function Map({ locations }: MapProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Fix Leaflet default marker icons
    if (typeof window !== 'undefined') {
      const L = require('leaflet');
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });
    }
  }, []);

  if (!isClient) {
    return (
      <div className="w-full h-[500px] bg-gray-200 rounded-lg flex items-center justify-center">
        <p>Loading map...</p>
      </div>
    );
  }

  // Sort locations by timestamp to get the most recent location for centering
  const locationsByRecent = [...locations].sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Center on the most recent location
  const center: [number, number] = locationsByRecent.length > 0
    ? [locationsByRecent[0].latitude, locationsByRecent[0].longitude]
    : [40.7128, -74.0060]; // Default to NYC

  // Sort locations by timestamp for route tracing (chronological order)
  const sortedLocations = [...locations].sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Create route path coordinates
  const routePath = sortedLocations.map(location => [
    location.latitude,
    location.longitude
  ] as [number, number]);

  return (
    <div className="w-full h-[500px] rounded-lg overflow-hidden">
      <MapContainer
        center={center}
        zoom={10}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Road-following route connecting points in chronological order */}
        {routePath.length > 1 && (
          <RoutingControl waypoints={routePath} />
        )}
        
        {sortedLocations.map((location, index) => (
          <Marker
            key={location.id}
            position={[location.latitude, location.longitude]}
          >
            <Popup>
              <div className="space-y-2">
                <p><strong>Stop #{index + 1}</strong></p>
                <p><strong>Time:</strong> {new Date(location.timestamp).toLocaleString()}</p>
                {location.address && <p><strong>Address:</strong> {location.address}</p>}
                {location.notes && <p><strong>Notes:</strong> {location.notes}</p>}
                <p><strong>Coordinates:</strong> {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}