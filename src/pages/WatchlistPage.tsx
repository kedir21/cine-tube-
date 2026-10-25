import React, { useState } from 'react';
import { Bookmark, Trash2, Film, Tv, Download, Upload, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MovieCard } from '../components/common/MovieCard';

export const WatchlistPage: React.FC = () => {
  const { watchlist, navigate, removeFromWatchlist } = useApp();
  const [filter, setFilter] = useState<'all' | 'movie' | 'tv'>('all');

  const filteredItems = watchlist.filter((item) => {
    if (filter === 'all') return true;
    return item.media_type === filter;
  });

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(watchlist, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cinetube-watchlist-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-red-500 mb-1">
            <Bookmark className="h-4 w-4" />
            <span>Personal Collection</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white font-['Oswald',sans-serif]">
            MY WATCHLIST
          </h1>
          <p className="mt-1 text-xs text-neutral-400">
            {watchlist.length} saved titles synced across your browser session.
          </p>
        </div>

        {watchlist.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              title="Export watchlist as JSON"
              className="flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 transition"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      {watchlist.length > 0 && (
        <div className="flex items-center gap-1.5 p-1 bg-neutral-900 rounded-xl border border-neutral-800 w-fit mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              filter === 'all' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
            }`}
          >
            All Saved ({watchlist.length})
          </button>
          <button
            onClick={() => setFilter('movie')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              filter === 'movie' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Movies ({watchlist.filter((i) => i.media_type === 'movie').length})
          </button>
          <button
            onClick={() => setFilter('tv')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              filter === 'tv' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
            }`}
          >
            TV Series ({watchlist.filter((i) => i.media_type === 'tv').length})
          </button>
        </div>
      )}

      {/* Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredItems.map((item) => (
            <div key={`${item.media_type}-${item.id}`} className="relative group">
              <MovieCard item={item} mediaTypeOverride={item.media_type} />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFromWatchlist(item.id, item.media_type);
                }}
                title="Remove from Watchlist"
                className="absolute top-2 left-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/80 text-neutral-400 hover:text-red-400 hover:bg-black transition opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex min-h-[350px] flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-800 p-8 text-center">
          <Bookmark className="h-12 w-12 text-neutral-600 mb-3" />
          <h2 className="text-lg font-bold text-white">Your Watchlist is empty</h2>
          <p className="mt-1 text-xs text-neutral-400 max-w-sm">
            Save movies and TV shows as you explore studios, trending charts, and genres to keep track of what you want to watch.
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-5 flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-red-500 transition"
          >
            <span>Explore Trending Titles</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};
