import React, { useState } from 'react';
import { Download, Share2, PlusSquare, X, Check } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'nav' | 'settings' | 'banner';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'nav',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // If app is already running in standalone PWA mode
  if (isInstalled) {
    if (variant === 'settings') {
      return (
        <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 rounded-lg px-3 py-2">
          <Check className="h-4 w-4" />
          <span>CineTube is installed and running in standalone mode.</span>
        </div>
      );
    }
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      setIsInstalling(true);
      try {
        await install();
      } finally {
        setIsInstalling(false);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  // Chromium / Android / Desktop flow or iOS guide button
  if (isInstallable || isIOS) {
    return (
      <>
        {variant === 'settings' ? (
          <button
            onClick={handleInstallClick}
            disabled={isInstalling}
            className={`flex items-center justify-between w-full p-4 rounded-xl bg-zinc-900/80 hover:bg-zinc-800/90 border border-zinc-800 text-left transition group ${className}`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-600/10 text-red-500 border border-red-500/20 group-hover:scale-105 transition-transform">
                <Download className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-100">Install CineTube App</p>
                <p className="text-xs text-zinc-400">
                  {isIOS
                    ? 'Add to iPhone / iPad home screen for an offline, full-screen cinema experience'
                    : 'Install on your desktop or mobile device for faster launch and offline viewing'}
                </p>
              </div>
            </div>
            <span className="text-xs font-medium px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white shadow-sm transition">
              {isIOS ? 'Instructions' : 'Install'}
            </span>
          </button>
        ) : (
          <button
            onClick={handleInstallClick}
            disabled={isInstalling}
            title={isIOS ? 'Install CineTube on iOS' : 'Install CineTube App'}
            className={`flex items-center gap-1.5 rounded-lg bg-zinc-800/90 hover:bg-zinc-700/90 border border-zinc-700/60 px-2.5 py-1.5 text-xs font-medium text-zinc-200 hover:text-white transition shadow-sm ${className}`}
          >
            <Download className="h-3.5 w-3.5 text-red-500" />
            <span className="hidden sm:inline">Install App</span>
          </button>
        )}

        {/* iOS Step-by-Step Installation Modal */}
        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl text-zinc-100">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-100 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600/20 border border-red-500/30 text-red-500">
                  <Download className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold">Install on iOS</h3>
                  <p className="text-xs text-zinc-400">Add CineTube to your home screen</p>
                </div>
              </div>

              <div className="space-y-3.5 text-xs text-zinc-300">
                <div className="flex items-start gap-3 rounded-lg bg-zinc-800/50 p-3 border border-zinc-800">
                  <Share2 className="h-4 w-4 text-sky-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-zinc-100">1. Tap Share</span>
                    <p className="text-zinc-400 mt-0.5">Tap the Share icon at the bottom of Safari.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg bg-zinc-800/50 p-3 border border-zinc-800">
                  <PlusSquare className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-zinc-100">2. Add to Home Screen</span>
                    <p className="text-zinc-400 mt-0.5">Scroll down the menu and choose "Add to Home Screen".</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-red-600 hover:bg-red-500 py-2.5 text-xs font-semibold text-white transition"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // If not currently installable (browser does not trigger prompt or already standalone)
  if (variant === 'settings') {
    return (
      <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/60 text-xs text-zinc-400">
        <p className="font-medium text-zinc-300 mb-1">Web App Installation</p>
        <p>CineTube meets all PWA standards with an offline service worker and app manifest. To install manually, use your browser's install menu or "Add to Home Screen" option.</p>
      </div>
    );
  }

  return null;
};
