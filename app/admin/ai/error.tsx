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
        title="Admin AI Assistant Error"
        error={error?.message || 'Failed to interact with the AI assistant'}
        onRetry={() => reset()}
      />
    </div>
  );
}
