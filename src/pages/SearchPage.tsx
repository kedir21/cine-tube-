import React, { useEffect, useState, useRef } from 'react';
import {
  Search,
  Film,
  Tv,
  User,
  Building2,
  AlertCircle,
  LayoutGrid,
  List,
  Star,
  Play,
  Bookmark,
  BookmarkCheck,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { tmdbApi, getTMDBImageUrl, getPosterFallback, getBackdropFallback } from '../services/tmdbApi';
import { MovieCard } from '../components/common/MovieCard';
import { MovieCardSkeleton } from '../components/common/LoadingSkeleton';
import { GENRE_MAP } from '../data/curatedCompanies';

export const SearchPage: React.FC = () => {
  const { currentPath, navigate, toggleWatchlist, isInWatchlist, openTrailer } = useApp();

  // Extract query from URL ?q=...
  const urlParams = new URLSearchParams(window.location.search);
  const initialQuery = urlParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<'multi' | 'movie' | 'tv' | 'person' | 'company'>('multi');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [results, setResults] = useState<any[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Sync state if URL changes
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('q') || '';
    setQuery(q);
  }, [currentPath]);

  // Real-time debounced search query
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setTotalResults(0);
      setIsLoading(false);
      return;
    }

    let isCancelled = false;
    setIsLoading(true);

    const debounceTimer = setTimeout(async () => {
      try {
        const res = await tmdbApi.search(query.trim(), activeTab, 1);
        if (!isCancelled) {
          setResults(res.results || []);
          setTotalResults(res.total_results || res.results?.length || 0);
        }
      } catch (err) {
        console.error('Search error:', err);
        if (!isCancelled) setResults([]);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }, 280);

    return () => {
      isCancelled = true;
      clearTimeout(debounceTimer);
    };
  }, [query, activeTab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleClear = () => {
    setQuery('');
    navigate('/search');
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 pb-24">
      {/* YouTube-Style Prominent Search Bar */}
      <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto mb-6">
        <div className="relative flex items-center">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search movies, TV shows, cast, directors, studios..."
            className="h-11 w-full rounded-full border border-zinc-700/80 bg-zinc-900/90 pl-11 pr-24 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 shadow-xl focus:border-zinc-500 focus:outline-none transition-colors"
          />
          <Search className="pointer-events-none absolute left-4 h-4 w-4 text-zinc-400" />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear search"
              className="absolute right-14 text-zinc-400 hover:text-white mr-1"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            type="submit"
            className="absolute right-1.5 rounded-full bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 transition"
          >
            Search
          </button>
        </div>
      </form>

      {/* Filter Tabs & Layout View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3 mb-6">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto p-0.5 scrollbar-none">
          <button
            onClick={() => setActiveTab('multi')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition whitespace-nowrap ${
              activeTab === 'multi'
                ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab('movie')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition whitespace-nowrap ${
              activeTab === 'movie'
                ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            Movies
          </button>
          <button
            onClick={() => setActiveTab('tv')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition whitespace-nowrap ${
              activeTab === 'tv'
                ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            TV Shows
          </button>
          <button
            onClick={() => setActiveTab('person')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition whitespace-nowrap ${
              activeTab === 'person'
                ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            People
          </button>
          <button
            onClick={() => setActiveTab('company')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition whitespace-nowrap ${
              activeTab === 'company'
                ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            Studios
          </button>
        </div>

        {/* Right side: Result Count & YouTube List/Grid view toggler */}
        <div className="flex items-center justify-between sm:justify-end gap-3">
          {query.trim() && (
            <span className="text-xs text-zinc-400">
              {totalResults} {totalResults === 1 ? 'result' : 'results'}
            </span>
          )}

          <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-900 p-0.5">
            <button
              onClick={() => setViewMode('list')}
              title="YouTube-style List view"
              className={`p-1.5 rounded-md transition ${
                viewMode === 'list'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              title="Grid view"
              className={`p-1.5 rounded-md transition ${
                viewMode === 'grid'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Results Rendering */}
      {isLoading ? (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'
              : 'space-y-4'
          }
        >
          {[...Array(6)].map((_, i) =>
            viewMode === 'grid' ? (
              <MovieCardSkeleton key={i} />
            ) : (
              <div
                key={i}
                className="flex flex-col sm:flex-row gap-4 p-3 rounded-2xl border border-zinc-800/60 bg-zinc-900/30 animate-pulse"
              >
                <div className="w-full sm:w-64 aspect-video rounded-xl bg-zinc-800 shrink-0" />
                <div className="flex-1 space-y-2.5 py-1">
                  <div className="h-4 w-1/3 bg-zinc-800 rounded" />
                  <div className="h-3 w-1/4 bg-zinc-850 rounded" />
                  <div className="h-3 w-3/4 bg-zinc-850 rounded" />
                </div>
              </div>
            )
          )}
        </div>
      ) : results.length > 0 ? (
        viewMode === 'list' ? (
          /* YouTube-Style Search List View */
          <div className="space-y-3.5">
            {results.map((item) => {
              const isTv = item.media_type === 'tv' || activeTab === 'tv' || (!item.title && !!item.name && !item.known_for_department);
              const isPerson = item.media_type === 'person' || activeTab === 'person' || item.known_for_department;
              const isCompany = item.media_type === 'company' || activeTab === 'company' || (item.origin_country !== undefined && !item.first_air_date);

              if (isPerson) {
                return (
                  <div
                    key={`person-${item.id}`}
                    onClick={() => navigate(`/person/${item.id}`)}
                    className="group flex flex-col sm:flex-row gap-4 p-3 rounded-2xl border border-zinc-800/70 bg-zinc-900/40 hover:bg-zinc-850/60 hover:border-zinc-700 cursor-pointer transition"
                  >
                    <div className="h-28 w-28 sm:h-32 sm:w-32 shrink-0 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 mx-auto sm:mx-0">
                      {item.profile_path ? (
                        <img
                          src={getTMDBImageUrl(item.profile_path, 'w185')}
                          alt={item.name}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-zinc-600">
                          <User className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-center text-center sm:text-left">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
                        Cast &amp; Crew
                      </div>
                      <h3 className="text-base font-semibold text-white group-hover:text-rose-400 transition mt-0.5">
                        {item.name}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-1">
                        Known for: {item.known_for_department || 'Acting'}
                      </p>
                      {item.known_for && item.known_for.length > 0 && (
                        <p className="text-xs text-zinc-500 mt-1 truncate">
                          Notable work:{' '}
                          {item.known_for.map((k: any) => k.title || k.name).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                );
              }

              if (isCompany) {
                return (
                  <div
                    key={`company-${item.id}`}
                    onClick={() => navigate(`/company/${item.id}`)}
                    className="group flex items-center gap-4 p-3.5 rounded-2xl border border-zinc-800/70 bg-zinc-900/40 hover:bg-zinc-850/60 hover:border-zinc-700 cursor-pointer transition"
                  >
                    <div className="h-16 w-24 shrink-0 rounded-xl bg-zinc-950 border border-zinc-800 p-2 flex items-center justify-center">
                      {item.logo_path ? (
                        <img
                          src={getTMDBImageUrl(item.logo_path, 'w185')}
                          alt={item.name}
                          className="max-h-full max-w-full object-contain filter invert brightness-200"
                        />
                      ) : (
                        <Building2 className="h-6 w-6 text-zinc-500" />
                      )}
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                        Production Studio
                      </div>
                      <h3 className="text-sm font-semibold text-white group-hover:text-rose-400 transition">
                        {item.name}
                      </h3>
                      <p className="text-xs text-zinc-500 mt-0.5">View studio catalogue →</p>
                    </div>
                  </div>
                );
              }

              const mediaType = isTv ? 'tv' : 'movie';
              const title = item.title || item.name || 'Untitled';
              const dateStr = item.release_date || item.first_air_date || '';
              const year = dateStr ? dateStr.slice(0, 4) : '';
              const rating = typeof item.vote_average === 'number' && item.vote_average > 0 ? item.vote_average.toFixed(1) : null;
              const inWatchlist = isInWatchlist(item.id, mediaType);
              const genreId = item.genre_ids?.[0];
              const genreName = genreId ? GENRE_MAP[genreId] : null;

              const thumbnail = item.backdrop_path
                ? getTMDBImageUrl(item.backdrop_path, 'w780')
                : item.poster_path
                ? getTMDBImageUrl(item.poster_path, 'w500')
                : getBackdropFallback();

              return (
                <div
                  key={`${mediaType}-${item.id}`}
                  onClick={() => navigate(`/${mediaType}/${item.id}`)}
                  className="group flex flex-col sm:flex-row gap-4 p-3 rounded-2xl border border-zinc-800/70 bg-[#121215] hover:border-zinc-700 hover:bg-zinc-850/60 cursor-pointer transition duration-150"
                >
                  {/* YouTube-style 16:9 Thumbnail Still */}
                  <div className="relative w-full sm:w-60 md:w-64 aspect-video shrink-0 overflow-hidden rounded-xl bg-zinc-950 border border-zinc-800/80">
                    <img
                      src={thumbnail}
                      alt={title}
                      loading="lazy"
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Media Type Badge */}
                    <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-300 backdrop-blur-md">
                      {isTv ? <Tv className="h-2.5 w-2.5 text-emerald-400" /> : <Film className="h-2.5 w-2.5 text-rose-500" />}
                      {isTv ? 'TV' : 'Movie'}
                    </span>

                    {/* Quick Play Icon on Hover */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-600 text-white shadow-lg">
                        <Play className="h-4 w-4 fill-white ml-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* Metadata & Synopsis Details */}
                  <div className="flex-1 flex flex-col justify-between py-0.5">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm sm:text-base font-semibold text-zinc-100 group-hover:text-rose-400 transition">
                          {title}
                        </h3>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWatchlist({
                              id: item.id,
                              media_type: mediaType,
                              title,
                              poster_path: item.poster_path,
                              backdrop_path: item.backdrop_path,
                              vote_average: item.vote_average,
                              release_year: year,
                            });
                          }}
                          title={inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                          className={`p-1.5 rounded-lg border transition ${
                            inWatchlist
                              ? 'bg-rose-950/40 text-rose-400 border-rose-800/60'
                              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                          }`}
                        >
                          {inWatchlist ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                        </button>
                      </div>

                      {/* Info Line */}
                      <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
                        {year && <span>{year}</span>}
                        {year && (genreName || rating) && <span aria-hidden="true">·</span>}
                        {genreName && <span>{genreName}</span>}
                        {rating && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="flex items-center gap-1 text-amber-400 font-medium">
                              <Star className="h-3 w-3 fill-amber-400" />
                              {rating}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Synopsis */}
                      <p className="mt-2 text-xs text-zinc-300 line-clamp-2 leading-relaxed">
                        {item.overview || 'Click to view streaming details, cast, and trailers.'}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/watch/${mediaType}/${item.id}`);
                        }}
                        className="flex items-center gap-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 transition"
                      >
                        <Play className="h-3 w-3 fill-current text-rose-500" />
                        <span>Stream Now</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {results.map((item) => (
              <MovieCard
                key={`${item.media_type || activeTab}-${item.id}`}
                item={item}
                mediaTypeOverride={activeTab === 'tv' ? 'tv' : activeTab === 'movie' ? 'movie' : undefined}
              />
            ))}
          </div>
        )
      ) : query.trim() ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 p-8 text-center">
          <AlertCircle className="h-10 w-10 text-zinc-600 mb-2" />
          <h3 className="text-sm font-semibold text-white">No results found</h3>
          <p className="mt-1 text-xs text-zinc-400 max-w-sm">
            We couldn’t find any matches for &ldquo;{query}&rdquo; in {activeTab}. Check spelling or try broader search terms.
          </p>
        </div>
      ) : (
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-8 text-center">
          <Search className="h-10 w-10 text-zinc-600 mb-3" />
          <h3 className="text-sm font-semibold text-white">Search Movies &amp; Shows</h3>
          <p className="mt-1 text-xs text-zinc-400 max-w-sm">
            Discover titles across studios, streaming providers, directors, and actors with real-time suggestions.
          </p>
        </div>
      )}
    </div>
  );
};
