'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

export interface ToolItem {
  id: string;
  title: string;
  description: string;
  category: 'Instagram' | 'YouTube' | 'Image' | 'Social' | 'Utility' | 'Other';
  icon: string;
  href: string;
  badge?: string;
  isPopular?: boolean;
}

export function ToolCard({ tool }: { tool: ToolItem }) {
  return (
    <Link
      href={tool.href}
      className="group relative flex flex-col justify-between p-5 rounded-2xl bg-[#0D1726] border border-white/10 hover:border-cyan-500/40 shadow-lg hover:shadow-cyan-500/10 transition-all duration-300 backdrop-blur-md"
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="w-12 h-12 rounded-2xl bg-[#070B14] border border-white/10 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform">
            {tool.icon}
          </div>

          <div className="flex items-center gap-1.5">
            {tool.badge && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                {tool.badge}
              </span>
            )}
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/5 text-slate-400">
              {tool.category}
            </span>
          </div>
        </div>

        <h3 className="font-bold text-base text-white group-hover:text-cyan-300 transition-colors font-hindi mb-1.5">
          {tool.title}
        </h3>

        <p className="text-xs text-slate-400 leading-relaxed font-hindi">
          {tool.description}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-cyan-400 group-hover:text-cyan-300 transition-colors">
        <span>टूल खोलें</span>
        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}
