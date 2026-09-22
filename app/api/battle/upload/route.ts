import { NextRequest } from 'next/server';
import { POST as handleUpload } from '../../battles/upload/route';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  return handleUpload(req);
}
