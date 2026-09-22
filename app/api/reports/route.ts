import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, verifyAdminRequestAsync } from '@/lib/admin-auth';
import {
  createProblemReport,
  fetchUserProblemReports,
  fetchAllProblemReports,
  fetchProblemReportWithMessages,
} from '@/lib/reports';

export const dynamic = 'force-dynamic';

// GET /api/reports?reportId=xyz
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const reportId = searchParams.get('reportId');

  // Single report thread request
  if (reportId) {
    const report = await fetchProblemReportWithMessages(reportId);
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Security check: only the report owner or admin can view this thread
    const user = await getAuthenticatedUser(req);
    const isAdmin = await verifyAdminRequestAsync(req);

    const headerUserId = req.headers.get('x-user-id');
    const headerEmail = req.headers.get('x-user-email');
    const currentUserId = user?.id || headerUserId;
    const currentUserEmail = user?.email || headerEmail;

    const isOwner =
      Boolean(currentUserId && currentUserId === report.userId) ||
      Boolean(currentUserEmail && report.userEmail && currentUserEmail.toLowerCase() === report.userEmail.toLowerCase());

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ report });
  }

  // Listing reports
  const isAdmin = await verifyAdminRequestAsync(req);
  if (isAdmin) {
    const reports = await fetchAllProblemReports();
    return NextResponse.json({ reports });
  }

  // Normal user
  const user = await getAuthenticatedUser(req);
  const headerUserId = req.headers.get('x-user-id');
  const headerEmail = req.headers.get('x-user-email');

  const resolvedUserId = user?.id || headerUserId;
  const resolvedUserEmail = user?.email || headerEmail;

  if (!resolvedUserId && !resolvedUserEmail) {
    return NextResponse.json(
      { error: 'Unauthorized: Authentication required to view your reports' },
      { status: 401 }
    );
  }

  const reports = await fetchUserProblemReports(resolvedUserId || '', resolvedUserEmail || undefined);
  return NextResponse.json({ reports });
}

// POST /api/reports (Create report)
export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  const headerUserId = req.headers.get('x-user-id');
  const headerEmail = req.headers.get('x-user-email');
  const headerName = req.headers.get('x-user-name');

  try {
    const body = await req.json().catch(() => ({}));
    const { subject, description, attachmentUrl, userName: bodyUserName, category } = body;

    const resolvedUserId = user?.id || headerUserId || body.userId;
    const resolvedUserEmail = user?.email || headerEmail || body.userEmail;
    const resolvedUserName =
      bodyUserName ||
      headerName ||
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      resolvedUserEmail?.split('@')[0] ||
      'Community Resident';

    if (!resolvedUserId || !resolvedUserEmail) {
      return NextResponse.json(
        { error: 'Unauthorized: Please log in or provide user details to submit a report.' },
        { status: 401 }
      );
    }

    if (!subject || !subject.trim()) {
      return NextResponse.json({ error: 'Subject/title is required' }, { status: 400 });
    }
    if (!description || !description.trim()) {
      return NextResponse.json({ error: 'Problem description is required' }, { status: 400 });
    }

    const report = await createProblemReport({
      userId: resolvedUserId,
      userName: resolvedUserName,
      userEmail: resolvedUserEmail,
      subject: category ? `[${category}] ${subject.trim()}` : subject.trim(),
      description,
      attachmentUrl,
    });

    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to create report' }, { status: 500 });
  }
}
