import React from 'react';
import Link from 'next/link';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#05070D] text-white">
      <div className="max-w-md w-full p-8 rounded-3xl bg-[#0B1220] border border-white/10 text-center space-y-4 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto text-3xl">
          🔍
        </div>
        <h2 className="text-2xl font-bold font-hindi">पेज नहीं मिला (404)</h2>
        <p className="text-xs text-slate-400 font-hindi">
          माफ़ कीजिए सा, यह पेज मौजूद नहीं है या हटा दिया गया है।
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl font-bold text-xs transition-all active:scale-95 shadow-md shadow-cyan-500/20"
        >
          <Home className="w-4 h-4" />
          <span>होम पेज पर लौटें</span>
        </Link>
      </div>
    </div>
  );
}
