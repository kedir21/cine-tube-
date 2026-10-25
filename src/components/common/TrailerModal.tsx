import React, { useEffect } from 'react';
import { X, ExternalLink, Film, Tv } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const TrailerModal: React.FC = () => {
  const { activeTrailer, closeTrailer, navigate } = useApp();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeTrailer();
    };
    if (activeTrailer) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [activeTrailer, closeTrailer]);

  if (!activeTrailer) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-10">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={closeTrailer}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-4xl overflow-hidden rounded-2xl border border-neutral-800 bg-[#121212] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-3 bg-[#181818]">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white shrink-0">
              {activeTrailer.mediaType === 'tv' ? <Tv className="h-3.5 w-3.5" /> : <Film className="h-3.5 w-3.5" />}
            </span>
            <span className="truncate text-sm font-bold text-white font-['Oswald',sans-serif]">
              {activeTrailer.title} — Official Trailer
            </span>
          </div>

          <div className="flex items-center gap-2">
            {activeTrailer.mediaId && activeTrailer.mediaType && (
              <button
                onClick={() => {
                  closeTrailer();
                  navigate(`/${activeTrailer.mediaType}/${activeTrailer.mediaId}`);
                }}
                className="hidden sm:flex items-center gap-1 text-xs text-neutral-400 hover:text-white px-2 py-1 rounded hover:bg-neutral-800"
              >
                <span>Full Details</span>
                <ExternalLink className="h-3 w-3" />
              </button>
            )}
            <button
              onClick={closeTrailer}
              aria-label="Close trailer"
              className="rounded-full p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Video Player Embed */}
        <div className="relative w-full aspect-video bg-black">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${activeTrailer.videoKey}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`}
            title={`${activeTrailer.title} Trailer`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full border-0"
          />
        </div>

        {/* Footer info bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#141414] text-xs text-neutral-400 border-t border-neutral-800">
          <span>Official video retrieved from TMDB video metadata</span>
          {activeTrailer.mediaId && (
            <button
              onClick={() => {
                closeTrailer();
                navigate(`/watch/${activeTrailer.mediaType || 'movie'}/${activeTrailer.mediaId}`);
              }}
              className="text-red-400 hover:text-red-300 font-medium"
            >
              Check Watch Providers &amp; Full Options →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
