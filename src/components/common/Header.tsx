import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  Search,
  X,
  Bookmark,
  SlidersHorizontal,
  Key,
  Film,
  Tv,
  Building2,
  User as UserIcon,
  Globe,
  Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { tmdbApi, getTMDBImageUrl } from '../../services/tmdbApi';
import { SUPPORTED_REGIONS } from '../../data/curatedCompanies';

export const Header: React.FC = () => {
  const {
    navigate,
    toggleSidebar,
    toggleMobileSidebar,
    watchlist,
    userRegion,
    setUserRegion,
    openApiModal,
    apiStatus,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isRegionMenuOpen, setIsRegionMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const regionMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Debounced search suggestion query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await tmdbApi.search(searchQuery, 'multi', 1);
        setSuggestions(res.results.slice(0, 7));
      } catch (err) {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (regionMenuRef.current && !regionMenuRef.current.contains(e.target as Node)) {
        setIsRegionMenuOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      setIsDropdownOpen(false);
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSuggestionClick = (item: any) => {
    setIsDropdownOpen(false);
    setSearchQuery('');
    if (item.media_type === 'movie' || (!item.media_type && item.title)) {
      navigate(`/movie/${item.id}`);
    } else if (item.media_type === 'tv' || (!item.media_type && item.name && !item.known_for_department)) {
      navigate(`/tv/${item.id}`);
    } else if (item.media_type === 'person' || item.known_for_department) {
      navigate(`/person/${item.id}`);
    } else if (item.media_type === 'company' || item.origin_country) {
      navigate(`/company/${item.id}`);
    } else {
      navigate(`/search?q=${encodeURIComponent(item.name || item.title)}`);
    }
  };

  const activeRegionObj = SUPPORTED_REGIONS.find((r) => r.code === userRegion) || SUPPORTED_REGIONS[0];

  return (
    <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-zinc-800/80 bg-[#09090b]/95 px-3 md:px-5 backdrop-blur-md">
      {/* Left Section: Menu Toggle & Brand Logo */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Mobile Hamburger */}
        <button
          onClick={toggleMobileSidebar}
          aria-label="Toggle navigation menu"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800/60 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500 md:hidden transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Desktop Hamburger */}
        <button
          onClick={toggleSidebar}
          aria-label="Toggle sidebar expansion"
          className="hidden h-10 w-10 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800/60 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500 md:flex transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Brand */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 transition hover:opacity-90 focus-visible:outline-none"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-red-600 text-white shadow-sm shadow-red-950">
            <Film className="h-4 w-4" />
          </div>
          <div className="flex items-baseline tracking-tight">
            <span className="font-bold text-base text-zinc-100 tracking-wider">CINE</span>
            <span className="rounded bg-red-600/90 px-1 py-0.2 text-[10px] font-bold text-white uppercase ml-1 tracking-wider">TUBE</span>
          </div>
        </button>
      </div>

      {/* Center Section: YouTube-style Global Search Field */}
      <div ref={searchContainerRef} className="relative mx-3 max-w-xl flex-1 hidden sm:block">
        <form onSubmit={handleSearchSubmit} className="flex w-full items-center">
          <div className="relative flex flex-1 items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              placeholder="Search movies, TV shows, studios, directors, actors..."
              className="h-9 w-full rounded-l-lg border border-zinc-800 bg-zinc-900/90 pl-3.5 pr-8 text-xs text-zinc-100 placeholder-zinc-500 transition-colors focus:border-zinc-600 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search text"
                className="absolute right-2.5 text-zinc-500 hover:text-zinc-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <button
            type="submit"
            aria-label="Search"
            className="flex h-9 w-12 items-center justify-center rounded-r-lg border border-l-0 border-zinc-800 bg-zinc-850 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 focus-visible:outline-none"
          >
            <Search className="h-3.5 w-3.5" />
          </button>
        </form>

        {/* Live Search Suggestions Dropdown */}
        {isDropdownOpen && searchQuery.trim().length > 0 && (
          <div className="absolute left-0 top-11 z-50 w-full overflow-hidden rounded-xl border border-zinc-800 bg-[#121215] shadow-2xl backdrop-blur-xl">
            {isSearching && suggestions.length === 0 ? (
              <div className="p-3 text-center text-xs text-zinc-400">Searching TMDB...</div>
            ) : suggestions.length > 0 ? (
              <div className="py-1.5">
                <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  Instant Suggestions
                </div>
                {suggestions.map((item) => {
                  const title = item.title || item.name;
                  const year = (item.release_date || item.first_air_date || '').slice(0, 4);
                  const isTv = item.media_type === 'tv' || (!item.media_type && item.first_air_date);
                  const isPerson = item.media_type === 'person' || item.known_for_department;
                  const isCompany = item.media_type === 'company';
                  const poster = item.poster_path || item.profile_path || item.logo_path;

                  return (
                    <button
                      key={`${item.media_type || 'item'}-${item.id}`}
                      onClick={() => handleSuggestionClick(item)}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left transition hover:bg-zinc-800/60"
                    >
                      {poster ? (
                        <img
                          src={getTMDBImageUrl(poster, 'w92')}
                          alt=""
                          className={`h-9 w-6.5 object-cover bg-zinc-900 ${
                            isPerson ? 'rounded-full h-7 w-7' : isCompany ? 'object-contain h-6 w-6 p-0.5 bg-white rounded' : 'rounded'
                          }`}
                        />
                      ) : (
                        <div className="flex h-9 w-6.5 items-center justify-center rounded bg-zinc-850 text-zinc-500">
                          {isPerson ? <UserIcon className="h-3.5 w-3.5" /> : isTv ? <Tv className="h-3.5 w-3.5" /> : isCompany ? <Building2 className="h-3.5 w-3.5" /> : <Film className="h-3.5 w-3.5" />}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-xs font-medium text-zinc-200">{title}</div>
                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                          <span className="capitalize text-neutral-300">
                            {isPerson ? 'Person' : isCompany ? 'Production Studio' : isTv ? 'TV Series' : 'Movie'}
                          </span>
                          {year && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>{year}</span>
                            </>
                          )}
                          {item.vote_average > 0 && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-amber-400">★ {item.vote_average.toFixed(1)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
                <div className="border-t border-neutral-700/60 p-2">
                  <button
                    onClick={() => handleSearchSubmit()}
                    className="w-full text-center text-xs font-medium text-red-400 hover:text-red-300 py-1"
                  >
                    View all results for &ldquo;{searchQuery}&rdquo; →
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-neutral-400">
                No TMDB titles found for &ldquo;{searchQuery}&rdquo;
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Section: Watchlist, Region Selector, API Key & Profile */}
      <div className="flex items-center gap-1 md:gap-2">
        {/* Mobile Search Button */}
        <button
          onClick={() => navigate('/search')}
          aria-label="Open search page"
          className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-300 hover:bg-neutral-800 sm:hidden"
        >
          <Search className="h-4 w-4" />
        </button>

        {/* Region Selector */}
        <div ref={regionMenuRef} className="relative">
          <button
            onClick={() => setIsRegionMenuOpen((prev) => !prev)}
            title={`Streaming Watch Providers Region: ${activeRegionObj.name}`}
            aria-label="Select streaming providers region"
            className="flex h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200 focus-visible:outline-none transition-colors"
          >
            <span className="text-sm">{activeRegionObj.flag}</span>
            <span className="hidden md:inline font-mono text-[11px]">{activeRegionObj.code}</span>
          </button>

          {isRegionMenuOpen && (
            <div className="absolute right-0 top-11 z-50 w-48 rounded-xl border border-zinc-800 bg-[#121215] p-1.5 shadow-xl backdrop-blur-xl">
              <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Watch Provider Region
              </div>
              {SUPPORTED_REGIONS.map((reg) => (
                <button
                  key={reg.code}
                  onClick={() => {
                    setUserRegion(reg.code);
                    setIsRegionMenuOpen(false);
                  }}
                  className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800/60 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <span>{reg.flag}</span>
                    <span>{reg.name}</span>
                  </span>
                  {userRegion === reg.code && <Check className="h-3.5 w-3.5 text-red-500" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* TMDB API Key / Status Button */}
        <button
          onClick={openApiModal}
          title={apiStatus?.configured ? 'TMDB API is Live & Connected' : 'Configure TMDB API Token'}
          aria-label="TMDB API status"
          className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium bg-emerald-950/40 text-emerald-400 border border-emerald-800/50 hover:bg-emerald-900/30 transition-colors"
        >
          <Key className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">
            TMDB Live
          </span>
        </button>

        {/* Watchlist Shortcut */}
        <button
          onClick={() => navigate('/watchlist')}
          aria-label="View Watchlist"
          className="relative flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100 focus-visible:outline-none transition-colors"
          title="My Watchlist"
        >
          <Bookmark className="h-4 w-4" />
          {watchlist.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
              {watchlist.length}
            </span>
          )}
        </button>

        {/* Settings Button */}
        <button
          onClick={() => navigate('/settings')}
          aria-label="Application Settings"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100 focus-visible:outline-none transition-colors"
          title="Settings"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>

        {/* User Profile Menu */}
        <div ref={profileMenuRef} className="relative ml-1">
          <button
            onClick={() => setIsProfileMenuOpen((prev) => !prev)}
            aria-label="User Account Menu"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-850 text-xs font-semibold text-zinc-300 border border-zinc-700/80 hover:border-zinc-500 focus-visible:outline-none transition-colors"
          >
            CT
          </button>

          {isProfileMenuOpen && (
            <div className="absolute right-0 top-11 z-50 w-52 rounded-xl border border-zinc-800 bg-[#121215] p-1.5 shadow-2xl backdrop-blur-xl">
              <div className="border-b border-zinc-800/80 px-3 py-2">
                <div className="text-xs font-semibold text-zinc-200">CineTube Explorer</div>
                <div className="text-[10px] text-zinc-500">TMDB Powered Catalog</div>
              </div>
              <div className="pt-1">
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    navigate('/watchlist');
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800/60 transition-colors"
                >
                  <Bookmark className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Watchlist ({watchlist.length})</span>
                </button>
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    navigate('/history');
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800/60 transition-colors"
                >
                  <Film className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Watch History</span>
                </button>
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    navigate('/companies');
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800/60 transition-colors"
                >
                  <Building2 className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Studio Directory</span>
                </button>
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    navigate('/settings');
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800/60 transition-colors"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Settings &amp; Sources</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
