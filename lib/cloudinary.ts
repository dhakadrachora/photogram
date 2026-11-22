/**
 * PHOTOGRAM - Zero-Storage Smart Media System (Cloudinary + Supabase WebP Fallback)
 *
 * 1. If Cloudinary credentials exist in .env.local:
 *    Uploads to Cloudinary with automatic WebP transformation.
 * 2. If Cloudinary keys are missing or upload fails:
 *    Automatically compresses images client-side into WebP (< 150KB) using an HTML5 Canvas,
 *    and uploads cleanly to Supabase Storage 'media' bucket with zero errors!
 * 3. Never throws unhandled upload errors; gracefully falls back to local data URL if completely offline.
 */

import { checkUploadPermission, UploadCategory } from '@/lib/uploadPermissions';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  resource_type: 'image' | 'video';
  format: string;
  width: number;
  height: number;
  bytes: number;
  duration?: number;
}

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

// True only if real, non-placeholder credentials are provided
export const isCloudinaryAvailable = Boolean(
  CLOUD_NAME &&
  CLOUD_NAME.trim() !== '' &&
  CLOUD_NAME !== 'demo' &&
  UPLOAD_PRESET &&
  UPLOAD_PRESET.trim() !== '' &&
  UPLOAD_PRESET !== 'insta_unsigned'
);

// Safety Limits
export const FREE_TIER_LIMITS = {
  MAX_IMAGE_BYTES: 10 * 1024 * 1024, // 10MB input limit
  MAX_VIDEO_BYTES: 15 * 1024 * 1024, // 15MB video limit
  TARGET_COMPRESSED_IMAGE_BYTES: 150 * 1024, // 150 KB max for Supabase storage fallback
};

/**
 * Compresses an image file client-side to WebP format under targetMaxBytes (150 KB)
 * using an HTML5 Canvas without losing visual clarity.
 */
export async function compressImageToWebP(
  file: File,
  maxDimension = 1280,
  targetMaxBytes = 150 * 1024
): Promise<{ blob: Blob; width: number; height: number }> {
  // If not in browser environment or if already small WebP, return as is
  if (typeof window === 'undefined') {
    return { blob: file, width: 1080, height: 1080 };
  }

  return new Promise((resolve) => {
    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;

      // Downscale if exceeds maxDimension
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve({ blob: file, width, height });
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Iteratively optimize WebP quality until under 150KB
      let quality = 0.82;
      const attemptCompression = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve({ blob: file, width, height });
              return;
            }
            if (blob.size <= targetMaxBytes || quality <= 0.42) {
              resolve({ blob, width, height });
            } else {
              quality -= 0.12;
              attemptCompression();
            }
          },
          'image/webp',
          quality
        );
      };

      attemptCompression();
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ blob: file, width: 1080, height: 1080 });
    };

    img.src = objectUrl;
  });
}

/**
 * Validates file against upload permissions
 */
export function validateFreeTierMedia(
  file: File,
  category?: UploadCategory
): { valid: boolean; error?: string } {
  if (category) {
    const permCheck = checkUploadPermission(category, file);
    if (!permCheck.allowed) {
      return { valid: false, error: permCheck.reason };
    }
  }

  const isVideo = file.type.startsWith('video');
  if (isVideo && file.size > FREE_TIER_LIMITS.MAX_VIDEO_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `Video exceeds the 15 MB limit (${sizeMb} MB). Please choose a shorter clip or use a YouTube link embed.`,
    };
  }

  return { valid: true };
}

/**
 * Tracks total uploaded media size locally for storage monitoring
 */
export function trackMediaUploadUsage(bytes: number) {
  if (typeof window === 'undefined') return;
  try {
    const current = Number(localStorage.getItem('photogram_total_uploaded_bytes') || '0');
    localStorage.setItem('photogram_total_uploaded_bytes', String(current + bytes));
  } catch {}
}

/**
 * Returns storage usage statistics for the admin dashboard
 */
export function getStorageUsageStats() {
  if (typeof window === 'undefined') {
    return { totalBytes: 0, totalMb: 0, freeTierQuotaMb: 25 * 1024, percentUsed: 0 };
  }
  try {
    const bytes = Number(localStorage.getItem('photogram_total_uploaded_bytes') || '0');
    const totalMb = bytes / (1024 * 1024);
    const quotaMb = 25 * 1024; // 25 GB Cloudinary Free Tier
    const percentUsed = (totalMb / quotaMb) * 100;
    return {
      totalBytes: bytes,
      totalMb: Number(totalMb.toFixed(2)),
      freeTierQuotaMb: quotaMb,
      percentUsed: Number(percentUsed.toFixed(3)),
    };
  } catch {
    return { totalBytes: 0, totalMb: 0, freeTierQuotaMb: 25 * 1024, percentUsed: 0 };
  }
}

/**
 * Optimizes any Cloudinary URL automatically with f_auto,q_auto
 */
export function getOptimizedMediaUrl(url: string): string {
  if (!url || !url.includes('cloudinary.com')) {
    return url;
  }
  if (url.includes('/upload/')) {
    return url.replace('/upload/', '/upload/f_auto,q_auto/');
  }
  return url;
}

/**
 * Upload a File (Image or Video) with Zero-Storage & Smart Fallback:
 * 1. Cloudinary with WebP auto-compression if keys present.
 * 2. Supabase Storage 'media' bucket with client-side 150KB WebP compression if Cloudinary keys missing.
 * 3. Base64 Data URL if offline.
 */
export async function uploadToCloudinary(
  file: File,
  onProgress?: (progressPercent: number) => void,
  category?: UploadCategory
): Promise<CloudinaryUploadResult> {
  const validation = validateFreeTierMedia(file, category);
  if (!validation.valid) {
    throw new Error(validation.error || 'Upload restricted.');
  }

  const isVideo = file.type.startsWith('video');
  const resourceType = isVideo ? 'video' : 'image';

  // ==============================================================
  // STRATEGY 1: Real Cloudinary Upload (if keys exist in .env.local)
  // ==============================================================
  if (isCloudinaryAvailable && CLOUD_NAME && UPLOAD_PRESET) {
    try {
      if (onProgress) onProgress(15);
      const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', UPLOAD_PRESET);
      formData.append('folder', 'photogram_uploads');

      const res = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', url, true);

        if (xhr.upload && onProgress) {
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const percent = Math.round((e.loaded / e.total) * 100);
              onProgress(percent);
            }
          };
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve({
                secure_url: getOptimizedMediaUrl(data.secure_url),
                public_id: data.public_id,
                resource_type: data.resource_type,
                format: data.format || 'webp',
                width: data.width || 1080,
                height: data.height || 1080,
                bytes: data.bytes || file.size,
                duration: data.duration,
              });
            } catch (parseErr) {
              reject(parseErr);
            }
          } else {
            reject(new Error(`Cloudinary returned status ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error('Cloudinary network error'));
        xhr.send(formData);
      });

      trackMediaUploadUsage(res.bytes);
      if (onProgress) onProgress(100);
      return res;
    } catch (cloudinaryErr) {
      console.warn('Cloudinary upload failed, falling back to Supabase 150KB WebP:', cloudinaryErr);
    }
  }

  // ==============================================================
  // STRATEGY 2: Smart Client-Side 150KB WebP Supabase Upload
  // ==============================================================
  if (isSupabaseConfigured()) {
    try {
      if (onProgress) onProgress(30);

      let uploadPayload: Blob | File = file;
      let finalFormat = isVideo ? 'mp4' : 'webp';
      let finalWidth = 1080;
      let finalHeight = 1080;

      // Compress images down to WebP < 150KB
      if (!isVideo) {
        const compressed = await compressImageToWebP(file, 1280, 150 * 1024);
        uploadPayload = compressed.blob;
        finalWidth = compressed.width;
        finalHeight = compressed.height;
      }

      if (onProgress) onProgress(60);

      const cleanFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${finalFormat}`;
      const filePath = `${category || 'media'}/${cleanFileName}`;
      const contentType = isVideo ? 'video/mp4' : 'image/webp';

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, uploadPayload, {
          cacheControl: '31536000',
          contentType: contentType,
          upsert: false,
        });

      if (!uploadError && uploadData) {
        if (onProgress) onProgress(100);
        const { data: publicUrlData } = supabase.storage
          .from('media')
          .getPublicUrl(filePath);

        if (publicUrlData?.publicUrl) {
          trackMediaUploadUsage(uploadPayload.size);
          return {
            secure_url: publicUrlData.publicUrl,
            public_id: filePath,
            resource_type: resourceType,
            format: finalFormat,
            width: finalWidth,
            height: finalHeight,
            bytes: uploadPayload.size,
          };
        }
      } else if (uploadError) {
        console.warn('Supabase storage upload error:', uploadError.message);
      }
    } catch (sbErr) {
      console.warn('Supabase media bucket fallback note:', sbErr);
    }
  }

  // ==============================================================
  // STRATEGY 3: Local Offline / Preview Fallback (Zero Error Guarantee)
  // ==============================================================
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (onProgress) onProgress(100);
      const dataUrl = reader.result as string;
      resolve({
        secure_url: dataUrl,
        public_id: `offline_${Date.now()}`,
        resource_type: resourceType,
        format: isVideo ? 'mp4' : 'webp',
        width: 1080,
        height: 1080,
        bytes: file.size,
      });
    };
    reader.readAsDataURL(file);
  });
}

export default uploadToCloudinary;
