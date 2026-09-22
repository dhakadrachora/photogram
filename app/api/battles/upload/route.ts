import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { verifyAdminRequest } from '@/lib/admin/auth';
import { verifyAdminRequestAsync } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const auth = await verifyAdminRequest(req);
  const isLegacyAdmin = !auth.isAdmin ? await verifyAdminRequestAsync(req) : true;

  if (!auth.isAdmin && !isLegacyAdmin) {
    return NextResponse.json(
      { error: 'Only Super Admin can upload battle images.', details: auth.error },
      { status: 403 }
    );
  }

  try {
    const formData = await req.formData();
    const rawBattleId = formData.get('battleId')?.toString() || `battle_${Date.now()}`;
    const battleId = rawBattleId.replace(/[^a-zA-Z0-9_-]/g, '') || 'battles';
    const optionAFile = formData.get('optionA') as File | null;
    const optionBFile = formData.get('optionB') as File | null;
    const singleFile = formData.get('file') as File | null;

    if (!optionAFile && !optionBFile && !singleFile) {
      return NextResponse.json(
        { error: 'No files provided for upload.' },
        { status: 400 }
      );
    }

    const sb = createServerClient();
    const bucketName = 'battle-image';

    const uploadFile = async (file: File, sideOrPrefix: string) => {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const ext = file.name.split('.').pop()?.toLowerCase() || 'webp';
      const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'webp';
      
      const filePath = `battles/${battleId}_${sideOrPrefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${safeExt}`;

      const { error } = await sb.storage
        .from(bucketName)
        .upload(filePath, buffer, {
          contentType: file.type || 'image/jpeg',
          upsert: true,
        });

      if (error) {
        throw new Error(`Failed to upload to battle-image bucket: ${error.message}`);
      }

      const { data } = sb.storage.from(bucketName).getPublicUrl(filePath);
      return data.publicUrl;
    };

    const results: { optionAUrl?: string; optionBUrl?: string; publicUrl?: string } = {};

    if (optionAFile && typeof optionAFile === 'object' && 'arrayBuffer' in optionAFile) {
      if (optionAFile.size > 10 * 1024 * 1024) throw new Error('Option A image exceeds 10MB limit.');
      results.optionAUrl = await uploadFile(optionAFile, 'optA');
    }

    if (optionBFile && typeof optionBFile === 'object' && 'arrayBuffer' in optionBFile) {
      if (optionBFile.size > 10 * 1024 * 1024) throw new Error('Option B image exceeds 10MB limit.');
      results.optionBUrl = await uploadFile(optionBFile, 'optB');
    }

    if (singleFile && typeof singleFile === 'object' && 'arrayBuffer' in singleFile) {
      if (singleFile.size > 10 * 1024 * 1024) throw new Error('Uploaded image exceeds 10MB limit.');
      results.publicUrl = await uploadFile(singleFile, 'single');
    }

    return NextResponse.json({
      success: true,
      battleId,
      ...results,
    });
  } catch (error: any) {
    console.error('[BATTLE_UPLOAD_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to upload images.', details: error?.message },
      { status: 500 }
    );
  }
}
