import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { verifyAdminRequestAsync } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  if (!(await verifyAdminRequestAsync(req))) {
    return NextResponse.json(
      { error: 'Only Super Admin can upload battle images.' },
      { status: 403 }
    );
  }

  try {
    const formData = await req.formData();
    const battleId = formData.get('battleId')?.toString() || `battle_${Date.now()}`;
    const optionAFile = formData.get('optionA') as File | null;
    const optionBFile = formData.get('optionB') as File | null;

    if (!optionAFile && !optionBFile) {
      return NextResponse.json(
        { error: 'No files provided for upload.' },
        { status: 400 }
      );
    }

    const sb = createServerClient();
    const bucketName = 'battle-image';

    const uploadFile = async (file: File, side: 'a' | 'b') => {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const ext = file.name.split('.').pop()?.toLowerCase() || 'webp';
      const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'webp';
      
      const filePath = `${battleId}/option-${side}-${Date.now()}.${safeExt}`;

      const { error } = await sb.storage
        .from(bucketName)
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: true,
        });

      if (error) {
        throw new Error(`Failed to upload Option ${side.toUpperCase()} image: ${error.message}`);
      }

      const { data } = sb.storage.from(bucketName).getPublicUrl(filePath);
      return data.publicUrl;
    };

    const results: { optionAUrl?: string; optionBUrl?: string } = {};

    if (optionAFile) {
      if (optionAFile.size > 10 * 1024 * 1024) throw new Error('Option A image exceeds 10MB limit.');
      results.optionAUrl = await uploadFile(optionAFile, 'a');
    }

    if (optionBFile) {
      if (optionBFile.size > 10 * 1024 * 1024) throw new Error('Option B image exceeds 10MB limit.');
      results.optionBUrl = await uploadFile(optionBFile, 'b');
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
