import { supabase, isSupabaseConfigured } from './supabase';
import { ProblemReport, ReportMessage, ReportStatus } from '@/types';
import { SITE_OWNER_EMAIL } from './admin-auth';

// In-memory fallback cache for immediate reactivity and offline reliability
const inMemoryReports = new Map<string, ProblemReport>();
const inMemoryMessages = new Map<string, ReportMessage[]>();

/**
 * Creates a new Problem Report and inserts initial conversation message.
 */
export async function createProblemReport(params: {
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  description: string;
  attachmentUrl?: string;
}): Promise<ProblemReport> {
  const reportId = `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const msgId = `rmsg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const newReport: ProblemReport = {
    id: reportId,
    userId: params.userId,
    userName: params.userName || 'Community User',
    userEmail: params.userEmail,
    subject: params.subject.trim(),
    description: params.description.trim(),
    attachmentUrl: params.attachmentUrl || undefined,
    status: 'Open',
    latestMessage: params.description.trim(),
    createdAt: now,
    updatedAt: now,
  };

  const initialMsg: ReportMessage = {
    id: msgId,
    reportId,
    senderId: params.userId,
    senderName: params.userName || 'User',
    senderEmail: params.userEmail,
    senderRole: 'user',
    message: params.description.trim(),
    attachmentUrl: params.attachmentUrl || undefined,
    createdAt: now,
  };

  // Cache in memory
  inMemoryReports.set(reportId, newReport);
  inMemoryMessages.set(reportId, [initialMsg]);

  // Persist to Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      const { error: repErr } = await supabase.from('reports').insert({
        id: newReport.id,
        user_id: newReport.userId,
        user_name: newReport.userName,
        user_email: newReport.userEmail,
        subject: newReport.subject,
        description: newReport.description,
        attachment_url: newReport.attachmentUrl || null,
        status: newReport.status,
        latest_message: newReport.latestMessage,
        created_at: newReport.createdAt,
        updated_at: newReport.updatedAt,
      });

      if (repErr) {
        console.warn('Could not insert report into Supabase table (falling back to memory):', repErr.message);
      } else {
        await supabase.from('report_messages').insert({
          id: initialMsg.id,
          report_id: initialMsg.reportId,
          sender_id: initialMsg.senderId,
          sender_name: initialMsg.senderName,
          sender_email: initialMsg.senderEmail,
          sender_role: initialMsg.senderRole,
          message: initialMsg.message,
          attachment_url: initialMsg.attachmentUrl || null,
          created_at: initialMsg.createdAt,
        });
      }
    } catch (e) {
      console.warn('Supabase report insert exception:', e);
    }
  }

  return {
    ...newReport,
    messages: [initialMsg],
  };
}

/**
 * Loads reports for a specific logged-in user.
 */
export async function fetchUserProblemReports(userId: string, userEmail?: string): Promise<ProblemReport[]> {
  if (isSupabaseConfigured()) {
    try {
      let query = supabase.from('reports').select('*');
      if (userId) {
        query = query.eq('user_id', userId);
      } else if (userEmail) {
        query = query.eq('user_email', userEmail);
      }

      const { data, error } = await query.order('updated_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return data.map((r: any) => ({
          id: r.id,
          userId: r.user_id,
          userName: r.user_name,
          userEmail: r.user_email,
          subject: r.subject,
          description: r.description,
          attachmentUrl: r.attachment_url,
          status: r.status as ReportStatus,
          latestMessage: r.latest_message,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        }));
      }
    } catch (e) {
      console.warn('Failed to fetch user reports from Supabase:', e);
    }
  }

  // Fallback to memory
  return Array.from(inMemoryReports.values())
    .filter((r) => r.userId === userId || (userEmail && r.userEmail.toLowerCase() === userEmail.toLowerCase()))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

/**
 * Loads all problem reports for the verified Admin.
 */
export async function fetchAllProblemReports(): Promise<ProblemReport[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('updated_at', { ascending: false });

      if (!error && data) {
        return data.map((r: any) => ({
          id: r.id,
          userId: r.user_id,
          userName: r.user_name,
          userEmail: r.user_email,
          subject: r.subject,
          description: r.description,
          attachmentUrl: r.attachment_url,
          status: r.status as ReportStatus,
          latestMessage: r.latest_message,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        }));
      }
    } catch (e) {
      console.warn('Failed to fetch admin reports from Supabase:', e);
    }
  }

  return Array.from(inMemoryReports.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

/**
 * Loads a single report along with all threaded messages.
 */
export async function fetchProblemReportWithMessages(reportId: string): Promise<ProblemReport | null> {
  let report: ProblemReport | null = null;

  if (isSupabaseConfigured()) {
    try {
      const { data: repData, error: repErr } = await supabase
        .from('reports')
        .select('*')
        .eq('id', reportId)
        .maybeSingle();

      if (!repErr && repData) {
        report = {
          id: repData.id,
          userId: repData.user_id,
          userName: repData.user_name,
          userEmail: repData.user_email,
          subject: repData.subject,
          description: repData.description,
          attachmentUrl: repData.attachment_url,
          status: repData.status as ReportStatus,
          latestMessage: repData.latest_message,
          createdAt: repData.created_at,
          updatedAt: repData.updated_at,
        };

        const { data: msgsData, error: msgsErr } = await supabase
          .from('report_messages')
          .select('*')
          .eq('report_id', reportId)
          .order('created_at', { ascending: true });

        if (!msgsErr && msgsData) {
          report.messages = msgsData.map((m: any) => ({
            id: m.id,
            reportId: m.report_id,
            senderId: m.sender_id,
            senderName: m.sender_name,
            senderEmail: m.sender_email,
            senderRole: m.sender_role,
            message: m.message,
            attachmentUrl: m.attachment_url,
            createdAt: m.created_at,
          }));
          return report;
        }
      }
    } catch (e) {
      console.warn('Failed to fetch report thread from Supabase:', e);
    }
  }

  // Fallback to memory
  const memoryRep = inMemoryReports.get(reportId);
  if (memoryRep) {
    return {
      ...memoryRep,
      messages: inMemoryMessages.get(reportId) || [],
    };
  }

  return report;
}

/**
 * Adds a reply to an existing report thread.
 */
export async function addReportMessage(params: {
  reportId: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  senderRole: 'user' | 'admin';
  message: string;
  attachmentUrl?: string;
}): Promise<ReportMessage> {
  const msgId = `rmsg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const newMsg: ReportMessage = {
    id: msgId,
    reportId: params.reportId,
    senderId: params.senderId,
    senderName: params.senderName,
    senderEmail: params.senderEmail,
    senderRole: params.senderRole,
    message: params.message.trim(),
    attachmentUrl: params.attachmentUrl || undefined,
    createdAt: now,
  };

  // Determine new report status:
  // If admin replies, change to 'Replied'
  // If user replies and was 'Replied', reopen to 'Open'
  const newStatus: ReportStatus = params.senderRole === 'admin' ? 'Replied' : 'Open';

  // Update memory
  const existingMsgs = inMemoryMessages.get(params.reportId) || [];
  inMemoryMessages.set(params.reportId, [...existingMsgs, newMsg]);

  const existingRep = inMemoryReports.get(params.reportId);
  if (existingRep) {
    existingRep.latestMessage = newMsg.message;
    existingRep.updatedAt = now;
    if (existingRep.status !== 'Resolved' || params.senderRole === 'admin') {
      existingRep.status = newStatus;
    }
    inMemoryReports.set(params.reportId, existingRep);
  }

  // Persist to Supabase
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('report_messages').insert({
        id: newMsg.id,
        report_id: newMsg.reportId,
        sender_id: newMsg.senderId,
        sender_name: newMsg.senderName,
        sender_email: newMsg.senderEmail,
        sender_role: newMsg.senderRole,
        message: newMsg.message,
        attachment_url: newMsg.attachmentUrl || null,
        created_at: newMsg.createdAt,
      });

      await supabase.from('reports').update({
        latest_message: newMsg.message,
        status: newStatus,
        updated_at: now,
      }).eq('id', params.reportId);
    } catch (e) {
      console.warn('Failed to insert report message into Supabase:', e);
    }
  }

  return newMsg;
}

/**
 * Updates the status of a report (Open, Replied, Resolved).
 */
export async function updateReportStatus(reportId: string, status: ReportStatus): Promise<boolean> {
  const now = new Date().toISOString();

  const existing = inMemoryReports.get(reportId);
  if (existing) {
    existing.status = status;
    existing.updatedAt = now;
    inMemoryReports.set(reportId, existing);
  }

  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('reports')
        .update({
          status,
          updated_at: now,
        })
        .eq('id', reportId);

      if (error) {
        console.warn('Supabase update warning (in-memory state preserved):', error.message);
      }
      return true;
    } catch (e) {
      console.warn('Failed to update report status in Supabase:', e);
      return Boolean(existing);
    }
  }

  return true;
}
