import React, { useEffect, useState } from 'react';
import { Search, Film, Tv, User, Building2, SlidersHorizontal, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { tmdbApi, getTMDBImageUrl } from '../services/tmdbApi';
import { MovieCard } from '../components/common/MovieCard';
import { MovieCardSkeleton } from '../components/common/LoadingSkeleton';

export const SearchPage: React.FC = () => {
  const { currentPath, navigate } = useApp();

  // Extract query from URL ?q=...
  const urlParams = new URLSearchParams(window.location.search);
  const initialQuery = urlParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<'multi' | 'movie' | 'tv' | 'person' | 'company'>('multi');
  const [results, setResults] = useState<any[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('q') || '';
    setQuery(q);
  }, [currentPath]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setTotalResults(0);
      return;
    }

    let isCancelled = false;

    const performSearch = async () => {
      setIsLoading(true);
      try {
        const res = await tmdbApi.search(query.trim(), activeTab, page);
        if (!isCancelled) {
          setResults(res.results || []);
          setTotalResults(res.total_results || res.results?.length || 0);
          setTotalPages(res.total_pages || 1);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    performSearch();

    return () => {
      isCancelled = true;
    };
  }, [query, activeTab, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 pb-20">
      {/* Search Input Bar */}
      <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto mb-8">
        <div className="relative flex items-center">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search TMDB movies, TV shows, actors, studios..."
            className="h-12 w-full rounded-2xl border border-neutral-700 bg-neutral-900 pl-12 pr-28 text-sm text-neutral-100 placeholder-neutral-500 shadow-xl focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
          />
          <Search className="pointer-events-none absolute left-4 h-5 w-5 text-neutral-400" />
          <button
            type="submit"
            className="absolute right-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-500 transition"
          >
            Search
          </button>
        </div>
      </form>

      {/* Category Tabs */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-6">
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-neutral-900 rounded-xl border border-neutral-800">
          <button
            onClick={() => {
              setActiveTab('multi');
              setPage(1);
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'multi' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
            }`}
          >
            All Results
          </button>
          <button
            onClick={() => {
              setActiveTab('movie');
              setPage(1);
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'movie' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Movies
          </button>
          <button
            onClick={() => {
              setActiveTab('tv');
              setPage(1);
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'tv' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
            }`}
          >
            TV Shows
          </button>
          <button
            onClick={() => {
              setActiveTab('person');
              setPage(1);
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'person' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
            }`}
          >
            People
          </button>
          <button
            onClick={() => {
              setActiveTab('company');
              setPage(1);
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'company' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Studios
          </button>
        </div>

        {query && (
          <div className="text-xs text-neutral-400 hidden sm:block">
            {totalResults} results found for &ldquo;<span className="text-white font-medium">{query}</span>&rdquo;
          </div>
        )}
      </div>

      {/* Results Content */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <MovieCardSkeleton key={i} />
          ))}
        </div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {results.map((item) => {
            const isPerson = item.media_type === 'person' || activeTab === 'person' || item.known_for_department;
            const isCompany = item.media_type === 'company' || activeTab === 'company' || item.origin_country !== undefined;

            if (isPerson) {
              return (
                <button
                  key={`person-${item.id}`}
                  onClick={() => navigate(`/person/${item.id}`)}
                  className="group flex flex-col text-left transition hover:opacity-90"
                >
                  <div className="aspect-[2/3] w-full overflow-hidden rounded-xl bg-neutral-900 border border-neutral-800">
                    {item.profile_path ? (
                      <img
                        src={getTMDBImageUrl(item.profile_path, 'h632')}
                        alt={item.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-neutral-600">
                        <User className="h-10 w-10" />
                      </div>
                    )}
                  </div>
                  <div className="mt-2 text-xs font-semibold text-neutral-200 group-hover:text-red-400 truncate">
                    {item.name}
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    {item.known_for_department || 'Cast & Crew'}
                  </div>
                </button>
              );
            }

            if (isCompany) {
              return (
                <button
                  key={`company-${item.id}`}
                  onClick={() => navigate(`/company/${item.id}`)}
                  className="group flex flex-col items-center justify-center rounded-xl border border-neutral-800 bg-[#161616] p-4 text-center hover:border-neutral-600 hover:bg-neutral-800 transition"
                >
                  <div className="h-14 w-full flex items-center justify-center mb-2">
                    {item.logo_path ? (
                      <img
                        src={getTMDBImageUrl(item.logo_path, 'w185')}
                        alt={item.name}
                        className="max-h-full max-w-full object-contain filter invert brightness-200"
                      />
                    ) : (
                      <Building2 className="h-8 w-8 text-neutral-500" />
                    )}
                  </div>
                  <div className="text-xs font-semibold text-white truncate w-full">{item.name}</div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">Production Studio</div>
                </button>
              );
            }

            return (
              <MovieCard
                key={`${item.media_type || activeTab}-${item.id}`}
                item={item}
                mediaTypeOverride={activeTab === 'tv' ? 'tv' : activeTab === 'movie' ? 'movie' : undefined}
              />
            );
          })}
        </div>
      ) : query.trim() ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-800 p-8 text-center">
          <AlertCircle className="h-10 w-10 text-neutral-600 mb-2" />
          <h3 className="text-base font-semibold text-white">No results found</h3>
          <p className="mt-1 text-xs text-neutral-400 max-w-sm">
            We couldn’t find any matches for &ldquo;{query}&rdquo; in this category. Try checking the spelling or searching for another title.
          </p>
        </div>
      ) : (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-neutral-800/80 p-8 text-center">
          <Search className="h-12 w-12 text-neutral-600 mb-2" />
          <h3 className="text-base font-semibold text-white">Explore The Movie Database</h3>
          <p className="mt-1 text-xs text-neutral-400 max-w-sm">
            Search for your favorite movies, television series, directors, actors, or production studios above.
          </p>
        </div>
      )}
    </div>
  );
};
