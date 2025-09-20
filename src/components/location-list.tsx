'use client';

import { LocationData } from '@/lib/google-sheets';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface LocationListProps {
  locations: LocationData[];
}

export function LocationList({ locations }: LocationListProps) {
  if (locations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Location History</CardTitle>
          <CardDescription>No locations found</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Location History</CardTitle>
        <CardDescription>
          {locations.length} location{locations.length !== 1 ? 's' : ''} recorded
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-[500px] overflow-y-auto">
          {locations.map((location) => (
            <div
              key={location.id}
              className="border rounded-lg p-4 space-y-2"
            >
              <div className="flex justify-between items-start">
                <h3 className="font-medium">
                  {location.address || 'Unknown Address'}
                </h3>
                <span className="text-sm text-muted-foreground">
                  {new Date(location.timestamp).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {new Date(location.timestamp).toLocaleTimeString()}
              </p>
              <p className="text-xs font-mono">
                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </p>
              {location.notes && (
                <p className="text-sm text-muted-foreground italic">
                  {location.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}