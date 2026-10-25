import React from 'react';
import { History, Trash2, ArrowRight, Play, Film, Tv, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getTMDBImageUrl, getPosterFallback } from '../services/tmdbApi';

export const HistoryPage: React.FC = () => {
  const { history, clearHistory, navigate } = useApp();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-red-500 mb-1">
            <History className="h-4 w-4" />
            <span>Viewing Activity</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white font-['Oswald',sans-serif]">
            WATCH HISTORY &amp; PROGRESS
          </h1>
          <p className="mt-1 text-xs text-neutral-400">
            Titles you have watched or streamed, with saved progress to resume anytime.
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={clearHistory}
            className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-xs font-semibold text-neutral-300 hover:text-red-400 hover:bg-neutral-800 transition"
          >
            <Trash2 className="h-4 w-4" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {history.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {history.map((item) => {
            const isTv = item.media_type === 'tv';
            const watchUrl = isTv
              ? `/watch/tv/${item.id}?season=${item.season || 1}&episode=${item.episode || 1}`
              : `/watch/movie/${item.id}`;
            const progress =
              item.progress_percent ||
              (item.currentTime && item.duration
                ? (item.currentTime / item.duration) * 100
                : 0);

            return (
              <div
                key={`${item.media_type}-${item.id}-${item.watched_at}`}
                className="group relative flex flex-col rounded-2xl border border-neutral-800 bg-[#161616] overflow-hidden p-3 transition hover:border-neutral-700 hover:shadow-xl"
              >
                {/* Poster / Backdrop */}
                <div
                  onClick={() => navigate(watchUrl)}
                  className="relative aspect-video w-full rounded-xl overflow-hidden bg-neutral-900 cursor-pointer mb-3"
                >
                  <img
                    src={
                      item.backdrop_path
                        ? getTMDBImageUrl(item.backdrop_path, 'w500')
                        : item.poster_path
                        ? getTMDBImageUrl(item.poster_path, 'w500')
                        : getPosterFallback(item.title)
                    }
                    alt={item.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                  />

                  {/* Play Overlay */}
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center transition">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-600/90 text-white shadow-lg group-hover:scale-110 transition">
                      <Play className="h-5 w-5 fill-white ml-0.5" />
                    </div>
                  </div>

                  {/* Media Type Badge */}
                  <div className="absolute top-2 left-2 rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-bold uppercase text-neutral-300 backdrop-blur-md">
                    {isTv ? 'TV' : 'Movie'}
                  </div>

                  {/* Progress Bar */}
                  {progress > 0 && (
                    <div className="absolute bottom-0 inset-x-0 h-1.5 bg-neutral-800">
                      <div
                        className="h-full bg-red-600 transition-all"
                        style={{ width: `${Math.min(100, Math.max(5, progress))}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h2
                      onClick={() => navigate(watchUrl)}
                      className="text-sm font-bold text-white group-hover:text-red-400 transition cursor-pointer truncate"
                    >
                      {item.title}
                    </h2>

                    <div className="flex items-center gap-1.5 text-xs text-neutral-400 mt-1">
                      {isTv && item.season && item.episode && (
                        <span className="font-semibold text-neutral-200">
                          Season {item.season}, Episode {item.episode}
                        </span>
                      )}
                      {item.currentTime && item.currentTime > 0 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="flex items-center gap-1 text-neutral-400">
                            <Clock className="h-3 w-3" />
                            {Math.floor(item.currentTime / 60)} min
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Resume button */}
                  <button
                    onClick={() => navigate(watchUrl)}
                    className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-800 py-2 text-xs font-semibold text-neutral-200 hover:bg-red-600 hover:text-white transition"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
                    <span>{progress > 0 ? 'Resume Playback' : 'Watch Now'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex min-h-[350px] flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-800 p-8 text-center">
          <History className="h-12 w-12 text-neutral-600 mb-3" />
          <h2 className="text-lg font-bold text-white">No viewing history yet</h2>
          <p className="mt-1 text-xs text-neutral-400 max-w-sm">
            As you stream movies or TV shows, your playback progress will be saved here so you can continue where you left off.
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-5 flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-red-500 transition"
          >
            <span>Explore CineTube</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};
