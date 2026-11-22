'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export function SidebarBrand() {
  return (
    <Link href="/" className="flex items-center gap-3 px-2 py-3 group select-none">
      {/* App Icon */}
      <div className="w-8 h-8 rounded-xl overflow-hidden shadow ring-1 ring-white/10 shrink-0 group-hover:scale-105 transition-transform">
        <Image
          src="/app-logo.png"
          alt="Photogram"
          width={32}
          height={32}
          priority
          className="object-cover w-full h-full"
        />
      </div>

      {/* Desktop expanded logo text */}
      <span className="hidden xl:inline font-serif font-black text-2xl tracking-tight text-white dark:text-white light:text-black">
        Photogram
      </span>
    </Link>
  );
}

export default SidebarBrand;
