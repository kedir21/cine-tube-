import React from 'react';
import {
  Home,
  Flame,
  Film,
  Tv,
  Star,
  Calendar,
  PlaySquare,
  Bookmark,
  History,
  Building2,
  Tv2,
  SlidersHorizontal,
  Compass,
  Sparkles,
  ChevronRight,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CURATED_COMPANIES, CURATED_NETWORKS, POPULAR_GENRES } from '../../data/curatedCompanies';
import { getTMDBImageUrl } from '../../services/tmdbApi';

export const Sidebar: React.FC = () => {
  const {
    currentPath,
    navigate,
    isSidebarExpanded,
    isMobileSidebarOpen,
    closeMobileSidebar,
  } = useApp();

  const handleNav = (path: string) => {
    navigate(path);
    closeMobileSidebar();
  };

  const isActive = (path: string) => {
    if (path === '/') return currentPath === '/';
    return currentPath.startsWith(path);
  };

  const content = (
    <div className="flex h-full flex-col overflow-y-auto px-2 py-3 text-zinc-300 scrollbar-thin scrollbar-thumb-zinc-800">
      {/* Mobile Close Button */}
      <div className="flex items-center justify-between pb-2 px-2 md:hidden">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Navigation</span>
        <button
          onClick={closeMobileSidebar}
          className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Main Navigation */}
      <div className="space-y-0.5 pb-3">
        <button
          onClick={() => handleNav('/')}
          className={`flex w-full items-center gap-3.5 rounded-lg px-3 py-2 text-xs font-medium transition ${
            isActive('/') && !currentPath.includes('?')
              ? 'bg-zinc-800/80 text-white font-semibold'
              : 'hover:bg-zinc-800/40 hover:text-white text-zinc-400'
          }`}
        >
          <Home className="h-4 w-4 text-red-500" />
          <span className="truncate">Home</span>
        </button>

        <button
          onClick={() => handleNav('/trending')}
          className={`flex w-full items-center gap-4 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
            isActive('/trending')
              ? 'bg-neutral-800 text-white font-semibold'
              : 'hover:bg-neutral-800/70 hover:text-white text-neutral-300'
          }`}
        >
          <Flame className="h-4 w-4 text-amber-500" />
          <span className="truncate">Trending</span>
        </button>

        <button
          onClick={() => handleNav('/movies')}
          className={`flex w-full items-center gap-4 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
            isActive('/movies')
              ? 'bg-neutral-800 text-white font-semibold'
              : 'hover:bg-neutral-800/70 hover:text-white text-neutral-300'
          }`}
        >
          <Film className="h-4 w-4 text-blue-400" />
          <span className="truncate">Movies</span>
        </button>

        <button
          onClick={() => handleNav('/tv-shows')}
          className={`flex w-full items-center gap-4 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
            isActive('/tv-shows')
              ? 'bg-neutral-800 text-white font-semibold'
              : 'hover:bg-neutral-800/70 hover:text-white text-neutral-300'
          }`}
        >
          <Tv className="h-4 w-4 text-emerald-400" />
          <span className="truncate">TV Shows</span>
        </button>

        <button
          onClick={() => handleNav('/movies?sort=top_rated')}
          className={`flex w-full items-center gap-4 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
            currentPath.includes('sort=top_rated')
              ? 'bg-neutral-800 text-white font-semibold'
              : 'hover:bg-neutral-800/70 hover:text-white text-neutral-300'
          }`}
        >
          <Star className="h-4 w-4 text-amber-400" />
          <span className="truncate">Top Rated</span>
        </button>

        <button
          onClick={() => handleNav('/movies?filter=upcoming')}
          className={`flex w-full items-center gap-4 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
            currentPath.includes('filter=upcoming')
              ? 'bg-neutral-800 text-white font-semibold'
              : 'hover:bg-neutral-800/70 hover:text-white text-neutral-300'
          }`}
        >
          <Calendar className="h-4 w-4 text-purple-400" />
          <span className="truncate">Upcoming</span>
        </button>

        <button
          onClick={() => handleNav('/movies?filter=now_playing')}
          className={`flex w-full items-center gap-4 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
            currentPath.includes('filter=now_playing')
              ? 'bg-neutral-800 text-white font-semibold'
              : 'hover:bg-neutral-800/70 hover:text-white text-neutral-300'
          }`}
        >
          <PlaySquare className="h-4 w-4 text-rose-400" />
          <span className="truncate">Now Playing</span>
        </button>
      </div>

      <div className="my-2 border-t border-neutral-800" />

      {/* Library Section */}
      <div className="space-y-0.5 py-1">
        <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
          Library
        </div>
        <button
          onClick={() => handleNav('/watchlist')}
          className={`flex w-full items-center gap-4 rounded-xl px-3 py-2 text-sm font-medium transition ${
            isActive('/watchlist')
              ? 'bg-neutral-800 text-white font-semibold'
              : 'hover:bg-neutral-800/70 hover:text-white text-neutral-300'
          }`}
        >
          <Bookmark className="h-4 w-4 text-red-400" />
          <span className="truncate">My Watchlist</span>
        </button>

        <button
          onClick={() => handleNav('/history')}
          className={`flex w-full items-center gap-4 rounded-xl px-3 py-2 text-sm font-medium transition ${
            isActive('/history')
              ? 'bg-neutral-800 text-white font-semibold'
              : 'hover:bg-neutral-800/70 hover:text-white text-neutral-300'
          }`}
        >
          <History className="h-4 w-4 text-cyan-400" />
          <span className="truncate">Watch History</span>
        </button>
      </div>

      <div className="my-2 border-t border-neutral-800" />

      {/* Production Studios & Companies — Core App Feature */}
      <div className="space-y-0.5 py-1">
        <div className="flex items-center justify-between px-3 py-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
            Studios &amp; Companies
          </span>
          <button
            onClick={() => handleNav('/companies')}
            className="text-[11px] font-medium text-red-400 hover:text-red-300 hover:underline"
          >
            All
          </button>
        </div>

        {CURATED_COMPANIES.map((company) => {
          const isCompanyActive = currentPath === `/company/${company.id}`;
          return (
            <button
              key={company.id}
              onClick={() => handleNav(`/company/${company.id}`)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition group ${
                isCompanyActive
                  ? 'bg-neutral-800 text-white font-semibold shadow-inner'
                  : 'hover:bg-neutral-800/60 hover:text-white text-neutral-300'
              }`}
            >
              {/* Studio Logo or Monogram */}
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-neutral-900 border border-neutral-700/60 p-0.5 overflow-hidden">
                {company.logoPath ? (
                  <img
                    src={getTMDBImageUrl(company.logoPath, 'w92')}
                    alt=""
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                    className="h-full w-full object-contain filter invert brightness-200"
                  />
                ) : (
                  <Building2 className="h-3 w-3 text-neutral-400" />
                )}
              </div>
              <span className="truncate flex-1 text-left">{company.shortName || company.name}</span>
              {isCompanyActive && (
                <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
              )}
            </button>
          );
        })}
      </div>

      <div className="my-2 border-t border-neutral-800" />

      {/* Television Networks & Streaming */}
      <div className="space-y-0.5 py-1">
        <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
          Networks &amp; Streaming
        </div>
        {CURATED_NETWORKS.map((network) => {
          const isNetworkActive = currentPath === `/tv-shows?network=${network.id}`;
          return (
            <button
              key={network.id}
              onClick={() => handleNav(`/tv-shows?network=${network.id}`)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                isNetworkActive
                  ? 'bg-neutral-800 text-white font-semibold'
                  : 'hover:bg-neutral-800/60 hover:text-white text-neutral-300'
              }`}
            >
              <div
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: network.color || '#e50914' }}
              />
              <span className="truncate">{network.name}</span>
            </button>
          );
        })}
      </div>

      <div className="my-2 border-t border-neutral-800" />

      {/* Genres */}
      <div className="space-y-0.5 py-1">
        <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
          Genres
        </div>
        {POPULAR_GENRES.slice(0, 8).map((genre) => (
          <button
            key={genre.id}
            onClick={() => handleNav(`/genre/${genre.id}`)}
            className={`flex w-full items-center gap-4 rounded-xl px-3 py-1.5 text-xs font-medium transition ${
              currentPath === `/genre/${genre.id}`
                ? 'bg-neutral-800 text-white font-semibold'
                : 'hover:bg-neutral-800/60 hover:text-white text-neutral-400'
            }`}
          >
            <Compass className="h-3.5 w-3.5 text-neutral-400" />
            <span className="truncate">{genre.name}</span>
          </button>
        ))}
      </div>

      <div className="my-2 border-t border-neutral-800" />

      {/* Settings & Attribution */}
      <div className="space-y-1 py-1">
        <button
          onClick={() => handleNav('/settings')}
          className={`flex w-full items-center gap-4 rounded-xl px-3 py-2 text-sm font-medium transition ${
            isActive('/settings')
              ? 'bg-neutral-800 text-white font-semibold'
              : 'hover:bg-neutral-800/60 hover:text-white text-neutral-300'
          }`}
        >
          <SlidersHorizontal className="h-4 w-4 text-neutral-400" />
          <span className="truncate">Settings</span>
        </button>

        {/* TMDB Attribution notice */}
        <div className="px-3 pt-3 text-[10px] leading-relaxed text-neutral-400">
          <p className="font-semibold text-neutral-300">TMDB Compliance Notice</p>
          <p className="mt-1">
            This product uses the TMDB API but is not endorsed or certified by TMDB. Film metadata, posters, and credits courtesy of The Movie Database.
          </p>
          <p className="mt-2 text-neutral-400">© 2026 CineTube</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Collapsible: 240px or 72px) */}
      <aside
        className={`hidden md:flex flex-col shrink-0 border-r border-zinc-800/80 bg-[#09090b] transition-all duration-300 ease-in-out ${
          isSidebarExpanded ? 'w-60' : 'w-[72px]'
        }`}
      >
        {isSidebarExpanded ? (
          content
        ) : (
          /* Mini compact bar when collapsed (YouTube style) */
          <div className="flex flex-col items-center gap-4 py-4 text-zinc-400">
            <button
              onClick={() => handleNav('/')}
              className={`flex flex-col items-center gap-1 rounded-lg p-2 transition hover:text-white ${
                isActive('/') ? 'text-red-500 font-semibold' : ''
              }`}
              title="Home"
            >
              <Home className="h-5 w-5" />
              <span className="text-[10px]">Home</span>
            </button>

            <button
              onClick={() => handleNav('/trending')}
              className={`flex flex-col items-center gap-1 rounded-lg p-2 transition hover:text-white ${
                isActive('/trending') ? 'text-amber-500 font-semibold' : ''
              }`}
              title="Trending"
            >
              <Flame className="h-5 w-5" />
              <span className="text-[10px]">Trending</span>
            </button>

            <button
              onClick={() => handleNav('/movies')}
              className={`flex flex-col items-center gap-1 rounded-lg p-2 transition hover:text-white ${
                isActive('/movies') ? 'text-blue-400 font-semibold' : ''
              }`}
              title="Movies"
            >
              <Film className="h-5 w-5" />
              <span className="text-[10px]">Movies</span>
            </button>

            <button
              onClick={() => handleNav('/tv-shows')}
              className={`flex flex-col items-center gap-1 rounded-lg p-2 transition hover:text-white ${
                isActive('/tv-shows') ? 'text-emerald-400 font-semibold' : ''
              }`}
              title="TV Shows"
            >
              <Tv className="h-5 w-5" />
              <span className="text-[10px]">TV</span>
            </button>

            <button
              onClick={() => handleNav('/companies')}
              className={`flex flex-col items-center gap-1 rounded-lg p-2 transition hover:text-white ${
                isActive('/companies') ? 'text-white font-semibold' : ''
              }`}
              title="Studios"
            >
              <Building2 className="h-5 w-5" />
              <span className="text-[10px]">Studios</span>
            </button>

            <button
              onClick={() => handleNav('/watchlist')}
              className={`flex flex-col items-center gap-1 rounded-lg p-2 transition hover:text-white ${
                isActive('/watchlist') ? 'text-red-500 font-semibold' : ''
              }`}
              title="Watchlist"
            >
              <Bookmark className="h-5 w-5" />
              <span className="text-[10px]">Saved</span>
            </button>
          </div>
        )}
      </aside>

      {/* Mobile Drawer with Backdrop */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={closeMobileSidebar}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 bg-[#09090b] shadow-2xl border-r border-zinc-800/80">
            {content}
          </aside>
        </div>
      )}
    </>
  );
};
