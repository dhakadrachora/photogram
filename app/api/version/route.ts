import { NextResponse } from 'next/server';

// This timestamp changes whenever the server boots or deploys
const BUILD_TIME = process.env.BUILD_TIMESTAMP || new Date().toISOString();
const APP_VERSION = '2.1.0';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(
    {
      version: APP_VERSION,
      buildTime: BUILD_TIME,
      timestamp: Date.now(),
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    }
  );
}
