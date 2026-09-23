import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/admin/auth';
import { createServerClient, supabase, isSupabaseConfigured } from '@/lib/supabase';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

interface BroadcastRequestBody {
  type: 'email' | 'notification' | 'both';
  target: 'all' | 'selected';
  userIds?: string[];
  emails?: string[];
  subject: string;
  title?: string;
  message: string;
  actionUrl?: string;
}

// In-memory store for active system broadcasts to display on user frontend
const systemBroadcastStore: Array<{
  id: string;
  title: string;
  message: string;
  actionUrl?: string;
  target: 'all' | 'selected';
  userIds?: string[];
  timestamp: number;
}> = [];

export async function GET() {
  // Returns recent in-app system notifications for clients
  const activeBroadcasts = systemBroadcastStore
    .filter((b) => Date.now() - b.timestamp < 48 * 60 * 60 * 1000)
    .slice(-10)
    .reverse();

  return NextResponse.json({
    success: true,
    broadcasts: activeBroadcasts,
  });
}

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAdminRequest(req);
    if (!auth.isAdmin) {
      return NextResponse.json(
        { success: false, error: auth.error || 'Admin access required' },
        { status: 403 }
      );
    }

    const body: BroadcastRequestBody = await req.json().catch(() => ({}));
    const {
      type = 'both',
      target = 'all',
      userIds = [],
      emails = [],
      subject,
      title,
      message,
      actionUrl,
    } = body;

    if (!subject?.trim() && !title?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Subject or Title is required.' },
        { status: 400 }
      );
    }

    if (!message?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Message content is required.' },
        { status: 400 }
      );
    }

    const sb = createServerClient();
    let recipientUsers: Array<{ id: string; name: string; email: string }> = [];

    // 1. Fetch target recipients from database
    if (isSupabaseConfigured()) {
      try {
        let query = sb.from('users').select('id, name, email');

        if (target === 'selected') {
          if (Array.isArray(userIds) && userIds.length > 0) {
            query = query.in('id', userIds);
          } else if (Array.isArray(emails) && emails.length > 0) {
            query = query.in('email', emails);
          }
        }

        const { data: dbUsers, error: userError } = await query;
        if (!userError && Array.isArray(dbUsers)) {
          recipientUsers = dbUsers.filter((u) => u.email && u.email.includes('@'));
        }
      } catch (err) {
        console.warn('Could not query users for broadcast:', err);
      }
    }

    // Fallback if target was selected emails directly passed
    if (recipientUsers.length === 0 && Array.isArray(emails) && emails.length > 0) {
      recipientUsers = emails.map((em, idx) => ({
        id: `custom_${idx}`,
        name: em.split('@')[0],
        email: em,
      }));
    }

    const totalRecipients = recipientUsers.length;
    const recipientEmails = recipientUsers.map((u) => u.email).filter(Boolean);

    let emailSentCount = 0;
    let emailStatus = 'skipped';
    let emailNote = '';

    // 2. Handle EMAIL Broadcast
    if (type === 'email' || type === 'both') {
      const smtpHost = process.env.SMTP_HOST;
      const smtpPort = Number(process.env.SMTP_PORT || 587);
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;
      const smtpFrom = process.env.SMTP_FROM || `"DHOTI AALE" <${smtpUser || 'admin@dhotiaale.online'}>`;

      const emailSubject = subject || title || 'DHOTI AALE Official Announcement';
      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${emailSubject}</title>
</head>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #f1f5f9;">
  <div style="max-width: 580px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
    <div style="background: linear-gradient(135deg, #f59e0b, #ea580c); padding: 28px 24px; text-align: center;">
      <h1 style="margin: 0; color: #020617; font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">DHOTI AALE</h1>
      <p style="margin: 4px 0 0 0; color: #451a03; font-size: 13px; font-weight: 700;">राजस्थान का डिजिटल गाँव समुदाय • Digital Village Community</p>
    </div>
    
    <div style="padding: 28px 24px;">
      <h2 style="margin: 0 0 16px 0; color: #ffffff; font-size: 18px; font-weight: 800;">${emailSubject}</h2>
      <div style="color: #cbd5e1; font-size: 14px; line-height: 1.7; white-space: pre-wrap;">${message}</div>

      ${
        actionUrl
          ? `
      <div style="margin-top: 32px; text-align: center;">
        <a href="${actionUrl}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #ea580c); color: #020617; font-weight: 800; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 9999px; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.35);">
          यहाँ क्लिक करें / Open Link
        </a>
      </div>`
          : ''
      }
    </div>

    <div style="background-color: #090d16; padding: 20px; text-align: center; border-top: 1px solid #1e293b; font-size: 11px; color: #64748b;">
      <p style="margin: 0;">यह संदेश DHOTI AALE एडमिनिस्ट्रेशन द्वारा आधिकारिक रूप से भेजा गया है।</p>
      <p style="margin: 4px 0 0 0;">Website: <a href="https://www.dhotiaale.online" style="color: #f59e0b; text-decoration: none;">dhotiaale.online</a></p>
    </div>
  </div>
</body>
</html>
      `;

      if (smtpHost && smtpUser && smtpPass && recipientEmails.length > 0) {
        try {
          const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: {
              user: smtpUser,
              pass: smtpPass,
            },
          });

          // Send in batches of 25 to respect SMTP rate limits
          const batchSize = 25;
          for (let i = 0; i < recipientEmails.length; i += batchSize) {
            const batch = recipientEmails.slice(i, i + batchSize);
            await transporter.sendMail({
              from: smtpFrom,
              bcc: batch,
              subject: emailSubject,
              html: emailHtml,
            });
            emailSentCount += batch.length;
          }

          emailStatus = 'sent';
          emailNote = `Successfully sent via SMTP to ${emailSentCount} users.`;
        } catch (smtpErr: any) {
          console.error('[SMTP Broadcast Error]:', smtpErr);
          emailStatus = 'smtp_error';
          emailNote = `SMTP failed: ${smtpErr?.message || 'Check SMTP configuration'}`;
        }
      } else {
        // Safe simulation when SMTP is not configured in env
        emailStatus = 'simulated';
        emailSentCount = recipientEmails.length;
        emailNote = `SMTP_HOST or credentials not configured in .env.local. Logged broadcast for ${recipientEmails.length} recipients. Add SMTP_HOST, SMTP_USER, SMTP_PASS to send live emails.`;
        console.log(`[Broadcast Mail Log] Subject: "${emailSubject}" | Recipients: ${recipientEmails.length}`);
      }
    }

    // 3. Handle IN-APP & REALTIME PUSH NOTIFICATION
    let notificationStatus = 'skipped';
    if (type === 'notification' || type === 'both') {
      const broadcastItem = {
        id: `broadcast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: title || subject || '🔔 नया गाँव अपडेट / New Notification',
        message,
        actionUrl: actionUrl || undefined,
        target,
        userIds: target === 'selected' ? userIds : undefined,
        timestamp: Date.now(),
      };

      // Add to server memory store
      systemBroadcastStore.push(broadcastItem);
      if (systemBroadcastStore.length > 50) {
        systemBroadcastStore.shift();
      }

      // Broadcast immediately across Supabase Realtime channel
      if (isSupabaseConfigured()) {
        try {
          const channel = supabase.channel('world-chat-live-room');
          await channel.send({
            type: 'broadcast',
            event: 'system_notification',
            payload: broadcastItem,
          });
        } catch (realtimeErr) {
          console.warn('Realtime notification broadcast error:', realtimeErr);
        }

        // Also save to updates table for permanent community visibility
        try {
          await sb.from('updates').insert({
            id: broadcastItem.id,
            title: broadcastItem.title,
            summary: message.substring(0, 180),
            tag: 'सूचना',
            badge_color: 'amber',
            link_url: actionUrl || null,
            published: true,
            date: new Date().toLocaleDateString('hi-IN'),
          });
        } catch {}
      }

      notificationStatus = 'published';
    }

    return NextResponse.json({
      success: true,
      message: `Broadcast processed successfully for ${totalRecipients > 0 ? totalRecipients : 'all'} recipients.`,
      details: {
        recipientsMatched: totalRecipients,
        emailStatus,
        emailSentCount,
        emailNote,
        notificationStatus,
      },
    });
  } catch (error: any) {
    console.error('[ADMIN BROADCAST ERROR]', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Broadcast failed to execute' },
      { status: 500 }
    );
  }
}
