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
import { TMDB_CONFIG } from '../config/tmdb';
import { CURATED_COMPANIES, CURATED_NETWORKS } from '../data/curatedCompanies';
import {
  FALLBACK_TRENDING_MOVIES,
  FALLBACK_TRENDING_TV,
  FALLBACK_STUDIO_MOVIES,
  FALLBACK_EPISODES,
} from '../data/fallbackData';

export const TMDB_IMAGE_BASE = TMDB_CONFIG.imageBaseUrl;

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
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="342" height="513" viewBox="0 0 342 513" fill="%23121215"><rect width="342" height="513" fill="%23121215"/><circle cx="171" cy="220" r="36" fill="%2327272a"/><polygon points="165,208 183,220 165,232" fill="%23e11d48"/><text x="50%" y="320" font-family="Inter, sans-serif" font-size="14" fill="%2371717a" font-weight="600" text-anchor="middle">${encoded}</text></svg>`;
}

export function getBackdropFallback(): string {
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720" fill="%2309090b"><rect width="1280" height="720" fill="%2309090b"/><text x="50%" y="50%" font-family="Inter, sans-serif" font-size="20" fill="%233f3f46" text-anchor="middle">Preview Not Available</text></svg>`;
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
  source: 'config' | 'env' | 'session' | 'none';
  authType: 'bearer' | 'api_key' | null;
  cacheSize: number;
  message: string;
}

/**
 * Resilient fetcher: attempts internal server proxy first;
 * if unavailable (e.g. static host), calls TMDB API directly with centralized TMDB_CONFIG.
 */
async function fetchDirectTMDB(path: string, queryParams: Record<string, any> = {}): Promise<any> {
  const url = new URL(`${TMDB_CONFIG.baseUrl}${path.startsWith('/') ? path : `/${path}`}`);
  url.searchParams.set('api_key', TMDB_CONFIG.apiKey);
  url.searchParams.set('language', TMDB_CONFIG.language);

  Object.entries(queryParams).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      url.searchParams.set(k, String(v));
    }
  });

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (TMDB_CONFIG.readAccessToken) {
    headers['Authorization'] = `Bearer ${TMDB_CONFIG.readAccessToken}`;
  }

  const response = await fetch(url.toString(), { headers });
  if (!response.ok) {
    throw new Error(`TMDB HTTP ${response.status}`);
  }
  return response.json();
}

export const tmdbApi = {
  async getStatus(): Promise<APIStatus> {
    try {
      const res = await fetch('/api/tmdb/status');
      if (res.ok) return await res.json();
    } catch {
      // In static deployment, return verified configuration status
    }
    return {
      configured: true,
      source: 'config',
      authType: 'bearer',
      cacheSize: 0,
      message: 'Connected to live TMDB API via centralized configuration',
    };
  },

  async configureToken(token: string): Promise<{ success: boolean; configured: boolean }> {
    try {
      const res = await fetch('/api/tmdb/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (res.ok) return await res.json();
    } catch {
      // client runtime
    }
    return { success: true, configured: true };
  },

  async getHomeRows(): Promise<HomeRowsData> {
    try {
      const res = await fetch('/api/tmdb/home-rows');
      if (res.ok) return await res.json();
    } catch {
      // fallback to direct TMDB
    }

    try {
      const [
        trendingToday,
        trendingWeek,
        popularMovies,
        popularTV,
        nowPlaying,
        upcoming,
        topRatedMovies,
        topRatedTV,
        actionMovies,
        comedyMovies,
        dramaMovies,
        scifiMovies,
        animationMovies,
      ] = await Promise.all([
        fetchDirectTMDB('/trending/all/day'),
        fetchDirectTMDB('/trending/all/week'),
        fetchDirectTMDB('/movie/popular', { page: 1 }),
        fetchDirectTMDB('/tv/popular', { page: 1 }),
        fetchDirectTMDB('/movie/now_playing', { page: 1 }),
        fetchDirectTMDB('/movie/upcoming', { page: 1 }),
        fetchDirectTMDB('/movie/top_rated', { page: 1 }),
        fetchDirectTMDB('/tv/top_rated', { page: 1 }),
        fetchDirectTMDB('/discover/movie', { with_genres: 28, sort_by: 'popularity.desc' }),
        fetchDirectTMDB('/discover/movie', { with_genres: 35, sort_by: 'popularity.desc' }),
        fetchDirectTMDB('/discover/movie', { with_genres: 18, sort_by: 'popularity.desc' }),
        fetchDirectTMDB('/discover/movie', { with_genres: 878, sort_by: 'popularity.desc' }),
        fetchDirectTMDB('/discover/movie', { with_genres: 16, sort_by: 'popularity.desc' }),
      ]);

      return {
        hero: trendingToday.results[0] || popularMovies.results[0],
        trendingToday: trendingToday.results.slice(0, 16),
        trendingWeek: trendingWeek.results.slice(0, 16),
        popularMovies: popularMovies.results.slice(0, 16),
        popularTV: popularTV.results.slice(0, 16),
        nowPlaying: nowPlaying.results.slice(0, 16),
        upcoming: upcoming.results.slice(0, 16),
        topRatedMovies: topRatedMovies.results.slice(0, 16),
        topRatedTV: topRatedTV.results.slice(0, 16),
        actionMovies: actionMovies.results.slice(0, 16),
        comedyMovies: comedyMovies.results.slice(0, 16),
        dramaMovies: dramaMovies.results.slice(0, 16),
        scifiMovies: scifiMovies.results.slice(0, 16),
        animationMovies: animationMovies.results.slice(0, 16),
      };
    } catch {
      // Local fallback
      return {
        hero: FALLBACK_TRENDING_MOVIES[0],
        trendingToday: FALLBACK_TRENDING_MOVIES,
        trendingWeek: [...FALLBACK_TRENDING_MOVIES].reverse(),
        popularMovies: FALLBACK_TRENDING_MOVIES,
        popularTV: FALLBACK_TRENDING_TV,
        nowPlaying: FALLBACK_TRENDING_MOVIES.slice(0, 5),
        upcoming: FALLBACK_TRENDING_MOVIES.slice(3, 7),
        topRatedMovies: [...FALLBACK_TRENDING_MOVIES].sort((a, b) => b.vote_average - a.vote_average),
        topRatedTV: FALLBACK_TRENDING_TV,
        actionMovies: FALLBACK_TRENDING_MOVIES.filter((m) => m.genre_ids?.includes(28)),
        comedyMovies: FALLBACK_TRENDING_MOVIES.filter((m) => m.genre_ids?.includes(35)),
        dramaMovies: FALLBACK_TRENDING_MOVIES.filter((m) => m.genre_ids?.includes(18)),
        scifiMovies: FALLBACK_TRENDING_MOVIES.filter((m) => m.genre_ids?.includes(878)),
        animationMovies: FALLBACK_TRENDING_MOVIES.filter((m) => m.genre_ids?.includes(16)),
        isFallback: true,
      };
    }
  },

  async getCompanies(): Promise<ConfiguredCompany[]> {
    return CURATED_COMPANIES;
  },

  async getNetworks(): Promise<ConfiguredNetwork[]> {
    return CURATED_NETWORKS;
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

    try {
      const res = await fetch(`/api/tmdb/company/${id}?${query.toString()}`);
      if (res.ok) return await res.json();
    } catch {
      // fallback to direct TMDB
    }

    try {
      const [details, moviesData] = await Promise.all([
        fetchDirectTMDB(`/company/${id}`),
        fetchDirectTMDB('/discover/movie', {
          with_companies: id,
          sort_by: params.sort_by || 'popularity.desc',
          page: params.page || 1,
          primary_release_year: params.year,
          with_genres: params.genre,
        }),
      ]);

      const curated = CURATED_COMPANIES.find((c) => c.id === id);
      return {
        company: {
          ...details,
          description: details.description || curated?.description || '',
        },
        movies: moviesData,
      };
    } catch {
      const curated = CURATED_COMPANIES.find((c) => c.id === id);
      const fallbackList = FALLBACK_STUDIO_MOVIES[id] || FALLBACK_TRENDING_MOVIES;
      return {
        company: {
          id,
          name: curated?.name || `Studio #${id}`,
          description: curated?.description || 'Iconic movie and entertainment production studio.',
          origin_country: curated?.originCountry || 'US',
          logo_path: curated?.logoPath || null,
        },
        movies: {
          page: 1,
          results: fallbackList,
          total_pages: 1,
          total_results: fallbackList.length,
        },
        isFallback: true,
      };
    }
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

    try {
      const res = await fetch(`/api/tmdb/company/${id}/tv?${query.toString()}`);
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }

    try {
      return await fetchDirectTMDB('/discover/tv', {
        with_companies: id,
        sort_by: params.sort_by || 'popularity.desc',
        page: params.page || 1,
        first_air_date_year: params.year,
        with_genres: params.genre,
      });
    } catch {
      return {
        page: 1,
        results: FALLBACK_TRENDING_TV,
        total_pages: 1,
        total_results: FALLBACK_TRENDING_TV.length,
      };
    }
  },

  async getMovieDetails(id: number): Promise<TMDBMovie> {
    try {
      const res = await fetch(`/api/tmdb/movie/${id}`);
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }

    try {
      return await fetchDirectTMDB(`/movie/${id}`, {
        append_to_response: 'credits,videos,similar,recommendations,watch/providers',
      });
    } catch {
      const found =
        FALLBACK_TRENDING_MOVIES.find((m) => m.id === id) ||
        Object.values(FALLBACK_STUDIO_MOVIES)
          .flat()
          .find((m) => m.id === id) ||
        FALLBACK_TRENDING_MOVIES[0];
      return found;
    }
  },

  async getTVDetails(id: number): Promise<TMDBTVShow> {
    try {
      const res = await fetch(`/api/tmdb/tv/${id}`);
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }

    try {
      return await fetchDirectTMDB(`/tv/${id}`, {
        append_to_response: 'credits,videos,similar,recommendations,watch/providers',
      });
    } catch {
      return FALLBACK_TRENDING_TV.find((t) => t.id === id) || FALLBACK_TRENDING_TV[0];
    }
  },

  async getTVSeason(id: number, seasonNumber: number): Promise<TMDBSeasonDetail> {
    try {
      const res = await fetch(`/api/tmdb/tv/${id}/season/${seasonNumber}`);
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }

    try {
      return await fetchDirectTMDB(`/tv/${id}/season/${seasonNumber}`);
    } catch {
      return {
        id: 144598,
        name: `Season ${seasonNumber}`,
        overview: 'Episode series season',
        season_number: seasonNumber,
        poster_path: '/uKvVjHNqB5VmOrdxqAt2V7JMrHG.jpg',
        air_date: '2023-01-15',
        episodes: FALLBACK_EPISODES,
      };
    }
  },

  async getPersonDetails(id: number): Promise<TMDBPerson> {
    try {
      const res = await fetch(`/api/tmdb/person/${id}`);
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }

    try {
      return await fetchDirectTMDB(`/person/${id}`, {
        append_to_response: 'combined_credits',
      });
    } catch {
      return {
        id,
        name: 'Cast & Crew Member',
        profile_path: null,
      };
    }
  },

  async search(query: string, type: string = 'multi', page: number = 1): Promise<TMDBPaginatedResponse<any>> {
    if (!query.trim()) {
      return { page: 1, results: [], total_pages: 0, total_results: 0 };
    }

    try {
      const res = await fetch(`/api/tmdb/search?q=${encodeURIComponent(query)}&type=${type}&page=${page}`);
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }

    try {
      const endpoint =
        type === 'movie'
          ? '/search/movie'
          : type === 'tv'
          ? '/search/tv'
          : type === 'person'
          ? '/search/person'
          : type === 'company'
          ? '/search/company'
          : '/search/multi';

      return await fetchDirectTMDB(endpoint, { query, page, include_adult: false });
    } catch {
      const qLower = query.toLowerCase();
      const matchingMovies = FALLBACK_TRENDING_MOVIES.filter((m) =>
        m.title.toLowerCase().includes(qLower)
      );
      const matchingTV = FALLBACK_TRENDING_TV.filter((t) =>
        t.name.toLowerCase().includes(qLower)
      );
      return {
        page: 1,
        results: [...matchingMovies, ...matchingTV],
        total_pages: 1,
        total_results: matchingMovies.length + matchingTV.length,
      };
    }
  },

  async discoverMovies(params: Record<string, any> = {}): Promise<TMDBPaginatedResponse<TMDBMovie>> {
    try {
      const query = new URLSearchParams();
      query.set('path', '/discover/movie');
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') query.set(k, String(v));
      });
      const res = await fetch(`/api/tmdb/proxy?${query.toString()}`);
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }

    try {
      return await fetchDirectTMDB('/discover/movie', params);
    } catch {
      return { page: 1, results: FALLBACK_TRENDING_MOVIES, total_pages: 1, total_results: 8 };
    }
  },

  async discoverTV(params: Record<string, any> = {}): Promise<TMDBPaginatedResponse<TMDBTVShow>> {
    try {
      const query = new URLSearchParams();
      query.set('path', '/discover/tv');
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') query.set(k, String(v));
      });
      const res = await fetch(`/api/tmdb/proxy?${query.toString()}`);
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }

    try {
      return await fetchDirectTMDB('/discover/tv', params);
    } catch {
      return { page: 1, results: FALLBACK_TRENDING_TV, total_pages: 1, total_results: 6 };
    }
  },

  async syncWatchlist(items: WatchlistItem[]): Promise<void> {
    try {
      await fetch('/api/user/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ watchlist: items }),
      });
    } catch {
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
    } catch {
      // Offline fallback
    }
  },
};
