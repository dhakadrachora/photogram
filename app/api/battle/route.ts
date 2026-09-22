import { NextRequest, NextResponse } from 'next/server';
import { GET as getBattles, POST as postBattle } from '../battles/route';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return getBattles(req);
}

export async function POST(req: NextRequest) {
  return postBattle(req);
}
