import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  Search,
  X,
  Bookmark,
  SlidersHorizontal,
  Film,
  Tv,
  Building2,
  User as UserIcon,
  Check,
  Compass,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { tmdbApi, getTMDBImageUrl } from '../../services/tmdbApi';
import { SUPPORTED_REGIONS } from '../../data/curatedCompanies';
import { PWAInstallButton } from './PWAInstallButton';

export const Header: React.FC = () => {
  const {
    currentPath,
    navigate,
    toggleSidebar,
    toggleMobileSidebar,
    watchlist,
    userRegion,
    setUserRegion,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isRegionMenuOpen, setIsRegionMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const regionMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  // Debounced search suggestion query (YouTube-style real-time autocomplete)
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
        setSuggestions(res.results.slice(0, 8));
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
      setIsMobileSearchOpen(false);
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSuggestionClick = (item: any) => {
    setIsDropdownOpen(false);
    setIsMobileSearchOpen(false);
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
      {/* Left Section: Menu Toggle, Brand Logo & Primary Quick Nav */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Mobile Hamburger */}
        <button
          onClick={toggleMobileSidebar}
          aria-label="Toggle navigation menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-850 hover:text-white md:hidden transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Desktop Hamburger */}
        <button
          onClick={toggleSidebar}
          aria-label="Toggle sidebar expansion"
          className="hidden h-9 w-9 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-850 hover:text-white md:flex transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Brand */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 transition hover:opacity-95 focus-visible:outline-none"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-red-600 text-white shadow-md shadow-red-950/50">
            <Film className="h-4 w-4" />
          </div>
          <div className="flex items-baseline tracking-tight">
            <span className="font-bold text-sm tracking-wide text-zinc-100">CINE</span>
            <span className="rounded bg-red-600 px-1 py-0.5 text-[9px] font-bold text-white uppercase ml-1 tracking-wider">
              TUBE
            </span>
          </div>
        </button>

        {/* Essential Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 ml-4 border-l border-zinc-800/80 pl-4">
          <button
            onClick={() => navigate('/')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
              currentPath === '/' ? 'text-white bg-zinc-800/70' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => navigate('/movies')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
              currentPath.startsWith('/movies') ? 'text-white bg-zinc-800/70' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Movies
          </button>
          <button
            onClick={() => navigate('/tv-shows')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
              currentPath.startsWith('/tv-shows') ? 'text-white bg-zinc-800/70' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            TV Shows
          </button>
          <button
            onClick={() => navigate('/companies')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
              currentPath === '/companies' ? 'text-white bg-zinc-800/70' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Studios
          </button>
        </nav>
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
              placeholder="Search movies, TV shows, studios, cast..."
              className="h-9 w-full rounded-l-full border border-zinc-800 bg-zinc-900/90 pl-4 pr-8 text-xs text-zinc-100 placeholder-zinc-500 transition-colors focus:border-zinc-600 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-3 text-zinc-500 hover:text-zinc-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <button
            type="submit"
            aria-label="Search"
            className="flex h-9 w-14 items-center justify-center rounded-r-full border border-l-0 border-zinc-800 bg-zinc-850 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 focus-visible:outline-none"
          >
            <Search className="h-3.5 w-3.5" />
          </button>
        </form>

        {/* Live Search Suggestions Dropdown */}
        {isDropdownOpen && searchQuery.trim().length > 0 && (
          <div className="absolute left-0 top-11 z-50 w-full overflow-hidden rounded-2xl border border-zinc-800 bg-[#121215] shadow-2xl backdrop-blur-xl">
            {isSearching && suggestions.length === 0 ? (
              <div className="p-4 text-center text-xs text-zinc-400">Searching catalog...</div>
            ) : suggestions.length > 0 ? (
              <div className="py-1.5">
                <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  Search Suggestions
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
                      className="flex w-full items-center gap-3 px-3.5 py-2 text-left transition hover:bg-zinc-850/80"
                    >
                      {poster ? (
                        <img
                          src={getTMDBImageUrl(poster, 'w92')}
                          alt=""
                          className={`h-9 w-6.5 object-cover bg-zinc-900 ${
                            isPerson
                              ? 'rounded-full h-7 w-7'
                              : isCompany
                              ? 'object-contain h-6 w-6 p-0.5 bg-white rounded'
                              : 'rounded-md'
                          }`}
                        />
                      ) : (
                        <div className="flex h-9 w-6.5 items-center justify-center rounded-md bg-zinc-850 text-zinc-500">
                          {isPerson ? (
                            <UserIcon className="h-3.5 w-3.5" />
                          ) : isTv ? (
                            <Tv className="h-3.5 w-3.5" />
                          ) : isCompany ? (
                            <Building2 className="h-3.5 w-3.5" />
                          ) : (
                            <Film className="h-3.5 w-3.5" />
                          )}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-xs font-medium text-zinc-200">{title}</div>
                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                          <span className="capitalize text-zinc-400">
                            {isPerson ? 'Cast & Crew' : isCompany ? 'Production Studio' : isTv ? 'TV Series' : 'Movie'}
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
                <div className="border-t border-zinc-800/80 p-2">
                  <button
                    onClick={() => handleSearchSubmit()}
                    className="w-full text-center text-xs font-semibold text-rose-400 hover:text-rose-300 py-1"
                  >
                    View all results for &ldquo;{searchQuery}&rdquo; →
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-zinc-400">
                No titles found for &ldquo;{searchQuery}&rdquo;
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Search Overlay */}
      {isMobileSearchOpen && (
        <div className="fixed inset-x-0 top-0 z-50 flex h-14 items-center gap-2 bg-[#09090b] px-3 border-b border-zinc-800 sm:hidden">
          <form onSubmit={handleSearchSubmit} className="flex flex-1 items-center">
            <input
              ref={mobileInputRef}
              autoFocus
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search movies, TV shows..."
              className="h-9 w-full rounded-full border border-zinc-700 bg-zinc-900 px-4 text-xs text-white focus:outline-none"
            />
          </form>
          <button
            onClick={() => handleSearchSubmit()}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-600 text-white"
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsMobileSearchOpen(false)}
            className="flex h-9 w-9 items-center justify-center text-zinc-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Right Section: Mobile Search, PWA Install, Watchlist, Region Selector & Account Profile */}
      <div className="flex items-center gap-1.5 md:gap-2">
        {/* PWA Install Button (Chromium / iOS) */}
        <PWAInstallButton variant="nav" />

        {/* Mobile Search Toggle */}
        <button
          onClick={() => {
            setIsMobileSearchOpen(true);
            setTimeout(() => mobileInputRef.current?.focus(), 100);
          }}
          aria-label="Open search"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-850 hover:text-white sm:hidden transition-colors"
        >
          <Search className="h-4 w-4" />
        </button>

        {/* Region Selector */}
        <div ref={regionMenuRef} className="relative">
          <button
            onClick={() => setIsRegionMenuOpen((prev) => !prev)}
            title={`Watch Providers Region: ${activeRegionObj.name}`}
            aria-label="Select streaming region"
            className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200 transition-colors"
          >
            <span className="text-sm">{activeRegionObj.flag}</span>
            <span className="hidden md:inline font-mono text-[11px] text-zinc-400">{activeRegionObj.code}</span>
          </button>

          {isRegionMenuOpen && (
            <div className="absolute right-0 top-10 z-50 w-48 rounded-2xl border border-zinc-800 bg-[#121215] p-1.5 shadow-2xl backdrop-blur-xl">
              <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Streaming Country
              </div>
              {SUPPORTED_REGIONS.map((reg) => (
                <button
                  key={reg.code}
                  onClick={() => {
                    setUserRegion(reg.code);
                    setIsRegionMenuOpen(false);
                  }}
                  className="flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800/60 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <span>{reg.flag}</span>
                    <span>{reg.name}</span>
                  </span>
                  {userRegion === reg.code && <Check className="h-3.5 w-3.5 text-rose-500" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Watchlist Shortcut */}
        <button
          onClick={() => navigate('/watchlist')}
          aria-label="View Watchlist"
          className="relative flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-850 hover:text-zinc-100 transition-colors"
          title="My Watchlist"
        >
          <Bookmark className="h-4 w-4" />
          {watchlist.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
              {watchlist.length}
            </span>
          )}
        </button>

        {/* Settings Button */}
        <button
          onClick={() => navigate('/settings')}
          aria-label="Settings"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-850 hover:text-zinc-100 transition-colors"
          title="Settings"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>

        {/* Minimalist Profile Avatar Menu */}
        <div ref={profileMenuRef} className="relative ml-0.5">
          <button
            onClick={() => setIsProfileMenuOpen((prev) => !prev)}
            aria-label="User Account Menu"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-850 text-xs font-semibold text-zinc-300 border border-zinc-700/60 hover:border-zinc-500 transition-colors"
          >
            CT
          </button>

          {isProfileMenuOpen && (
            <div className="absolute right-0 top-10 z-50 w-52 rounded-2xl border border-zinc-800 bg-[#121215] p-1.5 shadow-2xl backdrop-blur-xl">
              <div className="border-b border-zinc-800/80 px-3 py-2">
                <div className="text-xs font-semibold text-zinc-200">CineStream</div>
                <div className="text-[10px] text-zinc-500">Multi-Source Player</div>
              </div>
              <div className="pt-1">
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    navigate('/watchlist');
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800/60 transition-colors"
                >
                  <Bookmark className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Watchlist ({watchlist.length})</span>
                </button>
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    navigate('/history');
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800/60 transition-colors"
                >
                  <Film className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Watch History</span>
                </button>
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    navigate('/companies');
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800/60 transition-colors"
                >
                  <Building2 className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Studio Directory</span>
                </button>
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    navigate('/settings');
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800/60 transition-colors"
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
