import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { verifyAdminRequestAsync, SITE_OWNER_EMAIL } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
]);

function getR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    return null;
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

function cleanFilename(filename: string) {
  return filename
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .toLowerCase();
}

function getExtension(filename: string, contentType: string) {
  const originalExtension = filename.includes('.')
    ? filename.split('.').pop()?.toLowerCase()
    : '';

  if (originalExtension) {
    return originalExtension;
  }

  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/svg+xml': 'svg',
  };

  return map[contentType] || 'bin';
}

export async function POST(req: NextRequest) {
  // Only the verified Super Admin can upload assets.
  const isAdmin = await verifyAdminRequestAsync(req);

  if (!isAdmin) {
    return NextResponse.json(
      {
        error: `Unauthorized: Only verified admin (${SITE_OWNER_EMAIL}) can upload assets.`,
      },
      { status: 403 }
    );
  }

  try {
    const contentType = req.headers.get('content-type') || '';

    let file: File | null = null;
    let requestedFilename = 'asset';
    let alt = 'Uploaded Asset';

    // ---------------------------------------------------------
    // JSON payload
    // ---------------------------------------------------------
    if (contentType.includes('application/json')) {
      const body = await req.json().catch(() => null);

      if (!body) {
        return NextResponse.json(
          { error: 'Invalid JSON payload.' },
          { status: 400 }
        );
      }

      const {
        dataUrl,
        filename = 'asset',
        alt: providedAlt = 'Uploaded Asset',
      } = body;

      if (!dataUrl || typeof dataUrl !== 'string') {
        return NextResponse.json(
          { error: 'dataUrl is required.' },
          { status: 400 }
        );
      }

      // Parse data URL.
      const match = dataUrl.match(
        /^data:([a-zA-Z0-9.+-]+);base64,(.+)$/s
      );

      if (!match) {
        return NextResponse.json(
          {
            error:
              'Invalid dataUrl. Expected a base64 data URL such as data:image/png;base64,...',
          },
          { status: 400 }
        );
      }

      const mimeType = match[1].toLowerCase();
      const base64Data = match[2];

      if (!ALLOWED_TYPES.has(mimeType)) {
        return NextResponse.json(
          {
            error: `Unsupported image type: ${mimeType}`,
            allowedTypes: Array.from(ALLOWED_TYPES),
          },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(base64Data, 'base64');

      if (!buffer.length) {
        return NextResponse.json(
          { error: 'Uploaded image is empty.' },
          { status: 400 }
        );
      }

      if (buffer.length > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: 'File is too large. Maximum size is 10 MB.' },
          { status: 413 }
        );
      }

      file = new File([buffer], filename, {
        type: mimeType,
      });

      requestedFilename = filename;
      alt = String(providedAlt || 'Uploaded Asset').slice(0, 300);
    }

    // ---------------------------------------------------------
    // FormData payload
    // ---------------------------------------------------------
    else {
      const formData = await req.formData();
      const uploadedFile = formData.get('file');

      if (!(uploadedFile instanceof File)) {
        return NextResponse.json(
          { error: 'No valid file provided in form data.' },
          { status: 400 }
        );
      }

      file = uploadedFile;

      requestedFilename = uploadedFile.name || 'asset';

      const formAlt = formData.get('alt');

      if (typeof formAlt === 'string' && formAlt.trim()) {
        alt = formAlt.trim().slice(0, 300);
      }
    }

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided.' },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // Validate file
    // ---------------------------------------------------------
    const mimeType = (file.type || 'application/octet-stream').toLowerCase();

    if (!ALLOWED_TYPES.has(mimeType)) {
      return NextResponse.json(
        {
          error: `Unsupported file type: ${mimeType}`,
          allowedTypes: Array.from(ALLOWED_TYPES),
        },
        { status: 400 }
      );
    }

    if (file.size <= 0) {
      return NextResponse.json(
        { error: 'Uploaded file is empty.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File is too large. Maximum size is 10 MB.' },
        { status: 413 }
      );
    }

    // ---------------------------------------------------------
    // Check R2 configuration
    // ---------------------------------------------------------
    const bucketName = process.env.R2_BUCKET_NAME;
    const publicUrl = process.env.R2_PUBLIC_URL;

    if (!bucketName || !publicUrl) {
      return NextResponse.json(
        {
          error:
            'Cloudflare R2 is not configured. Missing R2_BUCKET_NAME or R2_PUBLIC_URL.',
        },
        { status: 500 }
      );
    }

    const r2 = getR2Client();

    if (!r2) {
      return NextResponse.json(
        {
          error:
            'Cloudflare R2 credentials are not configured. Missing R2_ACCOUNT_ID, R2_ACCESS_KEY_ID or R2_SECRET_ACCESS_KEY.',
        },
        { status: 500 }
      );
    }

    // ---------------------------------------------------------
    // Create safe unique object key
    // ---------------------------------------------------------
    const safeFilename = cleanFilename(requestedFilename) || 'asset';

    const extension = getExtension(
      safeFilename,
      mimeType
    );

    const baseName = safeFilename.replace(/\.[^.]+$/, '') || 'asset';

    const objectKey =
      `uploads/${new Date().toISOString().slice(0, 10)}/` +
      `${Date.now()}-${crypto.randomUUID()}-${baseName}.${extension}`;

    // ---------------------------------------------------------
    // Read file
    // ---------------------------------------------------------
    const buffer = Buffer.from(await file.arrayBuffer());

    // ---------------------------------------------------------
    // ACTUAL Cloudflare R2 upload
    // ---------------------------------------------------------
    await r2.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
        Body: buffer,
        ContentType: mimeType,
        CacheControl: 'public, max-age=31536000, immutable',
        Metadata: {
          alt: alt.slice(0, 300),
          uploadedBy: SITE_OWNER_EMAIL,
        },
      })
    );

    // ---------------------------------------------------------
    // Public URL
    // ---------------------------------------------------------
    const normalizedPublicUrl = publicUrl.replace(/\/+$/, '');

    const finalUrl = `${normalizedPublicUrl}/${objectKey}`;

    return NextResponse.json({
      success: true,
      url: finalUrl,
      storage: 'cloudflare-r2',
      filename: safeFilename,
      key: objectKey,
      contentType: mimeType,
      size: buffer.length,
      alt,
    });
  } catch (error: unknown) {
    console.error('Admin asset upload failed:', error);

    const message =
      error instanceof Error
        ? error.message
        : 'Unknown upload error';

    return NextResponse.json(
      {
        success: false,
        error: 'Upload failed.',
        details: message,
      },
      { status: 500 }
    );
  }
}