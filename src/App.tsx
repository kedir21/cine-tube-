/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { TrailerModal } from './components/common/TrailerModal';
import { ApiSetupModal } from './components/common/ApiSetupModal';

// Pages
import { HomePage } from './pages/HomePage';
import { CompanyPage } from './pages/CompanyPage';
import { CompaniesDirectoryPage } from './pages/CompaniesDirectoryPage';
import { MovieDetailsPage } from './pages/MovieDetailsPage';
import { TVDetailsPage } from './pages/TVDetailsPage';
import { PersonPage } from './pages/PersonPage';
import { SearchPage } from './pages/SearchPage';
import { CatalogPage } from './pages/CatalogPage';
import { WatchlistPage } from './pages/WatchlistPage';
import { HistoryPage } from './pages/HistoryPage';
import { WatchPage } from './pages/WatchPage';
import { SettingsPage } from './pages/SettingsPage';
import { Key, X } from 'lucide-react';

const AppContent: React.FC = () => {
  const { currentPath, apiStatus, openApiModal } = useApp();
  const [bannerDismissed, setBannerDismissed] = React.useState(false);

  // Router dispatcher
  const renderRoute = () => {
    const url = new URL(currentPath, 'http://localhost');
    const path = url.pathname;

    // Home
    if (path === '/' || path === '') {
      return <HomePage />;
    }

    // Company dedicated studio catalog: /company/:id
    const companyMatch = path.match(/^\/company\/(\d+)$/);
    if (companyMatch) {
      return <CompanyPage companyId={parseInt(companyMatch[1], 10)} />;
    }

    // Companies directory: /companies
    if (path === '/companies') {
      return <CompaniesDirectoryPage />;
    }

    // Movie details: /movie/:id
    const movieMatch = path.match(/^\/movie\/(\d+)$/);
    if (movieMatch) {
      return <MovieDetailsPage movieId={parseInt(movieMatch[1], 10)} />;
    }

    // TV details: /tv/:id
    const tvMatch = path.match(/^\/tv\/(\d+)/);
    if (tvMatch) {
      return <TVDetailsPage tvId={parseInt(tvMatch[1], 10)} />;
    }

    // Person details: /person/:id
    const personMatch = path.match(/^\/person\/(\d+)$/);
    if (personMatch) {
      return <PersonPage personId={parseInt(personMatch[1], 10)} />;
    }

    // Search: /search
    if (path.startsWith('/search')) {
      return <SearchPage />;
    }

    // Trending: /trending
    if (path === '/trending') {
      return <CatalogPage type="trending" />;
    }

    // Movies catalog: /movies
    if (path === '/movies') {
      return <CatalogPage type="movie" />;
    }

    // TV catalog: /tv-shows
    if (path === '/tv-shows') {
      return <CatalogPage type="tv" />;
    }

    // Genre catalog: /genre/:id
    const genreMatch = path.match(/^\/genre\/(\d+)$/);
    if (genreMatch) {
      return <CatalogPage type="genre" genreId={parseInt(genreMatch[1], 10)} />;
    }

    // Watchlist: /watchlist
    if (path === '/watchlist') {
      return <WatchlistPage />;
    }

    // Watch history: /history
    if (path === '/history') {
      return <HistoryPage />;
    }

    // Watch / Player page: /watch/:type/:id
    const watchMatch = path.match(/^\/watch\/(movie|tv)\/(\d+)$/);
    if (watchMatch) {
      return (
        <WatchPage
          mediaType={watchMatch[1] as 'movie' | 'tv'}
          mediaId={parseInt(watchMatch[2], 10)}
        />
      );
    }

    // Settings: /settings
    if (path === '/settings') {
      return <SettingsPage />;
    }

    // Fallback default
    return <HomePage />;
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#0f0f0f] text-neutral-100">
      {/* Sticky Top Header */}
      <Header />

      {/* Dismissible API Notification Banner if not configured yet */}
      {!bannerDismissed && apiStatus && !apiStatus.configured && (
        <div className="flex items-center justify-between border-b border-amber-900/50 bg-amber-950/40 px-4 py-2 text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-amber-400 shrink-0" />
            <span>
              <strong>Demo Snapshot Active:</strong> Displaying authentic TMDB catalog &amp; YouTube trailers. To query TMDB’s full live database, connect your TMDB token.
            </span>
            <button
              onClick={openApiModal}
              className="ml-2 underline font-semibold text-white hover:text-amber-100"
            >
              Connect API Key
            </button>
          </div>
          <button
            onClick={() => setBannerDismissed(true)}
            aria-label="Dismiss banner"
            className="text-amber-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Layout Area: Persistent Left Sidebar + Main Content */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        {/* Scrollable Main Viewport */}
        <main className="flex-1 overflow-y-auto bg-[#0f0f0f] scrollbar-thin scrollbar-thumb-neutral-800">
          {renderRoute()}
        </main>
      </div>

      {/* Modals */}
      <TrailerModal />
      <ApiSetupModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
