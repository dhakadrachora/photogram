import { NextResponse } from 'next/server';
import {
  DEFAULT_UPLOAD_PERMISSIONS,
  UploadCategory,
  UploadPermissions,
} from '@/lib/uploadPermissions';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      category,
      fileType,
      fileName,
    }: { category?: UploadCategory; fileType?: string; fileName?: string } = body;

    if (!category) {
      return NextResponse.json(
        { allowed: false, error: 'Category is required for upload verification.' },
        { status: 400 }
      );
    }

    const isVideo = fileType?.startsWith('video') || false;

    // Backend rule enforcement for temporary restrictions
    // 1. Prohibited video uploads
    if (category === 'allow_video_posts' && !DEFAULT_UPLOAD_PERMISSIONS.allow_video_posts) {
      return NextResponse.json({
        allowed: false,
        error:
          'Backend Security: Normal video post uploads are temporarily disabled. Please upload photos.',
        category,
      });
    }

    if (category === 'allow_reels_uploads' && !DEFAULT_UPLOAD_PERMISSIONS.allow_reels_uploads) {
      return NextResponse.json({
        allowed: false,
        error:
          'Backend Security: Reels video uploads are temporarily disabled. Existing reels playback remains active.',
        category,
      });
    }

    if (category === 'allow_chat_videos' && !DEFAULT_UPLOAD_PERMISSIONS.allow_chat_videos) {
      return NextResponse.json({
        allowed: false,
        error:
          'Backend Security: Video attachments in direct messages are temporarily disabled. Image sharing is active.',
        category,
      });
    }

    // 2. Video passed under image post category
    if (
      (category === 'allow_image_posts' || category === 'allow_carousel_images') &&
      isVideo &&
      !DEFAULT_UPLOAD_PERMISSIONS.allow_video_posts
    ) {
      return NextResponse.json({
        allowed: false,
        error:
          'Backend Security: Video files cannot be posted as image posts while video uploads are paused.',
        category,
      });
    }

    // 3. Video stories are explicitly allowed
    if (category === 'allow_video_stories') {
      return NextResponse.json({
        allowed: true,
        message: 'Video stories upload is enabled and active.',
        category,
      });
    }

    return NextResponse.json({
      allowed: true,
      message: 'Upload permitted under current policy.',
      category,
    });
  } catch (error: any) {
    return NextResponse.json(
      { allowed: false, error: error?.message || 'Upload policy check failed.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'active',
    policy: 'Photogram Temporary Video Upload Restriction',
    defaults: DEFAULT_UPLOAD_PERMISSIONS,
  });
}
