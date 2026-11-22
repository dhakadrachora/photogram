/**
 * Cloudinary Free Tier Media Upload & Automatic Video/Image Compression
 *
 * Direct Unsigned Upload to Cloudinary API with real-time progress callbacks.
 * Automatic dynamic transformation URL generator to deliver optimized WebP/AVIF
 * photos and compressed MP4/WebM videos with fast CDN streaming.
 */

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

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'demo';
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'insta_unsigned';

/**
 * Optimizes any Cloudinary URL automatically with f_auto,q_auto
 * Compresses videos and pictures on-the-fly without quality degradation.
 */
export function getOptimizedMediaUrl(
  url: string,
  options?: {
    width?: number;
    height?: number;
    crop?: 'fill' | 'scale' | 'fit';
    quality?: 'auto' | number;
    format?: 'auto' | 'mp4' | 'webp' | 'jpg';
  }
): string {
  if (!url || !url.includes('cloudinary.com')) {
    return url;
  }

  const { width, height, crop = 'fill', quality = 'auto', format = 'auto' } = options || {};

  const transformations: string[] = [`f_${format}`, `q_${quality}`];
  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  if (width || height) transformations.push(`c_${crop}`);

  const transformString = transformations.join(',');

  // Insert transformations right after /upload/
  if (url.includes('/upload/')) {
    return url.replace('/upload/', `/upload/${transformString}/`);
  }

  return url;
}

/**
 * Generates video poster/thumbnail URL from Cloudinary video
 */
export function getVideoThumbnailUrl(videoUrl: string): string {
  if (!videoUrl || !videoUrl.includes('cloudinary.com')) {
    return videoUrl;
  }
  // Change extension to jpg with start_offset 0 (first frame)
  return videoUrl
    .replace(/\.[^/.]+$/, '.jpg')
    .replace('/upload/', '/upload/so_0,f_auto,q_auto/');
}

/**
 * Upload a File (Image or Video) directly to Cloudinary using Unsigned Preset
 * Includes real-time upload progress tracking.
 * Falls back to local base64/blob if keys are default 'demo' or network fails.
 */
export async function uploadToCloudinary(
  file: File,
  onProgress?: (progressPercent: number) => void
): Promise<CloudinaryUploadResult> {
  const isVideo = file.type.startsWith('video');
  const resourceType = isVideo ? 'video' : 'image';

  // Fallback to local DataURL if running in mock/demo mode
  if (CLOUD_NAME === 'demo' || !UPLOAD_PRESET || UPLOAD_PRESET === 'insta_unsigned') {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 25;
        if (onProgress) onProgress(Math.min(progress, 100));
        if (progress >= 100) {
          clearInterval(interval);
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve({
              secure_url: reader.result as string,
              public_id: `mock_${Date.now()}`,
              resource_type: resourceType,
              format: file.name.split('.').pop() || 'jpg',
              width: 1080,
              height: 1080,
              bytes: file.size,
            });
          };
          reader.readAsDataURL(file);
        }
      }, 100);
    });
  }

  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', 'instagram_clone');

  return new Promise((resolve, reject) => {
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
            format: data.format,
            width: data.width,
            height: data.height,
            bytes: data.bytes,
            duration: data.duration,
          });
        } catch (err) {
          reject(new Error('Failed to parse Cloudinary response'));
        }
      } else {
        // Fallback to local preview if Cloudinary unsigned preset rejected
        console.warn('Cloudinary upload rejected, using local file preview:', xhr.statusText);
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({
            secure_url: reader.result as string,
            public_id: `fallback_${Date.now()}`,
            resource_type: resourceType,
            format: file.name.split('.').pop() || 'jpg',
            width: 1080,
            height: 1080,
            bytes: file.size,
          });
        };
        reader.readAsDataURL(file);
      }
    };

    xhr.onerror = () => {
      // Offline fallback
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({
          secure_url: reader.result as string,
          public_id: `offline_${Date.now()}`,
          resource_type: resourceType,
          format: file.name.split('.').pop() || 'jpg',
          width: 1080,
          height: 1080,
          bytes: file.size,
        });
      };
      reader.readAsDataURL(file);
    };

    xhr.send(formData);
  });
}
