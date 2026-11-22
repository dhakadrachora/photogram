/**
 * PHOTOGRAM - Upload Permissions & Temporary Restriction Management
 *
 * Configurable system for toggling upload capabilities across the app.
 * By default:
 * - Image uploads are ENABLED (profile, single post, carousel, photo story, chat photo).
 * - Video stories are ENABLED.
 * - Reels uploads are ENABLED with a 15 MB limit per user request.
 * - Video posts are ENABLED with a 15 MB limit.
 * - Every toggle can be reversed at any time via the Super Admin panel (/admin).
 */

export interface UploadPermissions {
  allow_profile_photos: boolean;
  allow_image_posts: boolean;
  allow_carousel_images: boolean;
  allow_photo_stories: boolean;
  allow_video_stories: boolean;
  allow_video_posts: boolean;
  allow_reels_uploads: boolean;
  allow_chat_images: boolean;
  allow_chat_videos: boolean;
}

export type UploadCategory = keyof UploadPermissions;

export const DEFAULT_UPLOAD_PERMISSIONS: UploadPermissions = {
  allow_profile_photos: true,
  allow_image_posts: true,
  allow_carousel_images: true,
  allow_photo_stories: true,
  allow_video_stories: true, // Video stories active
  allow_video_posts: true, // Video posts active (15 MB limit)
  allow_reels_uploads: true, // Reels uploads ACTIVE (15 MB limit)
  allow_chat_images: true,
  allow_chat_videos: true,
};

const STORAGE_KEY = 'photogram_upload_permissions';

/**
 * Get current upload permissions from storage or fallback to defaults
 */
export function getUploadPermissions(): UploadPermissions {
  if (typeof window === 'undefined') {
    return DEFAULT_UPLOAD_PERMISSIONS;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Initialize with defaults if first time
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_UPLOAD_PERMISSIONS));
      return DEFAULT_UPLOAD_PERMISSIONS;
    }
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_UPLOAD_PERMISSIONS,
      ...parsed,
    };
  } catch (err) {
    console.warn('Error reading upload permissions from localStorage:', err);
    return DEFAULT_UPLOAD_PERMISSIONS;
  }
}

/**
 * Update a single upload permission and notify subscribers
 */
export function updateUploadPermission(
  category: UploadCategory,
  value: boolean
): UploadPermissions {
  if (typeof window === 'undefined') return DEFAULT_UPLOAD_PERMISSIONS;

  try {
    const current = getUploadPermissions();
    const updated: UploadPermissions = {
      ...current,
      [category]: value,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Dispatch global event for instant reactive updates in open pages/modals
    window.dispatchEvent(
      new CustomEvent('photogram_permissions_changed', { detail: updated })
    );

    return updated;
  } catch (err) {
    console.error('Failed to update upload permission:', err);
    return DEFAULT_UPLOAD_PERMISSIONS;
  }
}

/**
 * Reset all permissions back to default settings
 */
export function resetUploadPermissions(): UploadPermissions {
  if (typeof window === 'undefined') return DEFAULT_UPLOAD_PERMISSIONS;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_UPLOAD_PERMISSIONS));
    window.dispatchEvent(
      new CustomEvent('photogram_permissions_changed', {
        detail: DEFAULT_UPLOAD_PERMISSIONS,
      })
    );
    return DEFAULT_UPLOAD_PERMISSIONS;
  } catch {
    return DEFAULT_UPLOAD_PERMISSIONS;
  }
}

/**
 * Validates if an upload is allowed based on category and file
 * Enforces a strict 15 MB limit for video clips (Reels, stories, posts).
 */
export function checkUploadPermission(
  category: UploadCategory,
  file?: File
): { allowed: boolean; reason?: string } {
  const permissions = getUploadPermissions();
  const isAllowed = permissions[category];

  if (!isAllowed) {
    switch (category) {
      case 'allow_video_posts':
        return {
          allowed: false,
          reason: 'Video post uploads are currently paused in admin settings.',
        };
      case 'allow_reels_uploads':
        return {
          allowed: false,
          reason: 'Reels uploads are currently paused in admin settings.',
        };
      case 'allow_chat_videos':
        return {
          allowed: false,
          reason: 'Video attachments in chat are currently paused.',
        };
      case 'allow_image_posts':
        return { allowed: false, reason: 'Image post uploads are disabled.' };
      case 'allow_carousel_images':
        return { allowed: false, reason: 'Carousel uploads are disabled.' };
      case 'allow_photo_stories':
        return { allowed: false, reason: 'Photo stories upload is disabled.' };
      case 'allow_video_stories':
        return { allowed: false, reason: 'Video stories upload is disabled.' };
      case 'allow_chat_images':
        return { allowed: false, reason: 'Image sharing in chat is disabled.' };
      case 'allow_profile_photos':
        return { allowed: false, reason: 'Profile photo upload is disabled.' };
      default:
        return { allowed: false, reason: 'This upload category is disabled.' };
    }
  }

  // Enforce 15 MB size limit on video uploads
  if (file && file.type.startsWith('video')) {
    const MAX_VIDEO_BYTES = 15 * 1024 * 1024; // 15 MB Limit
    if (file.size > MAX_VIDEO_BYTES) {
      const mbSize = (file.size / (1024 * 1024)).toFixed(1);
      return {
        allowed: false,
        reason: `Video size (${mbSize} MB) exceeds the 15 MB limit. Please select a video under 15 MB for smooth mobile playback.`,
      };
    }
  }

  return { allowed: true };
}
