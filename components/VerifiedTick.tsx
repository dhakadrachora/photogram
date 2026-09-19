'use client';

import React from 'react';

interface VerifiedTickProps {
  className?: string;
  size?: number;
}

export function VerifiedTick({ className = 'inline-block', size = 15 }: VerifiedTickProps) {
  return (
    <span
      className={`inline-flex items-center justify-center align-middle shrink-0 ${className}`}
      title="Verified Blue Tick"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-sm"
      >
        <circle cx="12" cy="12" r="10" fill="#0284c7" />
        <path
          d="M8 12.2L10.7 14.9L16 9.6"
          stroke="white"
          strokeWidth="2.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
