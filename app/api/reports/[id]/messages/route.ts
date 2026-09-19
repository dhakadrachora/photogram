import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, verifyAdminRequestAsync } from '@/lib/admin-auth';
import { fetchProblemReportWithMessages, addReportMessage } from '@/lib/reports';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getAuthenticatedUser(req);
  const isAdmin = await verifyAdminRequestAsync(req);

  if (!user && !isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const report = await fetchProblemReportWithMessages(id);
  if (!report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  // If not admin, must be report owner
  if (!isAdmin && user?.id !== report.userId) {
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
      : user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
    const senderEmail = isAdmin
      ? 'rohitdhakaddhoti143@gmail.com'
      : user?.email || '';

    const newMsg = await addReportMessage({
      reportId: id,
      senderId: isAdmin ? 'admin' : (user?.id || 'user'),
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
