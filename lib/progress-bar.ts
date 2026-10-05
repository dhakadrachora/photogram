/**
 * Global Top Progress Bar Event Controller
 * Safe for SSR and client-side usage.
 */

export function startProgressBar(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app:progress:start'));
  }
}

export function doneProgressBar(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app:progress:done'));
  }
}

export function setProgressBar(percent: number): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('app:progress:set', { detail: { percent } })
    );
  }
}
