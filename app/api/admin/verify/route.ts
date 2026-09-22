import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/admin/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await verifyAdminRequest(req);
  if (!auth.isAdmin) {
    return NextResponse.json({ isAdmin: false }, { status: 200 });
  }

  return NextResponse.json({
    isAdmin: true,
    email: auth.user?.email,
    role: auth.user?.role || 'admin',
  });
}
