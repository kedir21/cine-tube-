import {
  ConfiguredCompany,
  ConfiguredNetwork,
  TMDBMovie,
  TMDBTVShow,
  TMDBSeasonDetail,
  TMDBPerson,
  TMDBPaginatedResponse,
  WatchlistItem,
  WatchHistoryItem,
} from '../types/tmdb';

export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

export function getTMDBImageUrl(
  path: string | null | undefined,
  size: 'w92' | 'w154' | 'w185' | 'w300' | 'w342' | 'w500' | 'w780' | 'w1280' | 'h632' | 'original' = 'w500'
): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function getPosterFallback(title: string): string {
  const encoded = encodeURIComponent(title || 'Movie');
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="342" height="513" viewBox="0 0 342 513" fill="%231a1a1a"><rect width="342" height="513" fill="%23181818"/><circle cx="171" cy="220" r="40" fill="%23262626"/><polygon points="163,205 185,220 163,235" fill="%23e50914"/><text x="50%" y="320" font-family="Inter, sans-serif" font-size="16" fill="%23888" font-weight="600" text-anchor="middle">${encoded}</text></svg>`;
}

export function getBackdropFallback(): string {
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720" fill="%230f0f0f"><rect width="1280" height="720" fill="%23141414"/><text x="50%" y="50%" font-family="sans-serif" font-size="24" fill="%23444" text-anchor="middle">Cinematic Preview</text></svg>`;
}

export interface HomeRowsData {
  hero: TMDBMovie | TMDBTVShow;
  trendingToday: (TMDBMovie | TMDBTVShow)[];
  trendingWeek: (TMDBMovie | TMDBTVShow)[];
  popularMovies: TMDBMovie[];
  popularTV: TMDBTVShow[];
  nowPlaying: TMDBMovie[];
  upcoming: TMDBMovie[];
  topRatedMovies: TMDBMovie[];
  topRatedTV: TMDBTVShow[];
  actionMovies: TMDBMovie[];
  comedyMovies: TMDBMovie[];
  dramaMovies: TMDBMovie[];
  scifiMovies: TMDBMovie[];
  animationMovies: TMDBMovie[];
  isFallback?: boolean;
}

export interface APIStatus {
  configured: boolean;
  source: 'env' | 'session' | 'none';
  authType: 'bearer' | 'api_key' | null;
  cacheSize: number;
  message: string;
}

export const tmdbApi = {
  async getStatus(): Promise<APIStatus> {
    const res = await fetch('/api/tmdb/status');
    return res.json();
  },

  async configureToken(token: string): Promise<{ success: boolean; configured: boolean }> {
    const res = await fetch('/api/tmdb/configure', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    return res.json();
  },

  async getHomeRows(): Promise<HomeRowsData> {
    const res = await fetch('/api/tmdb/home-rows');
    if (!res.ok) throw new Error('Failed to load home content');
    return res.json();
  },

  async getCompanies(): Promise<ConfiguredCompany[]> {
    const res = await fetch('/api/tmdb/companies');
    if (!res.ok) throw new Error('Failed to load companies');
    return res.json();
  },

  async getNetworks(): Promise<ConfiguredNetwork[]> {
    const res = await fetch('/api/tmdb/networks');
    if (!res.ok) throw new Error('Failed to load networks');
    return res.json();
  },

  async getCompanyDetails(
    id: number,
    params: { page?: number; sort_by?: string; year?: string; genre?: string } = {}
  ): Promise<{
    company: any;
    movies: TMDBPaginatedResponse<TMDBMovie>;
    isFallback?: boolean;
  }> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.sort_by) query.set('sort_by', params.sort_by);
    if (params.year) query.set('year', params.year);
    if (params.genre) query.set('genre', params.genre);

    const res = await fetch(`/api/tmdb/company/${id}?${query.toString()}`);
    if (!res.ok) throw new Error(`Failed to load company ${id}`);
    return res.json();
  },

  async getCompanyTV(
    id: number,
    params: { page?: number; sort_by?: string; year?: string; genre?: string } = {}
  ): Promise<TMDBPaginatedResponse<TMDBTVShow>> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.sort_by) query.set('sort_by', params.sort_by);
    if (params.year) query.set('year', params.year);
    if (params.genre) query.set('genre', params.genre);

    const res = await fetch(`/api/tmdb/company/${id}/tv?${query.toString()}`);
    if (!res.ok) throw new Error(`Failed to load company TV for ${id}`);
    return res.json();
  },

  async getMovieDetails(id: number): Promise<TMDBMovie> {
    const res = await fetch(`/api/tmdb/movie/${id}`);
    if (!res.ok) throw new Error(`Failed to load movie ${id}`);
    return res.json();
  },

  async getTVDetails(id: number): Promise<TMDBTVShow> {
    const res = await fetch(`/api/tmdb/tv/${id}`);
    if (!res.ok) throw new Error(`Failed to load TV show ${id}`);
    return res.json();
  },

  async getTVSeason(id: number, seasonNumber: number): Promise<TMDBSeasonDetail> {
    const res = await fetch(`/api/tmdb/tv/${id}/season/${seasonNumber}`);
    if (!res.ok) throw new Error(`Failed to load TV season ${seasonNumber}`);
    return res.json();
  },

  async getPersonDetails(id: number): Promise<TMDBPerson> {
    const res = await fetch(`/api/tmdb/person/${id}`);
    if (!res.ok) throw new Error(`Failed to load person ${id}`);
    return res.json();
  },

  async search(query: string, type: string = 'multi', page: number = 1): Promise<TMDBPaginatedResponse<any>> {
    const url = `/api/tmdb/search?q=${encodeURIComponent(query)}&type=${type}&page=${page}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Search request failed');
    return res.json();
  },

  async discoverMovies(params: Record<string, any> = {}): Promise<TMDBPaginatedResponse<TMDBMovie>> {
    const query = new URLSearchParams();
    query.set('path', '/discover/movie');
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.set(k, String(v));
    });
    const res = await fetch(`/api/tmdb/proxy?${query.toString()}`);
    if (!res.ok) throw new Error('Discover movies failed');
    return res.json();
  },

  async discoverTV(params: Record<string, any> = {}): Promise<TMDBPaginatedResponse<TMDBTVShow>> {
    const query = new URLSearchParams();
    query.set('path', '/discover/tv');
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.set(k, String(v));
    });
    const res = await fetch(`/api/tmdb/proxy?${query.toString()}`);
    if (!res.ok) throw new Error('Discover TV failed');
    return res.json();
  },

  async syncWatchlist(items: WatchlistItem[]): Promise<void> {
    try {
      await fetch('/api/user/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ watchlist: items }),
      });
    } catch (e) {
      // Offline fallback
    }
  },

  async syncHistory(items: WatchHistoryItem[]): Promise<void> {
    try {
      await fetch('/api/user/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: items }),
      });
    } catch (e) {
      // Offline fallback
    }
  },
};
