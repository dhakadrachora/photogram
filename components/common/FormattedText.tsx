'use client';

import React from 'react';
import Link from 'next/link';

interface FormattedTextProps {
  text: string;
  className?: string;
}

/**
 * Parses captions and comments to turn #hashtags and @mentions into clickable links
 * Exactly like Instagram.
 */
export function FormattedText({ text, className = '' }: FormattedTextProps) {
  if (!text) return null;

  // Split by hashtags (#\w+) and mentions (@[\w.]+)
  const parts = text.split(/(#[a-zA-Z0-9_]+|@[a-zA-Z0-9_.]+)/g);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.startsWith('#')) {
          const tag = part.slice(1);
          return (
            <Link
              key={index}
              href={`/explore?q=${encodeURIComponent(tag)}`}
              className="text-[#0095f6] hover:underline font-medium inline-block mx-[1px]"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </Link>
          );
        }
        if (part.startsWith('@')) {
          const handle = part.slice(1);
          return (
            <Link
              key={index}
              href={`/explore?q=${encodeURIComponent(handle)}`}
              className="text-[#0095f6] hover:underline font-semibold inline-block mx-[1px]"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </Link>
          );
        }
        return part;
      })}
    </span>
  );
}

export default FormattedText;
