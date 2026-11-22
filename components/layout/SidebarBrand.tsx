'use client';

import React from 'react';
import Link from 'next/link';
import { Camera } from 'lucide-react';

export function SidebarBrand() {
  return (
    <Link href="/" className="flex items-center gap-3 px-2 py-3 group">
      {/* Desktop expanded logo */}
      <span className="hidden xl:inline font-serif font-black text-2xl tracking-tight text-white dark:text-white light:text-black">
        Photogram
      </span>
      {/* Collapsed small icon */}
      <div className="xl:hidden p-2 rounded-xl text-white dark:text-white light:text-black group-hover:scale-110 transition-transform">
        <Camera className="w-7 h-7 stroke-[1.8]" />
      </div>
    </Link>
  );
}

export default SidebarBrand;
