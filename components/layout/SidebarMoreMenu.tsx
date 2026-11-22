'use client';

import React from 'react';
import Link from 'next/link';
import { Moon, Sun, Bookmark, Settings, LogOut, Shield } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';

interface SidebarMoreMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SidebarMoreMenu({ isOpen, onClose }: SidebarMoreMenuProps) {
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();

  if (!isOpen) return null;

  return (
    <div
      className="absolute bottom-18 left-3 w-56 bg-[#1a1a1a] dark:bg-[#1a1a1a] light:bg-[#ffffff] border border-[#2e2e2e] dark:border-[#2e2e2e] light:border-[#dbdbdb] rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2"
      onClick={(e) => e.stopPropagation()}
    >
      <Link
        href="/profile"
        onClick={onClose}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-white dark:text-white light:text-black hover:bg-white/10 dark:hover:bg-white/10 light:hover:bg-black/5 transition-colors"
      >
        <Bookmark className="w-4 h-4" />
        <span>Saved</span>
      </Link>

      <button
        onClick={() => {
          toggleTheme();
          onClose();
        }}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-white dark:text-white light:text-black hover:bg-white/10 dark:hover:bg-white/10 light:hover:bg-black/5 transition-colors text-left"
      >
        {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-500" />}
        <span>Switch appearance ({theme === 'dark' ? 'Light' : 'Dark'})</span>
      </button>

      <Link
        href="/settings"
        onClick={onClose}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-white dark:text-white light:text-black hover:bg-white/10 dark:hover:bg-white/10 light:hover:bg-black/5 transition-colors"
      >
        <Settings className="w-4 h-4" />
        <span>Settings</span>
      </Link>

      <Link
        href="/admin"
        onClick={onClose}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-sky-400 hover:bg-sky-500/10 transition-colors"
      >
        <Shield className="w-4 h-4" />
        <span>Admin Panel</span>
      </Link>

      <div className="h-[1px] bg-white/10 dark:bg-white/10 light:bg-black/10 my-1" />

      <button
        onClick={() => {
          logout();
          onClose();
        }}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors text-left"
      >
        <LogOut className="w-4 h-4" />
        <span>Log out</span>
      </button>
    </div>
  );
}

export default SidebarMoreMenu;
