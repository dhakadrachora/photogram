import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequestAsync, SITE_OWNER_EMAIL } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const isAdmin = await verifyAdminRequestAsync(req);
  if (!isAdmin) {
    return NextResponse.json({ isAdmin: false }, { status: 200 });
  }

  return NextResponse.json({
    isAdmin: true,
    email: SITE_OWNER_EMAIL,
  });
}
