import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const SUPER_ADMIN_EMAIL = 'rohitdhakaddhoti143@gmail.com';

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });
}

async function requireSuperAdmin(
  req: NextRequest
): Promise<
  | {
      ok: true;
      user: { id: string; email?: string };
    }
  | {
      ok: false;
      response: NextResponse;
    }
> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      response: json(
        { error: 'Supabase is not configured.' },
        500
      ),
    };
  }

  const authorization = req.headers.get('authorization');
  const match = authorization?.match(/^Bearer\s+(.+)$/i);

  if (!match?.[1]) {
    return {
      ok: false,
      response: json(
        {
          error: 'Authentication required.',
          code: 'AUTH_REQUIRED',
        },
        401
      ),
    };
  }

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(match[1].trim());

    if (error || !user) {
      return {
        ok: false,
        response: json(
          {
            error: 'Invalid or expired login session.',
            code: 'AUTH_REQUIRED',
          },
          401
        ),
      };
    }

    if (
      user.email?.trim().toLowerCase() !==
      SUPER_ADMIN_EMAIL
    ) {
      return {
        ok: false,
        response: json(
          {
            error: 'Super Admin access required.',
            code: 'ADMIN_REQUIRED',
          },
          403
        ),
      };
    }

    return {
      ok: true,
      user: {
        id: user.id,
        email: user.email,
      },
    };
  } catch (error) {
    console.error(
      'R2 admin authentication error:',
      error
    );

    return {
      ok: false,
      response: json(
        {
          error: 'Authentication failed.',
        },
        401
      ),
    };
  }
}

function getEnv(
  name: string,
  aliases: string[] = []
) {
  for (const key of [name, ...aliases]) {
    const value = process.env[key]?.trim();

    if (value) {
      return value;
    }
  }

  return '';
}

function sanitizeFileName(name: string) {
  return name
    .normalize('NFKD')
    .replace(/[^\w.\-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function extensionFromType(type: string) {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/svg+xml': 'svg',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
  };

  return map[type] || 'bin';
}

export async function POST(
  req: NextRequest
): Promise<NextResponse> {
  const admin = await requireSuperAdmin(req);

  if (!admin.ok) {
    return admin.response;
  }

  const endpoint = getEnv(
    'R2_ENDPOINT',
    ['CLOUDFLARE_R2_ENDPOINT']
  );

  const accessKeyId = getEnv(
    'R2_ACCESS_KEY_ID',
    ['CLOUDFLARE_R2_ACCESS_KEY_ID']
  );

  const secretAccessKey = getEnv(
    'R2_SECRET_ACCESS_KEY',
    ['CLOUDFLARE_R2_SECRET_ACCESS_KEY']
  );

  const bucket = getEnv(
    'R2_BUCKET_NAME',
    [
      'CLOUDFLARE_R2_BUCKET',
      'CLOUDFLARE_R2_BUCKET_NAME',
    ]
  );

  const publicUrl = getEnv(
    'R2_PUBLIC_URL',
    [
      'CLOUDFLARE_R2_PUBLIC_URL',
      'NEXT_PUBLIC_R2_PUBLIC_URL',
    ]
  );

  if (
    !endpoint ||
    !accessKeyId ||
    !secretAccessKey ||
    !bucket ||
    !publicUrl
  ) {
    return json(
      {
        error:
          'Cloudflare R2 is not configured. Check R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME and R2_PUBLIC_URL.',
        code: 'R2_NOT_CONFIGURED',
      },
      500
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return json(
        {
          error: 'No file was provided.',
        },
        400
      );
    }

    if (file.size <= 0) {
      return json(
        {
          error: 'The uploaded file is empty.',
        },
        400
      );
    }

    const maxSize = 25 * 1024 * 1024;

    if (file.size > maxSize) {
      return json(
        {
          error: 'Maximum file size is 25 MB.',
        },
        413
      );
    }

    const allowedTypes = new Set([
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/svg+xml',
      'video/mp4',
      'video/webm',
    ]);

    if (!allowedTypes.has(file.type)) {
      return json(
        {
          error:
            'Unsupported file type. Allowed: JPG, PNG, WEBP, GIF, SVG, MP4, WEBM.',
        },
        415
      );
    }

    const folder = String(
      formData.get('folder') || 'uploads'
    )
      .replace(/\\/g, '/')
      .replace(/[^a-zA-Z0-9/_-]/g, '-')
      .replace(/^\/+|\/+$/g, '');

    const originalName = sanitizeFileName(
      file.name || ''
    );

    const safeName =
      originalName ||
      `upload.${extensionFromType(file.type)}`;

    const key = `${
      folder || 'uploads'
    }/${Date.now()}-${crypto.randomUUID()}-${safeName}`;

    const body = Buffer.from(
      await file.arrayBuffer()
    );

    const client = new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: file.type,
        ContentLength: body.length,
        CacheControl:
          'public, max-age=31536000, immutable',
      })
    );

    const base = publicUrl.replace(/\/+$/, '');

    const encodedKey = key
      .split('/')
      .map((part) => encodeURIComponent(part))
      .join('/');

    return json({
      success: true,
      key,
      url: `${base}/${encodedKey}`,
      fileName: file.name,
      contentType: file.type,
      size: file.size,
    });
  } catch (error: any) {
    console.error(
      'R2 upload error:',
      error
    );

    return json(
      {
        error:
          error?.message ||
          'Failed to upload file.',
        code: 'R2_UPLOAD_FAILED',
      },
      500
    );
  }
}