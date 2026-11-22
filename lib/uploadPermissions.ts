/**
 * PHOTOGRAM - Upload Permissions & Temporary Restriction Management
 *
 * Configurable system for toggling upload capabilities across the app.
 * By default:
 * - Image uploads are ENABLED (profile, single post, carousel, photo story, chat photo).
 * - Video stories are ENABLED (per explicit requirement).
 * - Video posts, Reels uploads, and Chat video attachments are DISABLED by default.
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
  allow_video_stories: true, // IMPORTANT: Video stories remain enabled
  allow_video_posts: false, // DISABLED by default (Temporary Restriction)
  allow_reels_uploads: false, // DISABLED by default (Temporary Restriction)
  allow_chat_images: true,
  allow_chat_videos: false, // DISABLED by default (Temporary Restriction)
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
 * Reset all permissions back to default temporary restrictions
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
          reason:
            'Normal video post uploads are temporarily paused by admin settings. Photo and carousel uploads are active.',
        };
      case 'allow_reels_uploads':
        return {
          allowed: false,
          reason:
            'Reels video uploads are temporarily paused by admin settings. Existing reels remain playable.',
        };
      case 'allow_chat_videos':
        return {
          allowed: false,
          reason:
            'Video attachments in chat are currently paused. Image sharing is active.',
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

  // Also check if user submitted a video file to a category where videos are restricted
  if (file && file.type.startsWith('video')) {
    if (category === 'allow_image_posts' || category === 'allow_carousel_images') {
      if (!permissions.allow_video_posts) {
        return {
          allowed: false,
          reason:
            'Video post uploads are temporarily disabled. Please upload photos instead.',
        };
      }
    }
    if (category === 'allow_chat_images' && !permissions.allow_chat_videos) {
      return {
        allowed: false,
        reason:
          'Video sharing in chat is temporarily paused. Please send photos only.',
      };
    }
  }

  return { allowed: true };
}
