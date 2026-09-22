import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, verifyAdminRequestAsync } from '@/lib/admin-auth';
import { fetchProblemReportWithMessages, updateReportStatus } from '@/lib/reports';
import { ReportStatus } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const report = await fetchProblemReportWithMessages(id);
  if (!report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  const user = await getAuthenticatedUser(req);
  const isAdmin = await verifyAdminRequestAsync(req);

  if (!isAdmin && (!user || user.id !== report.userId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({ success: true, report });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const isAdmin = await verifyAdminRequestAsync(req);
  const user = await getAuthenticatedUser(req);

  const report = await fetchProblemReportWithMessages(id);
  if (!report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  // Only Admin or the report owner can update status
  if (!isAdmin && (!user || user.id !== report.userId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { status } = body;

    const validStatuses: ReportStatus[] = ['Open', 'Replied', 'Resolved'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const success = await updateReportStatus(id, status);
    return NextResponse.json({ success, status });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to update status' }, { status: 500 });
  }
}
