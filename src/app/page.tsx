'use client';

import { useEffect, useState } from 'react';
import { Map } from '@/components/map';
import { LocationList } from '@/components/location-list';
import { LocationData } from '@/lib/google-sheets';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export default function Home() {
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/locations');
      if (!response.ok) {
        throw new Error('Failed to fetch locations');
      }
      const data = await response.json();
      setLocations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  return (
    <div className="container mx-auto p-4 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">MhinoTracker</h1>
        </div>
        <Button onClick={fetchLocations} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </header>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-destructive">Error: {error}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Make sure you&apos;ve configured your Google Sheets API key and Sheet ID in the .env.local file.
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Map View</h2>
            <Map locations={locations} />
          </div>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">History</h2>
            <LocationList locations={locations} />
          </div>
        </div>
      )}
    </div>
  );
}
