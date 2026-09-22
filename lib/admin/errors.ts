export class AdminApiError extends Error {
  statusCode: number;
  details?: any;

  constructor(message: string, statusCode = 500, details?: any) {
    super(message);
    this.name = 'AdminApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function formatErrorMessage(err: unknown, fallback = 'An unexpected error occurred'): string {
  if (err instanceof Error) {
    return err.message;
  }
  if (typeof err === 'string') {
    return err;
  }
  if (err && typeof err === 'object' && 'error' in err) {
    return String((err as any).error);
  }
  return fallback;
}
