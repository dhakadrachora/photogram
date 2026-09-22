import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/admin/auth';
import { createServerClient } from '@/lib/supabase';
import { validateImageFile } from '@/lib/admin/validation';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const BUCKET_NAME = 'battle-image';

export async function POST(req: NextRequest) {
  const auth = await verifyAdminRequest(req);
  if (!auth.isAdmin) {
    return NextResponse.json({ success: false, error: auth.error || 'Forbidden' }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder')?.toString() || 'uploads').replace(/[^a-zA-Z0-9_-]/g, '');

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const validation = validateImageFile(file);
    if (!validation.isValid) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
    }

    const sb = createServerClient();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const ext = file.name.split('.').pop()?.toLowerCase() || 'webp';
    const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'webp';
    const filename = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${safeExt}`;

    const { error: uploadError } = await sb.storage
      .from(BUCKET_NAME)
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('[STORAGE_UPLOAD_ERROR]', uploadError);
      return NextResponse.json(
        { success: false, error: `Upload to storage failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const { data } = sb.storage.from(BUCKET_NAME).getPublicUrl(filename);
    const publicUrl = data.publicUrl;

    return NextResponse.json({
      success: true,
      message: 'Image uploaded successfully',
      publicUrl,
      path: filename,
    });
  } catch (err: any) {
    console.error('[ADMIN_UPLOAD_ERROR]', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Unexpected upload error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const auth = await verifyAdminRequest(req);
  if (!auth.isAdmin) {
    return NextResponse.json({ success: false, error: auth.error || 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const folder = searchParams.get('folder') || '';

  const sb = createServerClient();

  try {
    const { data, error } = await sb.storage.from(BUCKET_NAME).list(folder, {
      limit: 100,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' },
    });

    if (error) throw error;

    const filesWithUrls = (data || []).map((item) => {
      const fullPath = folder ? `${folder}/${item.name}` : item.name;
      const { data: urlData } = sb.storage.from(BUCKET_NAME).getPublicUrl(fullPath);
      return {
        ...item,
        publicUrl: urlData.publicUrl,
      };
    });

    return NextResponse.json({
      success: true,
      bucket: BUCKET_NAME,
      files: filesWithUrls,
    });
  } catch (err: any) {
    console.error('[ADMIN_STORAGE_LIST_ERROR]', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to list storage items' },
      { status: 500 }
    );
  }
}
