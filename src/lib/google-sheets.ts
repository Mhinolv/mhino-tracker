import { google } from 'googleapis';
import { readFileSync } from 'fs';
import { join } from 'path';

export interface LocationData {
  id: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  address?: string;
  notes?: string;
}

export async function getLocationHistory(): Promise<LocationData[]> {
  try {
    // Setup authentication using service account
    const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    const serviceAccountFile = process.env.GOOGLE_SERVICE_ACCOUNT_FILE;
    let auth;

    if (serviceAccountJson) {
      // Use service account JSON from environment variable (for production)
      const credentials = JSON.parse(serviceAccountJson);
      auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });
    } else if (serviceAccountFile) {
      // Use service account file (for local development)
      const credentials = JSON.parse(
        readFileSync(join(process.cwd(), serviceAccountFile), 'utf8')
      );
      auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });
    } else if (process.env.GOOGLE_SHEETS_API_KEY) {
      // Fallback to API key authentication
      auth = process.env.GOOGLE_SHEETS_API_KEY;
    } else {
      throw new Error('No Google authentication configured. Please set GOOGLE_SERVICE_ACCOUNT_JSON, GOOGLE_SERVICE_ACCOUNT_FILE, or GOOGLE_SHEETS_API_KEY');
    }

    const sheets = google.sheets({
      version: 'v4',
      auth,
    });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'A:F', // Try without sheet name first
    });

    const rows = response.data.values;
    if (!rows || rows.length <= 1) {
      return [];
    }

    // Skip header row and convert to LocationData
    // Columns: timestamp | device | latitude | longitude | city | state
    return rows.slice(1).map((row, index) => ({
      id: (index + 1).toString(),
      timestamp: row[0] || '',
      latitude: parseFloat(row[2]) || 0,
      longitude: parseFloat(row[3]) || 0,
      address: row[4] && row[5] ? `${row[4]}, ${row[5]}` : (row[4] || row[5] || ''),
      // notes: removed device column
    })).filter(location => location.latitude && location.longitude);
  } catch (error) {
    console.error('Error fetching location data:', error);
    throw new Error('Failed to fetch location data');
  }
}