'use client';

import React from 'react';
import { ErrorState } from '@/components/admin/ErrorState';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="py-8">
      <ErrorState
        title="Storage Module Error"
        error={error?.message || 'Failed to inspect cloud storage resources'}
        onRetry={() => reset()}
      />
    </div>
  );
}
