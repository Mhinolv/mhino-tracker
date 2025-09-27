import { google } from 'googleapis';

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
    let credentials;
    
    // Try to get credentials from environment variable first
    if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      try {
        credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
      } catch (parseError) {
        console.error('Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON:', parseError);
        throw new Error('Invalid GOOGLE_SERVICE_ACCOUNT_JSON format');
      }
    } else if (process.env.GOOGLE_SERVICE_ACCOUNT_FILE) {
      // Fallback to reading from file (for local development)
      const fs = await import('fs');
      const path = await import('path');
      const credentialsPath = path.resolve(process.env.GOOGLE_SERVICE_ACCOUNT_FILE);
      try {
        const credentialsData = fs.readFileSync(credentialsPath, 'utf8');
        credentials = JSON.parse(credentialsData);
      } catch (fileError) {
        console.error('Failed to read credentials file:', fileError);
        throw new Error('Failed to read credentials file');
      }
    } else {
      throw new Error('No Google credentials found. Set GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_SERVICE_ACCOUNT_FILE');
    }

    // Validate credentials
    if (!credentials.client_email) {
      throw new Error('Google credentials missing client_email field');
    }

    const auth = new google.auth.GoogleAuth({
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

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