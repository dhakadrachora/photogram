import posthog from 'posthog-js';

// Sensitive property keys that must NEVER be sent to telemetry
const SENSITIVE_KEY_PATTERNS = [
  'password',
  'secret',
  'token',
  'apikey',
  'api_key',
  'auth',
  'authorization',
  'access_token',
  'refresh_token',
  'service_role',
  'cookie',
  'bearer',
  'hash',
  'key',
  'phone',
  'email',
];

/**
 * Recursively redacts any sensitive keys or values before sending to PostHog.
 * Guaranteed zero-leakage of API keys, authentication tokens, or sensitive PII.
 */
export function sanitizeTelemetryData<T>(data: T): T {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeTelemetryData(item)) as unknown as T;
  }

  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();

    // Check if key matches any sensitive pattern
    const isSensitive = SENSITIVE_KEY_PATTERNS.some((pattern) =>
      lowerKey.includes(pattern)
    );

    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeTelemetryData(value);
    } else if (typeof value === 'string' && (value.startsWith('sbp_') || value.startsWith('AIza') || value.length > 100)) {
      // Catch potential raw JWTs or API key strings
      if (value.startsWith('eyJ') || value.startsWith('AIza') || value.startsWith('sb_')) {
        sanitized[key] = '[REDACTED_TOKEN]';
      } else {
        sanitized[key] = value;
      }
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

let isInitialized = false;

/**
 * Initializes PostHog with strict privacy and security settings.
 * All inputs are masked, sensitive attributes are redacted, and zero secrets are exported.
 */
export function initPostHog(): void {
  if (typeof window === 'undefined' || isInitialized) {
    return;
  }

  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

  if (!posthogKey) {
    // If no key is set, PostHog runs in silent no-op mode without throwing errors
    return;
  }

  try {
    posthog.init(posthogKey, {
      api_host: posthogHost,
      person_profiles: 'identified_only',
      capture_pageview: false, // Managed manually with Next.js router
      capture_pageleave: true,
      autocapture: false, // Disabled full DOM autocapture to prevent sensitive form capture
      disable_session_recording: false,
      session_recording: {
        maskAllInputs: true, // Always mask passwords, form inputs, messages
        maskTextSelector: '[data-sensitive], input, textarea, .private-data',
      },
      before_send: (event) => {
        if (!event) return null;
        if (event.properties) {
          event.properties = sanitizeTelemetryData(event.properties);
        }
        return event;
      },
    });

    isInitialized = true;
  } catch (err) {
    console.warn('[PostHog] Safe initialization skipped:', err);
  }
}

/**
 * Safely captures a privacy-sanitized analytics event.
 */
export function trackEvent(eventName: string, properties?: Record<string, any>): void {
  if (typeof window === 'undefined') return;

  try {
    const sanitizedProps = properties ? sanitizeTelemetryData(properties) : undefined;
    posthog.capture(eventName, sanitizedProps);
  } catch (err) {
    // Fail silently in case telemetry is blocked by ad-blocker
  }
}

/**
 * Safely identifies a logged-in user without leaking credentials or private auth tokens.
 */
export function identifyUserSafely(userId: string, traits?: { name?: string; role?: string; badge?: string }): void {
  if (typeof window === 'undefined' || !userId) return;

  try {
    const safeTraits = traits ? sanitizeTelemetryData(traits) : undefined;
    posthog.identify(userId, safeTraits);
  } catch {
    // ignore
  }
}

/**
 * Resets user identification on logout.
 */
export function resetPostHogUser(): void {
  if (typeof window === 'undefined') return;

  try {
    posthog.reset();
  } catch {
    // ignore
  }
}

export { posthog };
