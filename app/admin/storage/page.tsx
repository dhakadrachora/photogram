'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { HardDrive, Upload, ExternalLink, Copy, Check, Folder, RefreshCw, Loader2 } from 'lucide-react';
import { adminFetch, adminUploadFile } from '@/lib/admin/api';
import { useToast } from '@/components/admin/Toast';

interface StorageFile {
  name: string;
  id?: string;
  created_at?: string;
  metadata?: Record<string, any>;
  publicUrl?: string;
}

export default function AdminStoragePage() {
  const { success, error: toastError } = useToast();
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState('battles');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const folders = ['battles', 'news', 'people', 'business', 'gallery', 'videos', 'media'];

  const fetchStorageFiles = useCallback(async (folder: string) => {
    setIsLoading(true);
    const res = await adminFetch(`/api/admin/upload?folder=${folder}`);
    setIsLoading(false);

    if (res.success && res.files) {
      setFiles(res.files);
    } else {
      toastError(res.error || 'Failed to list bucket files');
    }
  }, [toastError]);

  useEffect(() => {
    fetchStorageFiles(selectedFolder);
  }, [fetchStorageFiles, selectedFolder]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await adminUploadFile(file, selectedFolder || 'media');
      if (res.success) {
        success('File uploaded to storage bucket successfully');
        fetchStorageFiles(selectedFolder);
      } else {
        toastError(res.error || 'Upload failed');
      }
    } catch (err: any) {
      toastError(err?.message || 'Upload error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopyLink = (url?: string) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    success('Public URL copied to clipboard');
    setTimeout(() => setCopiedUrl(null), 2500);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-white tracking-tight">Supabase Cloud Storage Explorer</h2>
          <p className="text-xs text-slate-400">
            Inspect bucket assets, copy persistent public URLs, and upload verified media.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchStorageFiles(selectedFolder)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Refresh list"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <label className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 cursor-pointer transition-all active:scale-95 shrink-0">
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            <span>{isUploading ? 'Uploading...' : 'Direct Upload'}</span>
            <input type="file" accept="image/*" onChange={handleUpload} className="hidden" disabled={isUploading} />
          </label>
        </div>
      </div>

      {/* Bucket Details Card */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <HardDrive className="h-5 w-5" />
          </div>
          <div>
            <div className="font-bold text-white">Active Bucket: battle-image</div>
            <div className="text-slate-400 text-[11px]">Access Policy: Public CDN Reads • Authenticated Admin Writes</div>
          </div>
        </div>

        {/* Folder tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {[
            { label: 'All Media', value: '' },
            { label: 'Battles', value: 'battles' },
            { label: 'News', value: 'news' },
            { label: 'Gallery', value: 'gallery' },
            { label: 'People', value: 'people' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setSelectedFolder(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                selectedFolder === f.value
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Storage Files Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-slate-900 border border-slate-800" />
          ))}
        </div>
      ) : files.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-xs">
          No files found in this folder.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {files.map((file) => (
            <div
              key={file.name}
              className="rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 p-3 flex flex-col justify-between space-y-2 shadow-md group hover:border-slate-700 transition-colors"
            >
              <div className="aspect-video w-full rounded-xl bg-slate-950 overflow-hidden flex items-center justify-center border border-slate-800/80">
                {file.publicUrl ? (
                  <img src={file.publicUrl} alt={file.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                ) : (
                  <Folder className="h-8 w-8 text-amber-500/60" />
                )}
              </div>

              <div className="space-y-0.5">
                <div className="font-bold text-white text-xs truncate" title={file.name}>
                  {file.name}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {file.created_at ? new Date(file.created_at).toLocaleDateString('hi-IN') : 'Cloud Asset'}
                </div>
              </div>

              {file.publicUrl && (
                <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800/60">
                  <button
                    onClick={() => handleCopyLink(file.publicUrl)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition-colors"
                  >
                    {copiedUrl === file.publicUrl ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedUrl === file.publicUrl ? 'Copied' : 'Copy URL'}</span>
                  </button>
                  <a
                    href={file.publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="Open in new tab"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
