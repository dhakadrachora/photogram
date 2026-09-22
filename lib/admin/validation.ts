export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateImageFile(file: File): ValidationResult {
  if (!file) {
    return { isValid: false, error: 'No file provided' };
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: `Invalid file format (${file.type}). Only JPG, PNG, WEBP, and GIF are allowed.`,
    };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return {
      isValid: false,
      error: `File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed size is 10MB.`,
    };
  }

  return { isValid: true };
}

export function validateRequiredText(value: string | undefined | null, fieldName: string, minLength = 1): ValidationResult {
  if (!value || typeof value !== 'string' || value.trim().length < minLength) {
    return {
      isValid: false,
      error: `${fieldName} is required and must have at least ${minLength} characters.`,
    };
  }
  return { isValid: true };
}

export function sanitizeText(text: string): string {
  if (!text) return '';
  return text.trim();
}
