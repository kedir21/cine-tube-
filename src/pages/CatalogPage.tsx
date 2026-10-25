import React, { useEffect, useState } from 'react';
import { Film, Tv, Flame, Star, Filter, ChevronDown, RotateCcw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { tmdbApi } from '../services/tmdbApi';
import { MovieCard } from '../components/common/MovieCard';
import { MovieCardSkeleton } from '../components/common/LoadingSkeleton';
import { POPULAR_GENRES, GENRE_MAP } from '../data/curatedCompanies';
import { TMDBMovie, TMDBTVShow } from '../types/tmdb';

interface CatalogPageProps {
  type: 'movie' | 'tv' | 'trending' | 'genre';
  genreId?: number;
}

export const CatalogPage: React.FC<CatalogPageProps> = ({ type, genreId }) => {
  const { currentPath } = useApp();

  const urlParams = new URLSearchParams(window.location.search);
  const initialSort = urlParams.get('sort') === 'top_rated' ? 'vote_average.desc' : 'popularity.desc';
  const initialFilter = urlParams.get('filter') || '';
  const networkId = urlParams.get('network');

  const [items, setItems] = useState<(TMDBMovie | TMDBTVShow)[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Filters
  const [sortBy, setSortBy] = useState(initialSort);
  const [selectedGenre, setSelectedGenre] = useState(genreId ? String(genreId) : '');
  const [selectedYear, setSelectedYear] = useState('');

  useEffect(() => {
    let isCancelled = false;

    const loadCatalog = async () => {
      setIsLoading(true);
      setPage(1);

      try {
        let res: any;

        if (type === 'trending') {
          res = await tmdbApi.getHomeRows();
          if (!isCancelled) {
            setItems(res.trendingToday || []);
            setTotalPages(1);
          }
        } else if (type === 'tv') {
          res = await tmdbApi.discoverTV({
            page: 1,
            sort_by: sortBy,
            first_air_date_year: selectedYear || undefined,
            with_genres: selectedGenre || undefined,
            with_networks: networkId || undefined,
          });
          if (!isCancelled) {
            setItems(res.results || []);
            setTotalPages(res.total_pages || 1);
          }
        } else {
          // Movie or Genre
          res = await tmdbApi.discoverMovies({
            page: 1,
            sort_by: sortBy,
            primary_release_year: selectedYear || undefined,
            with_genres: selectedGenre || genreId || undefined,
          });
          if (!isCancelled) {
            setItems(res.results || []);
            setTotalPages(res.total_pages || 1);
          }
        }
      } catch (err) {
        console.error('Catalog fetch error:', err);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    loadCatalog();

    return () => {
      isCancelled = true;
    };
  }, [type, genreId, sortBy, selectedGenre, selectedYear, networkId, currentPath]);

  const handleLoadMore = async () => {
    if (page >= totalPages || isLoadingMore) return;
    setIsLoadingMore(true);
    const nextPage = page + 1;

    try {
      let res: any;
      if (type === 'tv') {
        res = await tmdbApi.discoverTV({
          page: nextPage,
          sort_by: sortBy,
          first_air_date_year: selectedYear || undefined,
          with_genres: selectedGenre || undefined,
          with_networks: networkId || undefined,
        });
      } else {
        res = await tmdbApi.discoverMovies({
          page: nextPage,
          sort_by: sortBy,
          primary_release_year: selectedYear || undefined,
          with_genres: selectedGenre || genreId || undefined,
        });
      }
      setItems((prev) => [...prev, ...(res.results || [])]);
      setPage(nextPage);
    } catch (err) {
      console.error('Failed to load more catalog:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const pageTitle =
    type === 'trending'
      ? 'TRENDING WORLDWIDE'
      : type === 'tv'
      ? 'TELEVISION DISCOVERY'
      : genreId
      ? `${(GENRE_MAP[genreId] || 'GENRE').toUpperCase()} CATALOG`
      : 'MOVIE DISCOVERY';

  const pageSubtitle =
    type === 'trending'
      ? 'Top movies and television productions gaining momentum today'
      : type === 'tv'
      ? 'Browse critically acclaimed series, ongoing seasons, and premier broadcasts'
      : genreId
      ? `Discover top rated and popular ${GENRE_MAP[genreId]} titles from TMDB`
      : 'Explore thousands of cinematic titles with real metadata from TMDB';

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 pb-20">
      {/* Page Header */}
      <div className="mb-6 border-b border-neutral-800 pb-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-red-500 mb-1">
          {type === 'trending' ? (
            <Flame className="h-4 w-4 text-amber-500" />
          ) : type === 'tv' ? (
            <Tv className="h-4 w-4 text-emerald-400" />
          ) : (
            <Film className="h-4 w-4 text-red-500" />
          )}
          <span>TMDB Catalog</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white font-['Oswald',sans-serif]">
          {pageTitle}
        </h1>
        <p className="mt-1 text-xs md:text-sm text-neutral-400">{pageSubtitle}</p>
      </div>

      {/* Filter Controls Bar */}
      {type !== 'trending' && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-4 mb-6">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 pr-8 text-xs font-medium text-neutral-200 focus:border-red-600 focus:outline-none"
              >
                <option value="popularity.desc">Most Popular</option>
                <option value="vote_average.desc">Highest Rated</option>
                <option value="primary_release_date.desc">Newest First</option>
                <option value="primary_release_date.asc">Oldest First</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
            </div>

            {/* Genre */}
            {!genreId && (
              <div className="relative">
                <select
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  className="appearance-none rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 pr-8 text-xs font-medium text-neutral-200 focus:border-red-600 focus:outline-none"
                >
                  <option value="">All Genres</option>
                  {POPULAR_GENRES.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
              </div>
            )}

            {/* Release Year */}
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="appearance-none rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 pr-8 text-xs font-medium text-neutral-200 focus:border-red-600 focus:outline-none"
              >
                <option value="">Any Year</option>
                {Array.from({ length: 30 }, (_, i) => 2026 - i).map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
            </div>

            {/* Reset */}
            {(selectedGenre || selectedYear || sortBy !== 'popularity.desc') && (
              <button
                onClick={() => {
                  setSelectedGenre('');
                  setSelectedYear('');
                  setSortBy('popularity.desc');
                }}
                className="flex items-center gap-1 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-neutral-400 hover:text-white"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>

          <div className="text-xs text-neutral-400">
            Showing <span className="font-semibold text-white">{items.length}</span> titles
          </div>
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <MovieCardSkeleton key={i} />
          ))}
        </div>
      ) : items.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {items.map((item) => (
              <MovieCard
                key={`${item.media_type || type}-${item.id}`}
                item={item}
                mediaTypeOverride={type === 'tv' ? 'tv' : type === 'movie' ? 'movie' : undefined}
              />
            ))}
          </div>

          {page < totalPages && (
            <div className="mt-10 flex justify-center">
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="flex items-center gap-2 rounded-xl bg-neutral-800 px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:opacity-50"
              >
                {isLoadingMore ? <span>Loading...</span> : <span>Load More Titles</span>}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="py-16 text-center text-xs text-neutral-400">
          No titles found matching the selected filters.
        </div>
      )}
    </div>
  );
};
