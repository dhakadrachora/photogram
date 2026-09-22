import Link from 'next/link';
import { ArrowLeft, FileQuestion } from 'lucide-react';

export default function AdminNotFound() {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center my-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
      <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
        <FileQuestion className="h-8 w-8" />
      </div>
      <h2 className="text-lg font-bold text-white tracking-tight">Admin Section Not Found</h2>
      <p className="text-xs text-slate-400 max-w-sm">
        The requested administrative route or module does not exist or has been relocated.
      </p>
      <Link
        href="/admin"
        className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-md active:scale-95"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Return to Dashboard</span>
      </Link>
    </div>
  );
}
