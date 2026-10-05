import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, verifyAdminRequestAsync, SITE_OWNER_EMAIL } from '@/lib/admin-auth';
import { fetchProblemReportWithMessages, addReportMessage } from '@/lib/reports';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getAuthenticatedUser(req);
  const isAdmin = await verifyAdminRequestAsync(req);

  const headerUserId = req.headers.get('x-user-id');
  const headerEmail = req.headers.get('x-user-email');
  const headerName = req.headers.get('x-user-name');

  const resolvedUserId = user?.id || headerUserId;
  const resolvedUserEmail = user?.email || headerEmail;

  if (!resolvedUserId && !isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const report = await fetchProblemReportWithMessages(id);
  if (!report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  // If not admin, must be report owner
  const isOwner =
    Boolean(resolvedUserId && resolvedUserId === report.userId) ||
    Boolean(resolvedUserEmail && report.userEmail && resolvedUserEmail.toLowerCase() === report.userEmail.toLowerCase());

  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { message, attachmentUrl } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
    }

    const senderRole: 'user' | 'admin' = isAdmin ? 'admin' : 'user';
    const senderName = isAdmin
      ? 'Admin 👑'
      : user?.user_metadata?.full_name || user?.user_metadata?.name || headerName || resolvedUserEmail?.split('@')[0] || 'User';
    const senderEmail = isAdmin
      ? (user?.email || SITE_OWNER_EMAIL)
      : user?.email || resolvedUserEmail || '';

    const newMsg = await addReportMessage({
      reportId: id,
      senderId: isAdmin ? 'admin' : (resolvedUserId || 'user'),
      senderName,
      senderEmail,
      senderRole,
      message: message.trim(),
      attachmentUrl,
    });

    return NextResponse.json({ success: true, message: newMsg });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to send message' }, { status: 500 });
  }
}
