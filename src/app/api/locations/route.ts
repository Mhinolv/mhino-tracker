import { NextResponse } from 'next/server';
import { getLocationHistory } from '@/lib/google-sheets';

export async function GET() {
  try {
    const locations = await getLocationHistory();
    return NextResponse.json(locations);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    );
  }
}