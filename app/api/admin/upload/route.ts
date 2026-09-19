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

const EXTENSION_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
};

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
  return (
    filename
      .trim()
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^\.+/, '')
      .toLowerCase() || 'asset'
  );
}

function getBaseName(filename: string) {
  return filename.replace(/\.[^.]+$/, '') || 'asset';
}

function getExtension(contentType: string) {
  return EXTENSION_BY_TYPE[contentType] || 'bin';
}

function normalizePublicUrl(url: string) {
  return url.trim().replace(/\/+$/, '');
}

function isDataUrl(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^data:[a-zA-Z0-9.+-]+;base64,/s.test(value)
  );
}

export async function POST(req: NextRequest) {
  // ---------------------------------------------------------
  // SUPER ADMIN CHECK
  // ---------------------------------------------------------
  const isAdmin = await verifyAdminRequestAsync(req);

  if (!isAdmin) {
    return NextResponse.json(
      {
        success: false,
        error: `Unauthorized: Only verified admin (${SITE_OWNER_EMAIL}) can upload assets.`,
      },
      { status: 403 }
    );
  }

  try {
    const contentType = (
      req.headers.get('content-type') || ''
    ).toLowerCase();

    let file: File | null = null;
    let requestedFilename = 'asset';
    let alt = 'Uploaded Asset';

    // =========================================================
    // JSON / DATA URL
    // =========================================================
    if (contentType.includes('application/json')) {
      const body = await req.json().catch(() => null);

      if (!body || typeof body !== 'object') {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid JSON payload.',
          },
          { status: 400 }
        );
      }

      const dataUrl = body.dataUrl;
      const filename =
        typeof body.filename === 'string'
          ? body.filename
          : 'asset';

      const providedAlt =
        typeof body.alt === 'string'
          ? body.alt
          : 'Uploaded Asset';

      if (!isDataUrl(dataUrl)) {
        return NextResponse.json(
          {
            success: false,
            error:
              'dataUrl is required and must be a valid base64 data URL.',
          },
          { status: 400 }
        );
      }

      const match = dataUrl.match(
        /^data:([a-zA-Z0-9.+-]+);base64,(.+)$/s
      );

      if (!match) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid base64 data URL.',
          },
          { status: 400 }
        );
      }

      const mimeType = match[1].toLowerCase();
      const base64Data = match[2];

      if (!ALLOWED_TYPES.has(mimeType)) {
        return NextResponse.json(
          {
            success: false,
            error: `Unsupported image type: ${mimeType}`,
            allowedTypes: Array.from(ALLOWED_TYPES),
          },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(base64Data, 'base64');

      if (!buffer.length) {
        return NextResponse.json(
          {
            success: false,
            error: 'Uploaded image is empty.',
          },
          { status: 400 }
        );
      }

      if (buffer.length > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            success: false,
            error: 'File is too large. Maximum size is 10 MB.',
          },
          { status: 413 }
        );
      }

      file = new File([buffer], filename, {
        type: mimeType,
      });

      requestedFilename = filename;
      alt = providedAlt.trim().slice(0, 300);
    }

    // =========================================================
    // FORMDATA
    // =========================================================
    else {
      const formData = await req.formData();
      const uploadedFile = formData.get('file');

      if (!(uploadedFile instanceof File)) {
        return NextResponse.json(
          {
            success: false,
            error: 'No valid file provided in form data.',
          },
          { status: 400 }
        );
      }

      file = uploadedFile;
      requestedFilename = uploadedFile.name || 'asset';

      const formAlt = formData.get('alt');

      if (
        typeof formAlt === 'string' &&
        formAlt.trim()
      ) {
        alt = formAlt.trim().slice(0, 300);
      }
    }

    // =========================================================
    // BASIC VALIDATION
    // =========================================================
    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: 'No file provided.',
        },
        { status: 400 }
      );
    }

    const mimeType = (
      file.type || 'application/octet-stream'
    ).toLowerCase();

    if (!ALLOWED_TYPES.has(mimeType)) {
      return NextResponse.json(
        {
          success: false,
          error: `Unsupported image type: ${mimeType}`,
          allowedTypes: Array.from(ALLOWED_TYPES),
        },
        { status: 400 }
      );
    }

    if (file.size <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Uploaded file is empty.',
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: 'File is too large. Maximum size is 10 MB.',
        },
        { status: 413 }
      );
    }

    // =========================================================
    // R2 CONFIGURATION
    // =========================================================
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

    const bucketName = process.env.R2_BUCKET_NAME;
    const publicUrl = process.env.R2_PUBLIC_URL;

    if (
      !accountId ||
      !accessKeyId ||
      !secretAccessKey ||
      !bucketName ||
      !publicUrl
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Cloudflare R2 is not fully configured.',
          missing: {
            R2_ACCOUNT_ID: !accountId,
            R2_ACCESS_KEY_ID: !accessKeyId,
            R2_SECRET_ACCESS_KEY: !secretAccessKey,
            R2_BUCKET_NAME: !bucketName,
            R2_PUBLIC_URL: !publicUrl,
          },
        },
        { status: 500 }
      );
    }

    const r2 = getR2Client();

    if (!r2) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cloudflare R2 client could not be created.',
        },
        { status: 500 }
      );
    }

    // =========================================================
    // CREATE UNIQUE OBJECT KEY
    // =========================================================
    const safeFilename = cleanFilename(requestedFilename);

    const baseName = getBaseName(safeFilename);

    const extension = getExtension(mimeType);

    const dateFolder = new Date()
      .toISOString()
      .slice(0, 10);

    const uniqueId = crypto.randomUUID();

    const objectKey =
      `uploads/${dateFolder}/` +
      `${Date.now()}-${uniqueId}-${baseName}.${extension}`;

    // =========================================================
    // READ FILE
    // =========================================================
    const buffer = Buffer.from(
      await file.arrayBuffer()
    );

    if (!buffer.length) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unable to read uploaded file.',
        },
        { status: 400 }
      );
    }

    // =========================================================
    // UPLOAD TO CLOUDFLARE R2
    // =========================================================
    await r2.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
        Body: buffer,
        ContentLength: buffer.length,
        ContentType: mimeType,
        CacheControl:
          'public, max-age=31536000, immutable',
        Metadata: {
          alt: alt.slice(0, 300),
          uploadedby: SITE_OWNER_EMAIL,
        },
      })
    );

    // =========================================================
    // FINAL PUBLIC URL
    // =========================================================
    const normalizedPublicUrl =
      normalizePublicUrl(publicUrl);

    const finalUrl =
      `${normalizedPublicUrl}/${objectKey}`;

    // =========================================================
    // RESPONSE
    // =========================================================
    return NextResponse.json({
      success: true,

      url: finalUrl,

      publicUrl: finalUrl,

      storage: 'cloudflare-r2',

      filename: safeFilename,

      key: objectKey,

      objectKey,

      contentType: mimeType,

      size: buffer.length,

      alt,
    });
  } catch (error: unknown) {
    console.error(
      'Admin asset upload failed:',
      error
    );

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