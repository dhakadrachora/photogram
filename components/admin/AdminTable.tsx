'use client';

import React from 'react';
import { EmptyState } from './EmptyState';
import { Loader2 } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  className?: string;
  render?: (item: T) => React.ReactNode;
}

interface AdminTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField?: keyof T;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onEmptyAction?: () => void;
  emptyActionLabel?: string;
}

export function AdminTable<T extends Record<string, any>>({
  columns,
  data,
  keyField = 'id',
  isLoading = false,
  emptyTitle,
  emptyDescription,
  onEmptyAction,
  emptyActionLabel,
}: AdminTableProps<T>) {
  if (!isLoading && (!data || data.length === 0)) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
      />
    );
  }

  return (
    <div className="relative overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
      {isLoading && (
        <div className="absolute inset-0 z-10 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 bg-slate-900/90 border border-slate-700 px-4 py-2 rounded-xl shadow-lg">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Updating...</span>
          </div>
        </div>
      )}

      <table className="w-full text-left border-collapse text-xs">
        <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={`px-4 py-3.5 ${col.className || ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
          {data.map((item, idx) => {
            const key = item[keyField] ? String(item[keyField]) : String(idx);
            return (
              <tr
                key={key}
                className="hover:bg-slate-800/40 transition-colors group"
              >
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-3.5 ${col.className || ''}`}>
                    {col.render ? col.render(item) : item[col.key]}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
