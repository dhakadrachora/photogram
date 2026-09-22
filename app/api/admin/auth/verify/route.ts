import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/admin/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await verifyAdminRequest(req);
  if (!auth.isAdmin) {
    return NextResponse.json(
      { success: false, error: auth.error || 'Unauthorized admin access' },
      { status: 403 }
    );
  }

  return NextResponse.json({
    success: true,
    isAdmin: true,
    user: auth.user,
  });
}
