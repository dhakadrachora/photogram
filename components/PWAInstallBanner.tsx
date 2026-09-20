'use client';

import React, { useEffect, useState } from 'react';
import {
  Download,
  RefreshCw,
  X,
  Share,
  PlusSquare,
  Sparkles,
  CheckCircle2,
  WifiOff,
} from 'lucide-react';
import { usePWA } from '@/lib/usePWA';

interface PWAInstallBannerProps {
  onAction?: () => void;
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({
  onAction,
}) => {
  const {
    isInstalled,
    canInstall,
    isIOS,
    updateAvailable,
    isUpdating,
    isOnline,
    isMounted,
    installApp,
    applyUpdate,
  } = usePWA();

  const [isDismissed, setIsDismissed] = useState(true);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  /*
   * INSTALL PROMPT
   *
   * Show the install prompt after a short delay.
   * Dismissal lasts for 24 hours.
   */
  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      isInstalled
    ) {
      return;
    }

    const dismissedUntil =
      localStorage.getItem(
        'pwa_prompt_dismissed_until'
      );

    const dismissedTime = dismissedUntil
      ? Number.parseInt(dismissedUntil, 10)
      : 0;

    if (
      dismissedTime &&
      Date.now() < dismissedTime
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      setIsDismissed(false);
    }, 2500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isInstalled]);

  /*
   * DISMISS INSTALL PROMPT
   */
  const handleDismiss = () => {
    setIsDismissed(true);

    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'pwa_prompt_dismissed_until',
        String(
          Date.now() +
            24 * 60 * 60 * 1000
        )
      );
    }
  };

  /*
   * INSTALL APP
   */
  const handleInstallClick = async () => {
    const result = await installApp();

    onAction?.();

    if (result === 'accepted') {
      setJustInstalled(true);
      setIsDismissed(true);

      window.setTimeout(() => {
        setJustInstalled(false);
      }, 4000);

      return;
    }

    if (result === 'ios') {
      setShowIOSModal(true);
    }
  };

  /*
   * UPDATE APP
   *
   * Normally updates are automatic.
   * This button remains as a fallback if the
   * update notification is still visible.
   */
  const handleUpdateClick = () => {
    onAction?.();
    applyUpdate();
  };

  /*
   * Avoid hydration mismatch.
   */
  if (!isMounted) {
    return null;
  }

  return (
    <>
      {/* =====================================================
          1. NEW VERSION / UPDATE NOTICE
          ===================================================== */}

      {updateAvailable && (
        <div
          id="pwa-update-popup"
          role="status"
          aria-live="polite"
          className="
            fixed
            top-3
            inset-x-3
            sm:inset-x-auto
            sm:right-5
            sm:max-w-md
            z-[100]
            animate-in
            fade-in
            slide-in-from-top-3
            duration-300
          "
        >
          <div
            className="
              bg-gradient-to-r
              from-[#8D2817]
              via-[#A54018]
              to-[#C25E29]
              text-white
              p-4
              rounded-2xl
              shadow-2xl
              border-2
              border-amber-300/40
              flex
              flex-col
              gap-3
            "
          >
            <div className="flex items-start gap-3">
              <div
                className="
                  w-10
                  h-10
                  rounded-xl
                  bg-amber-400
                  text-stone-950
                  flex
                  items-center
                  justify-center
                  shrink-0
                  shadow-md
                "
              >
                <RefreshCw
                  className={`h-5 w-5 ${
                    isUpdating
                      ? 'animate-spin'
                      : ''
                  }`}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="
                      text-[10px]
                      font-black
                      uppercase
                      tracking-wider
                      bg-amber-300
                      text-stone-900
                      px-2
                      py-0.5
                      rounded-full
                    "
                  >
                    नया अपडेट
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white mt-1 leading-tight">
                  ढोटी ऐप में नया अपडेट तैयार है!
                </h4>

                <p className="text-xs text-amber-100/90 mt-0.5 leading-relaxed">
                  नए फीचर्स और सुधारों वाला ताज़ा वर्ज़न लोड हो रहा है।
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={handleUpdateClick}
                disabled={isUpdating}
                id="pwa-update-now-btn"
                type="button"
                className="
                  flex-1
                  py-2
                  px-4
                  bg-amber-400
                  hover:bg-amber-300
                  active:scale-95
                  text-stone-950
                  font-bold
                  text-xs
                  rounded-xl
                  shadow-md
                  transition-all
                  flex
                  items-center
                  justify-center
                  gap-2
                  disabled:opacity-75
                  disabled:cursor-wait
                "
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${
                    isUpdating
                      ? 'animate-spin'
                      : ''
                  }`}
                />

                <span>
                  {isUpdating
                    ? 'अपडेट हो रहा है...'
                    : '⚡ अभी अपडेट करें'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          2. INSTALL SUCCESS
          ===================================================== */}

      {justInstalled && (
        <div
          className="
            fixed
            top-4
            inset-x-4
            max-w-sm
            mx-auto
            z-[100]
            bg-emerald-700
            text-white
            px-4
            py-3
            rounded-2xl
            shadow-xl
            flex
            items-center
            gap-3
            animate-in
            fade-in
            slide-in-from-top-4
          "
          role="status"
          aria-live="polite"
        >
          <CheckCircle2 className="h-6 w-6 text-emerald-300 shrink-0" />

          <div className="text-xs">
            <p className="font-bold">
              DHOTI AALE सफलतापूर्वक इंस्टॉल हो गया!
            </p>

            <p className="text-emerald-100 text-[11px]">
              अब इसे फोन की होम स्क्रीन से खोल सकते हैं।
            </p>
          </div>
        </div>
      )}

      {/* =====================================================
          3. OFFLINE STATUS
          ===================================================== */}

      {!isOnline && (
        <div
          className="
            fixed
            top-14
            inset-x-4
            max-w-sm
            mx-auto
            z-[90]
            bg-stone-900/95
            border
            border-amber-500/40
            text-amber-300
            px-3
            py-1.5
            rounded-xl
            shadow-lg
            flex
            items-center
            justify-center
            gap-2
            text-xs
            font-medium
          "
          role="status"
          aria-live="polite"
        >
          <WifiOff className="h-3.5 w-3.5 text-amber-400 animate-pulse" />

          <span>
            आप ऑफ़लाइन हैं — इंटरनेट आते ही ऐप अपडेट हो जाएगा।
          </span>
        </div>
      )}

      {/* =====================================================
          4. INSTALL APP PROMPT
          ===================================================== */}

      {!isInstalled &&
        !isDismissed &&
        (canInstall || isIOS) && (
          <div
            id="pwa-install-popup"
            className="
              fixed
              bottom-16
              sm:bottom-6
              inset-x-3
              sm:inset-x-auto
              sm:right-6
              sm:max-w-sm
              z-[80]
              animate-in
              fade-in
              slide-in-from-bottom-5
              duration-300
            "
          >
            <div
              className="
                bg-white/95
                backdrop-blur-md
                rounded-3xl
                p-4
                shadow-2xl
                border-2
                border-[#C25E29]/30
                text-stone-900
                relative
              "
            >
              {/* Close */}
              <button
                onClick={handleDismiss}
                type="button"
                className="
                  absolute
                  right-3
                  top-3
                  w-7
                  h-7
                  rounded-full
                  bg-stone-100
                  hover:bg-stone-200
                  text-stone-500
                  flex
                  items-center
                  justify-center
                  transition-colors
                "
                aria-label="Close install prompt"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Brand */}
              <div className="flex items-center gap-3">
                <div
                  className="
                    w-12
                    h-12
                    rounded-2xl
                    bg-gradient-to-br
                    from-amber-500
                    to-[#8D2817]
                    p-0.5
                    shadow-md
                    flex
                    items-center
                    justify-center
                    shrink-0
                  "
                >
                  <div
                    className="
                      w-full
                      h-full
                      bg-stone-900
                      rounded-[14px]
                      flex
                      items-center
                      justify-center
                      text-amber-300
                    "
                  >
                    <svg
                      className="w-7 h-7 fill-current"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="M12 2C8.5 2 5.5 3.5 4 6c0 0 2.5 1.5 5 1 2.5-.5 5-2 7-1s3 3 4 3c-1.5-4-4.5-7-8-7zm-7.8 7c-.1.5-.2 1-.2 1.6 0 3.5 3.5 6.4 8 6.4 2.2 0 4.2-.7 5.7-1.9-1.2-.8-2.6-1.3-4.2-1.3-2.9 0-5.5 1.4-7.3-1.8zM12 18.5c-3.1 0-5.8-1.5-7.1-3.7-.6.9-.9 2-.9 3.2 0 2.2 3.6 4 8 4s8-1.8 8-4c0-1.1-.3-2.2-.9-3.1-1.4 2.1-4 3.6-7.1 3.6z" />
                    </svg>
                  </div>
                </div>

                <div className="pr-8">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-stone-900 tracking-wider">
                      DHOTI AALE
                    </span>

                    <span
                      className="
                        text-[10px]
                        font-bold
                        bg-amber-100
                        text-amber-900
                        px-1.5
                        py-0.2
                        rounded
                      "
                    >
                      Official App
                    </span>
                  </div>

                  <p className="text-[11px] text-stone-600 font-medium">
                    ढोटी गाँव की अपनी मोबाइल ऐप
                  </p>
                </div>
              </div>

              {/* Benefits */}
              <div
                className="
                  mt-3
                  py-2
                  px-2.5
                  rounded-xl
                  bg-amber-50/70
                  border
                  border-amber-200/50
                  space-y-1
                  text-[11px]
                  text-stone-700
                "
              >
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-[#C25E29] shrink-0" />
                  <span>
                    तेज़ी से खुलेगी और अपडेट रहेगी
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-[#C25E29] shrink-0" />
                  <span>
                    ग्राम सूचनाएं, चौपाल और बैटल का सीधा एक्सेस
                  </span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={handleInstallClick}
                  id="pwa-popup-install-btn"
                  type="button"
                  className="
                    flex-1
                    py-2.5
                    px-4
                    bg-gradient-to-r
                    from-[#2D7D46]
                    to-[#1E5830]
                    hover:from-[#1E5830]
                    hover:to-[#174425]
                    active:scale-95
                    text-white
                    font-bold
                    text-xs
                    rounded-xl
                    shadow-md
                    transition-all
                    flex
                    items-center
                    justify-center
                    gap-1.5
                  "
                >
                  <Download className="h-4 w-4" />

                  <span>
                    {isIOS
                      ? 'iPhone पर इंस्टॉल करें'
                      : '📲 ऐप इंस्टॉल करें'}
                  </span>
                </button>

                <button
                  onClick={handleDismiss}
                  type="button"
                  className="
                    py-2
                    px-3
                    text-stone-500
                    hover:text-stone-800
                    text-xs
                    font-medium
                    rounded-xl
                    hover:bg-stone-100
                    transition-colors
                  "
                >
                  बाद में
                </button>
              </div>
            </div>
          </div>
        )}

      {/* =====================================================
          5. IOS INSTALL GUIDE
          ===================================================== */}

      {showIOSModal && (
        <div
          className="
            fixed
            inset-0
            z-[110]
            flex
            items-end
            sm:items-center
            justify-center
            bg-black/60
            backdrop-blur-sm
            p-4
            animate-in
            fade-in
            duration-200
          "
          role="dialog"
          aria-modal="true"
          aria-labelledby="ios-install-title"
        >
          <div
            className="
              w-full
              max-w-sm
              rounded-3xl
              bg-white
              p-5
              shadow-2xl
              border
              border-stone-200
              text-stone-900
            "
          >
            {/* Header */}
            <div
              className="
                flex
                items-center
                justify-between
                pb-3
                border-b
                border-stone-100
              "
            >
              <div className="flex items-center gap-2">
                <div
                  className="
                    w-8
                    h-8
                    rounded-lg
                    bg-amber-100
                    text-[#C25E29]
                    flex
                    items-center
                    justify-center
                  "
                >
                  <Download className="h-4 w-4" />
                </div>

                <h3
                  id="ios-install-title"
                  className="text-sm font-bold text-stone-900"
                >
                  iPhone / iPad पर इंस्टॉल करें
                </h3>
              </div>

              <button
                onClick={() => setShowIOSModal(false)}
                type="button"
                className="
                  w-7
                  h-7
                  rounded-full
                  bg-stone-100
                  text-stone-500
                  flex
                  items-center
                  justify-center
                  hover:bg-stone-200
                "
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Steps */}
            <div className="mt-4 space-y-3.5 text-xs text-stone-700 leading-relaxed">
              <div
                className="
                  flex
                  items-start
                  gap-3
                  p-2.5
                  rounded-xl
                  bg-stone-50
                  border
                  border-stone-200
                "
              >
                <div
                  className="
                    w-6
                    h-6
                    rounded-full
                    bg-blue-100
                    text-blue-600
                    flex
                    items-center
                    justify-center
                    shrink-0
                    font-bold
                    text-xs
                  "
                >
                  1
                </div>

                <div>
                  <p className="font-semibold text-stone-900">
                    Safari में &apos;Share&apos; दबाएं
                  </p>

                  <p className="text-[11px] text-stone-500 mt-0.5 flex items-center gap-1">
                    स्क्रीन के नीचे बने शेयर आइकन{' '}
                    <Share className="h-3.5 w-3.5 text-blue-600 inline" />{' '}
                    पर टैप करें।
                  </p>
                </div>
              </div>

              <div
                className="
                  flex
                  items-start
                  gap-3
                  p-2.5
                  rounded-xl
                  bg-stone-50
                  border
                  border-stone-200
                "
              >
                <div
                  className="
                    w-6
                    h-6
                    rounded-full
                    bg-blue-100
                    text-blue-600
                    flex
                    items-center
                    justify-center
                    shrink-0
                    font-bold
                    text-xs
                  "
                >
                  2
                </div>

                <div>
                  <p className="font-semibold text-stone-900">
                    &apos;Add to Home Screen&apos; चुनें
                  </p>

                  <p className="text-[11px] text-stone-500 mt-0.5 flex items-center gap-1">
                    नीचे स्क्रॉल करके{' '}
                    <PlusSquare className="h-3.5 w-3.5 text-stone-700 inline" />{' '}
                    <strong>होम स्क्रीन में जोड़ें</strong> पर टैप करें।
                  </p>
                </div>
              </div>

              <div
                className="
                  flex
                  items-start
                  gap-3
                  p-2.5
                  rounded-xl
                  bg-stone-50
                  border
                  border-stone-200
                "
              >
                <div
                  className="
                    w-6
                    h-6
                    rounded-full
                    bg-emerald-100
                    text-emerald-700
                    flex
                    items-center
                    justify-center
                    shrink-0
                    font-bold
                    text-xs
                  "
                >
                  3
                </div>

                <div>
                  <p className="font-semibold text-stone-900">
                    ऊपर &apos;Add&apos; पर टैप करें
                  </p>

                  <p className="text-[11px] text-stone-500 mt-0.5">
                    ऐप आपके फोन की मुख्य स्क्रीन पर आ जाएगी!
                  </p>
                </div>
              </div>
            </div>

            {/* Close */}
            <button
              onClick={() => setShowIOSModal(false)}
              type="button"
              className="
                mt-5
                w-full
                py-2.5
                bg-stone-900
                text-white
                text-xs
                font-bold
                rounded-xl
                hover:bg-stone-800
                transition-colors
              "
            >
              समझ गया
            </button>
          </div>
        </div>
      )}
    </>
  );
};