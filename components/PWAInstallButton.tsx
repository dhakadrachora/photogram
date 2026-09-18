'use client';

import React, { useState } from 'react';
import { Download, RefreshCw, CheckCircle, Share, PlusSquare, X } from 'lucide-react';
import { usePWA } from '@/lib/usePWA';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'header' | 'hero' | 'pill' | 'profile';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'hero',
}) => {
  const { isInstalled, canInstall, isIOS, installApp, updateAvailable, applyUpdate, checkForUpdates } = usePWA();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);

  const handleInstall = async () => {
    const result = await installApp();
    if (result === 'ios') {
      setShowIOSModal(true);
    }
  };

  const handleCheckUpdate = async () => {
    setCheckingUpdate(true);
    setUpdateMsg(null);
    const hasUpdate = await checkForUpdates();
    setCheckingUpdate(false);
    if (!hasUpdate && !updateAvailable) {
      setUpdateMsg('ऐप पहले से ताज़ा वर्ज़न पर है!');
      setTimeout(() => setUpdateMsg(null), 3000);
    }
  };

  // If there is an update waiting, prioritize update action!
  if (updateAvailable) {
    return (
      <button
        onClick={applyUpdate}
        id="pwa-action-update-btn"
        className={`bg-gradient-to-r from-amber-500 to-[#C25E29] hover:from-amber-600 hover:to-[#A54018] text-white font-bold text-xs rounded-full shadow-md animate-pulse flex items-center justify-center gap-1.5 transition-all ${
          variant === 'header'
            ? 'px-2.5 py-1 text-[11px]'
            : variant === 'pill'
            ? 'px-3 py-1.5 text-xs'
            : 'w-full sm:w-auto flex-1 py-2.5 px-4 text-xs'
        } ${className}`}
        type="button"
        title="नया अपडेट उपलब्ध है!"
      >
        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        <span>⚡ अपडेट करें (Update Now)</span>
      </button>
    );
  }

  // If already installed and on profile view, offer "Check for Updates" button
  if (isInstalled && variant === 'profile') {
    return (
      <div className="flex flex-col gap-1 w-full">
        <button
          onClick={handleCheckUpdate}
          disabled={checkingUpdate}
          className="w-full py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl border border-stone-200 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${checkingUpdate ? 'animate-spin text-[#C25E29]' : 'text-stone-500'}`} />
          <span>{checkingUpdate ? 'जाँच हो रही है...' : '🔄 नए अपडेट की जाँच करें (Check Updates)'}</span>
        </button>
        {updateMsg && (
          <p className="text-[11px] text-emerald-600 font-medium text-center">{updateMsg}</p>
        )}
      </div>
    );
  }

  // If already installed, hide install button
  if (isInstalled) {
    if (variant === 'header') {
      return (
        <div className="hidden sm:flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
          <CheckCircle className="h-3 w-3 text-emerald-600" />
          <span>Installed</span>
        </div>
      );
    }
    return null;
  }

  // If installable or iOS
  return (
    <>
      <button
        onClick={handleInstall}
        id={`pwa-install-btn-${variant}`}
        className={`${
          variant === 'header'
            ? 'bg-amber-100 hover:bg-amber-200 text-[#C25E29] border border-amber-300 px-2.5 py-1 rounded-full text-[11px] font-bold shadow-xs'
            : variant === 'pill'
            ? 'bg-[#C25E29] hover:bg-[#A54018] text-white px-3.5 py-1.5 rounded-full text-xs font-bold shadow-sm'
            : 'w-full sm:w-auto flex-1 py-2.5 px-4 bg-[#C25E29] hover:bg-[#A54018] active:scale-[0.98] transition-all text-white rounded-full font-semibold text-xs tracking-wide shadow-md shadow-amber-900/20'
        } flex items-center justify-center gap-1.5 ${className}`}
        type="button"
        title="अपने मोबाइल में ऐप इंस्टॉल करें"
      >
        <Download className="h-3.5 w-3.5 shrink-0" />
        <span>{isIOS ? 'iPhone पर इंस्टॉल' : '📲 ऐप इंस्टॉल करें (Install App)'}</span>
      </button>

      {/* iOS Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl border border-stone-200 text-stone-900">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-sm font-bold text-stone-900">iPhone / iPad पर ऐप इंस्टॉल करें</h3>
              <button
                onClick={() => setShowIOSModal(false)}
                className="w-7 h-7 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center hover:bg-stone-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 space-y-2.5 text-xs text-stone-700">
              <p>1. Safari ब्राउज़र में नीचे शेयर आइकन <Share className="h-3.5 w-3.5 inline text-blue-600" /> दबाएं।</p>
              <p>2. नीचे स्क्रॉल करके <PlusSquare className="h-3.5 w-3.5 inline text-stone-700" /> <strong>&apos;Add to Home Screen&apos;</strong> पर टैप करें।</p>
              <p>3. ऊपर कोने में <strong>&apos;Add&apos;</strong> दबाएं।</p>
            </div>
            <button
              onClick={() => setShowIOSModal(false)}
              className="mt-4 w-full py-2 bg-stone-900 text-white text-xs font-bold rounded-xl"
            >
              समझ गया (Close)
            </button>
          </div>
        </div>
      )}
    </>
  );
};
