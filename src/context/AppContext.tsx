import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { WatchlistItem, WatchHistoryItem } from '../types/tmdb';
import { tmdbApi, APIStatus } from '../services/tmdbApi';

interface AppContextType {
  currentPath: string;
  navigate: (path: string) => void;
  isSidebarExpanded: boolean;
  toggleSidebar: () => void;
  isMobileSidebarOpen: boolean;
  toggleMobileSidebar: () => void;
  closeMobileSidebar: () => void;

  userRegion: string;
  setUserRegion: (region: string) => void;
  autoplayTrailers: boolean;
  setAutoplayTrailers: (val: boolean) => void;

  watchlist: WatchlistItem[];
  addToWatchlist: (item: Omit<WatchlistItem, 'added_at'>) => void;
  removeFromWatchlist: (id: number, media_type: 'movie' | 'tv') => void;
  toggleWatchlist: (item: Omit<WatchlistItem, 'added_at'>) => void;
  isInWatchlist: (id: number, media_type?: 'movie' | 'tv') => boolean;

  preferredPlayer: 'vidy' | 'viduki' | 'vidzee';
  setPreferredPlayer: (player: 'vidy' | 'viduki' | 'vidzee') => void;
  playerAccentColor: string;
  setPlayerAccentColor: (color: string) => void;

  history: WatchHistoryItem[];
  addToHistory: (item: Omit<WatchHistoryItem, 'watched_at'>) => void;
  updateHistoryProgress: (
    id: number,
    media_type: 'movie' | 'tv',
    progress: Partial<WatchHistoryItem>
  ) => void;
  getSavedProgress: (id: number, media_type: 'movie' | 'tv') => WatchHistoryItem | undefined;
  clearHistory: () => void;

  activeTrailer: { videoKey: string; title: string; mediaType?: 'movie' | 'tv'; mediaId?: number } | null;
  openTrailer: (videoKey: string, title: string, mediaType?: 'movie' | 'tv', mediaId?: number) => void;
  closeTrailer: () => void;

  isApiModalOpen: boolean;
  openApiModal: () => void;
  closeApiModal: () => void;
  apiStatus: APIStatus | null;
  refreshApiStatus: () => Promise<void>;

  isIntroActive: boolean;
  replayIntro: () => void;
  closeIntro: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation based on URL path
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname + window.location.search;
  });

  const navigate = useCallback((path: string) => {
    if (path !== window.location.pathname + window.location.search) {
      window.history.pushState({}, '', path);
      setCurrentPath(path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname + window.location.search);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Sidebar state
  const [isSidebarExpanded, setIsSidebarExpanded] = useState<boolean>(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  const toggleSidebar = () => setIsSidebarExpanded((prev) => !prev);
  const toggleMobileSidebar = () => setIsMobileSidebarOpen((prev) => !prev);
  const closeMobileSidebar = () => setIsMobileSidebarOpen(false);

  // User Preferences
  const [userRegion, setUserRegionState] = useState<string>(() => {
    return localStorage.getItem('cinetube_region') || 'US';
  });

  const setUserRegion = (region: string) => {
    setUserRegionState(region);
    localStorage.setItem('cinetube_region', region);
  };

  const [autoplayTrailers, setAutoplayTrailersState] = useState<boolean>(() => {
    return localStorage.getItem('cinetube_autoplay') !== 'false';
  });

  const setAutoplayTrailers = (val: boolean) => {
    setAutoplayTrailersState(val);
    localStorage.setItem('cinetube_autoplay', String(val));
  };

  // Watchlist
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(() => {
    try {
      const saved = localStorage.getItem('cinetube_watchlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const addToWatchlist = useCallback((item: Omit<WatchlistItem, 'added_at'>) => {
    setWatchlist((prev) => {
      if (prev.some((x) => x.id === item.id && x.media_type === item.media_type)) {
        return prev;
      }
      const updated = [{ ...item, added_at: Date.now() }, ...prev];
      localStorage.setItem('cinetube_watchlist', JSON.stringify(updated));
      tmdbApi.syncWatchlist(updated);
      return updated;
    });
  }, []);

  const removeFromWatchlist = useCallback((id: number, media_type: 'movie' | 'tv') => {
    setWatchlist((prev) => {
      const updated = prev.filter((x) => !(x.id === id && x.media_type === media_type));
      localStorage.setItem('cinetube_watchlist', JSON.stringify(updated));
      tmdbApi.syncWatchlist(updated);
      return updated;
    });
  }, []);

  const isInWatchlist = useCallback(
    (id: number, media_type?: 'movie' | 'tv') => {
      if (media_type) {
        return watchlist.some((x) => x.id === id && x.media_type === media_type);
      }
      return watchlist.some((x) => x.id === id);
    },
    [watchlist]
  );

  const toggleWatchlist = useCallback(
    (item: Omit<WatchlistItem, 'added_at'>) => {
      if (isInWatchlist(item.id, item.media_type)) {
        removeFromWatchlist(item.id, item.media_type);
      } else {
        addToWatchlist(item);
      }
    },
    [isInWatchlist, removeFromWatchlist, addToWatchlist]
  );

  // Video Player Preferences
  const [preferredPlayer, setPreferredPlayerState] = useState<'vidy' | 'viduki' | 'vidzee'>(() => {
    return (localStorage.getItem('cinetube_player') as any) || 'vidy';
  });

  const setPreferredPlayer = (player: 'vidy' | 'viduki' | 'vidzee') => {
    setPreferredPlayerState(player);
    localStorage.setItem('cinetube_player', player);
  };

  const [playerAccentColor, setPlayerAccentColorState] = useState<string>(() => {
    return localStorage.getItem('cinetube_player_color') || 'DC2626';
  });

  const setPlayerAccentColor = (color: string) => {
    setPlayerAccentColorState(color);
    localStorage.setItem('cinetube_player_color', color);
  };

  // Watch History
  const [history, setHistory] = useState<WatchHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('cinetube_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const addToHistory = useCallback((item: Omit<WatchHistoryItem, 'watched_at'>) => {
    setHistory((prev) => {
      const existing = prev.find((x) => x.id === item.id && x.media_type === item.media_type);
      const filtered = prev.filter((x) => !(x.id === item.id && x.media_type === item.media_type));
      // Preserve existing progress if not provided in new item
      const mergedItem: WatchHistoryItem = {
        ...existing,
        ...item,
        watched_at: Date.now(),
      };
      const updated = [mergedItem, ...filtered].slice(0, 50);
      localStorage.setItem('cinetube_history', JSON.stringify(updated));
      tmdbApi.syncHistory(updated);
      return updated;
    });
  }, []);

  const updateHistoryProgress = useCallback(
    (id: number, media_type: 'movie' | 'tv', progress: Partial<WatchHistoryItem>) => {
      setHistory((prev) => {
        const index = prev.findIndex((x) => x.id === id && x.media_type === media_type);
        if (index === -1) return prev;
        const updatedList = [...prev];
        updatedList[index] = {
          ...updatedList[index],
          ...progress,
          watched_at: Date.now(),
        };
        localStorage.setItem('cinetube_history', JSON.stringify(updatedList));
        tmdbApi.syncHistory(updatedList);
        return updatedList;
      });
    },
    []
  );

  const getSavedProgress = useCallback(
    (id: number, media_type: 'movie' | 'tv'): WatchHistoryItem | undefined => {
      return history.find((x) => x.id === id && x.media_type === media_type);
    },
    [history]
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem('cinetube_history');
    tmdbApi.syncHistory([]);
  }, []);

  // Active Trailer
  const [activeTrailer, setActiveTrailer] = useState<{
    videoKey: string;
    title: string;
    mediaType?: 'movie' | 'tv';
    mediaId?: number;
  } | null>(null);

  const openTrailer = (videoKey: string, title: string, mediaType?: 'movie' | 'tv', mediaId?: number) => {
    setActiveTrailer({ videoKey, title, mediaType, mediaId });
    if (mediaId && mediaType) {
      addToHistory({
        id: mediaId,
        media_type: mediaType,
        title,
        poster_path: null,
        backdrop_path: null,
      });
    }
  };

  const closeTrailer = () => setActiveTrailer(null);

  // TMDB API Setup Modal & Status
  const [isApiModalOpen, setIsApiModalOpen] = useState<boolean>(false);
  const [apiStatus, setApiStatus] = useState<APIStatus | null>(null);

  const refreshApiStatus = useCallback(async () => {
    try {
      const status = await tmdbApi.getStatus();
      setApiStatus(status);
    } catch (e) {
      console.warn('Could not fetch TMDB status:', e);
    }
  }, []);

  useEffect(() => {
    refreshApiStatus();
  }, [refreshApiStatus]);

  const openApiModal = () => setIsApiModalOpen(true);
  const closeApiModal = () => setIsApiModalOpen(false);

  // 3D Skeleton Intro Animation State (First visit check)
  const [isIntroActive, setIsIntroActive] = useState<boolean>(() => {
    try {
      return localStorage.getItem('cinetube_intro_viewed') !== 'true';
    } catch {
      return false;
    }
  });

  const replayIntro = useCallback(() => {
    setIsIntroActive(true);
  }, []);

  const closeIntro = useCallback(() => {
    setIsIntroActive(false);
    try {
      localStorage.setItem('cinetube_intro_viewed', 'true');
    } catch {
      // ignore
    }
  }, []);

  return (
    <AppContext.Provider
      value={{
        currentPath,
        navigate,
        isSidebarExpanded,
        toggleSidebar,
        isMobileSidebarOpen,
        toggleMobileSidebar,
        closeMobileSidebar,
        userRegion,
        setUserRegion,
        autoplayTrailers,
        setAutoplayTrailers,
        watchlist,
        addToWatchlist,
        removeFromWatchlist,
        toggleWatchlist,
        isInWatchlist,
        preferredPlayer,
        setPreferredPlayer,
        playerAccentColor,
        setPlayerAccentColor,
        history,
        addToHistory,
        updateHistoryProgress,
        getSavedProgress,
        clearHistory,
        activeTrailer,
        openTrailer,
        closeTrailer,
        isApiModalOpen,
        openApiModal,
        closeApiModal,
        apiStatus,
        refreshApiStatus,
        isIntroActive,
        replayIntro,
        closeIntro,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
};
