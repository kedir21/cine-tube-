import React, { useEffect, useState } from 'react';
import {
  Building2,
  Calendar,
  Globe2,
  MapPin,
  Film,
  Tv,
  Star,
  SlidersHorizontal,
  ChevronDown,
  RotateCcw,
  Sparkles,
  Play,
  Bookmark,
  BookmarkCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { tmdbApi, getTMDBImageUrl, getBackdropFallback } from '../services/tmdbApi';
import { CURATED_COMPANIES, POPULAR_GENRES } from '../data/curatedCompanies';
import { MovieCard } from '../components/common/MovieCard';
import { MovieCardSkeleton } from '../components/common/LoadingSkeleton';
import { TMDBMovie, TMDBTVShow } from '../types/tmdb';

interface CompanyPageProps {
  companyId: number;
}

export const CompanyPage: React.FC<CompanyPageProps> = ({ companyId }) => {
  const { navigate, openTrailer, toggleWatchlist, isInWatchlist } = useApp();

  const curated = CURATED_COMPANIES.find((c) => c.id === companyId);

  const [companyDetails, setCompanyDetails] = useState<any>(null);
  const [contentTab, setContentTab] = useState<'movies' | 'tv'>('movies');
  const [items, setItems] = useState<(TMDBMovie | TMDBTVShow)[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Filters
  const [sortBy, setSortBy] = useState('popularity.desc');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  // Fetch company details and catalog
  useEffect(() => {
    let isCancelled = false;

    const loadCompanyData = async () => {
      setIsLoading(true);
      setPage(1);

      try {
        if (contentTab === 'movies') {
          const res = await tmdbApi.getCompanyDetails(companyId, {
            page: 1,
            sort_by: sortBy,
            year: selectedYear || undefined,
            genre: selectedGenre || undefined,
          });

          if (!isCancelled) {
            setCompanyDetails(res.company);
            setItems(res.movies.results || []);
            setTotalPages(res.movies.total_pages || 1);
            setTotalResults(res.movies.total_results || 0);
          }
        } else {
          // Fetch TV catalog separately
          const tvRes = await tmdbApi.getCompanyTV(companyId, {
            page: 1,
            sort_by: sortBy,
            year: selectedYear || undefined,
            genre: selectedGenre || undefined,
          });

          if (!isCancelled) {
            setItems(tvRes.results || []);
            setTotalPages(tvRes.total_pages || 1);
            setTotalResults(tvRes.total_results || 0);
          }
        }
      } catch (err) {
        console.error('Failed to load company catalog:', err);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    loadCompanyData();

    return () => {
      isCancelled = true;
    };
  }, [companyId, contentTab, sortBy, selectedGenre, selectedYear]);

  // Load more pages
  const handleLoadMore = async () => {
    if (page >= totalPages || isLoadingMore) return;
    setIsLoadingMore(true);
    const nextPage = page + 1;

    try {
      if (contentTab === 'movies') {
        const res = await tmdbApi.getCompanyDetails(companyId, {
          page: nextPage,
          sort_by: sortBy,
          year: selectedYear || undefined,
          genre: selectedGenre || undefined,
        });
        setItems((prev) => [...prev, ...(res.movies.results || [])]);
      } else {
        const tvRes = await tmdbApi.getCompanyTV(companyId, {
          page: nextPage,
          sort_by: sortBy,
          year: selectedYear || undefined,
          genre: selectedGenre || undefined,
        });
        setItems((prev) => [...prev, ...(tvRes.results || [])]);
      }
      setPage(nextPage);
    } catch (err) {
      console.error('Load more failed:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const featured = items[0];
  const companyName = companyDetails?.name || curated?.name || `Studio #${companyId}`;
  const companyDesc = companyDetails?.description || curated?.description || '';
  const originCountry = companyDetails?.origin_country || curated?.originCountry || 'US';
  const headquarters = companyDetails?.headquarters || '';
  const logoPath = companyDetails?.logo_path || curated?.logoPath;

  return (
    <div className="pb-20">
      {/* Studio Header Showcase Banner */}
      <div className="relative overflow-hidden border-b border-neutral-800 bg-gradient-to-b from-[#1c1c1c] to-[#0f0f0f] px-4 py-8 md:px-8 md:py-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* Studio Logo Container */}
            <div className="flex h-24 w-40 shrink-0 items-center justify-center rounded-2xl border border-neutral-700 bg-white/95 p-4 shadow-xl">
              {logoPath ? (
                <img
                  src={getTMDBImageUrl(logoPath, 'w300')}
                  alt={companyName}
                  className="max-h-full max-w-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <Building2 className="h-10 w-10 text-neutral-800" />
              )}
            </div>

            {/* Studio Info */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-neutral-400 mb-1">
                <span className="uppercase tracking-widest text-red-500 font-bold">Production Studio</span>
                <span aria-hidden="true">·</span>
                <span className="flex items-center gap-1">
                  <Globe2 className="h-3.5 w-3.5" />
                  {originCountry}
                </span>
                {curated?.founded && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>Est. {curated.founded}</span>
                  </>
                )}
                {headquarters && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {headquarters}
                    </span>
                  </>
                )}
              </div>

              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white font-['Oswald',sans-serif]">
                {companyName}
              </h1>

              {companyDesc && (
                <p className="mt-2 text-xs md:text-sm text-neutral-300 max-w-3xl leading-relaxed">
                  {companyDesc}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 md:px-8 mt-6">
        {/* Content Type Tabs & Filters Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
          {/* Segmented Tab Controls (Zero pill buttons) */}
          <div className="flex items-center gap-1.5 p-1 bg-neutral-900 rounded-xl border border-neutral-800 w-fit">
            <button
              onClick={() => setContentTab('movies')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
                contentTab === 'movies'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Film className="h-3.5 w-3.5 text-red-500" />
              <span>Movies Catalog</span>
            </button>
            <button
              onClick={() => setContentTab('tv')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
                contentTab === 'tv'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Tv className="h-3.5 w-3.5 text-emerald-400" />
              <span>TV Productions</span>
            </button>
          </div>

          {/* Interactive Filters: Sort, Genre, Year */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Sort by */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 pr-8 text-xs font-medium text-neutral-200 focus:border-red-600 focus:outline-none"
              >
                <option value="popularity.desc">Most Popular</option>
                <option value="vote_average.desc">Highest Rated</option>
                <option value="primary_release_date.desc">Newest Releases</option>
                <option value="primary_release_date.asc">Oldest Releases</option>
                <option value="original_title.asc">Title (A - Z)</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
            </div>

            {/* Genre Filter */}
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

            {/* Year Filter */}
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

            {/* Reset Filters */}
            {(selectedGenre || selectedYear || sortBy !== 'popularity.desc') && (
              <button
                onClick={() => {
                  setSelectedGenre('');
                  setSelectedYear('');
                  setSortBy('popularity.desc');
                }}
                title="Reset filters"
                className="flex items-center gap-1 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-neutral-400 hover:text-white hover:bg-neutral-800"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Results Count */}
        <div className="py-4 text-xs text-neutral-400">
          Showing <span className="font-semibold text-white">{items.length}</span> titles from{' '}
          <span className="text-white font-medium">{companyName}</span>
        </div>

        {/* Catalog Grid */}
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
                  key={`${contentTab}-${item.id}`}
                  item={item}
                  mediaTypeOverride={contentTab === 'tv' ? 'tv' : 'movie'}
                />
              ))}
            </div>

            {/* Pagination / Load More */}
            {page < totalPages && (
              <div className="mt-10 flex justify-center">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="flex items-center gap-2 rounded-xl bg-neutral-800 px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:opacity-50"
                >
                  {isLoadingMore ? (
                    <span>Loading more titles...</span>
                  ) : (
                    <span>Load More from {companyName}</span>
                  )}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-800 p-8 text-center">
            <Building2 className="h-10 w-10 text-neutral-600 mb-2" />
            <h3 className="text-base font-semibold text-white">No titles found for this filter</h3>
            <p className="mt-1 text-xs text-neutral-400">
              Try adjusting the genre, release year, or switching between Movies and TV shows.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
