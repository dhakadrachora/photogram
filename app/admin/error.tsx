'use client';

import React, { useEffect } from 'react';
import { ErrorState } from '@/components/admin/ErrorState';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Admin Page Route Error]:', error);
  }, [error]);

  return (
    <div className="py-12">
      <ErrorState
        title="Administrative Module Error"
        error={error?.message || 'Something went wrong while loading this administrative view.'}
        onRetry={() => reset()}
      />
    </div>
  );
}
