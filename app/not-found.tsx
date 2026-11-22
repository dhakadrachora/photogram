import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-black text-white text-center">
      <div className="max-w-md w-full space-y-4">
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
          Sorry, this page isn&apos;t available.
        </h2>
        <p className="text-xs md:text-sm text-neutral-400 leading-relaxed">
          The link you followed may be broken, or the page may have been removed.{' '}
          <Link href="/" className="text-[#0095f6] hover:underline font-medium">
            Go back to Instagram.
          </Link>
        </p>
      </div>
    </div>
  );
}
