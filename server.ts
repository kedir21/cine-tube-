import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  FALLBACK_TRENDING_MOVIES,
  FALLBACK_TRENDING_TV,
  FALLBACK_STUDIO_MOVIES,
  FALLBACK_EPISODES,
} from './src/data/fallbackData';
import { CURATED_COMPANIES, CURATED_NETWORKS } from './src/data/curatedCompanies';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory runtime session storage
let sessionTmdbToken: string = '';
const cache = new Map<string, { timestamp: number; data: any }>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

// In-memory user state (syncable across sessions)
let serverWatchlist: any[] = [];
let serverWatchHistory: any[] = [];

function getActiveTmdbToken(): { token: string; type: 'bearer' | 'api_key' | null; source: 'env' | 'session' | 'none' } {
  // Check v4 access token from env
  const envV4 = process.env.TMDB_API_READ_ACCESS_TOKEN || process.env.TMDB_READ_ACCESS_TOKEN;
  if (envV4 && envV4.trim() && envV4 !== 'MY_TMDB_API_READ_ACCESS_TOKEN') {
    return { token: envV4.trim(), type: 'bearer', source: 'env' };
  }

  // Check v3 api key from env
  const envV3 = process.env.TMDB_API_KEY || process.env.TMDB_KEY;
  if (envV3 && envV3.trim() && envV3 !== 'MY_TMDB_API_KEY') {
    return { token: envV3.trim(), type: 'api_key', source: 'env' };
  }

  // Check session token
  if (sessionTmdbToken && sessionTmdbToken.trim()) {
    const isV4 = sessionTmdbToken.length > 50 || sessionTmdbToken.startsWith('eyJ');
    return {
      token: sessionTmdbToken.trim(),
      type: isV4 ? 'bearer' : 'api_key',
      source: 'session',
    };
  }

  return { token: '', type: null, source: 'none' };
}

async function fetchFromTMDB(tmdbPath: string, queryParams: Record<string, any> = {}): Promise<any> {
  const { token, type } = getActiveTmdbToken();
  if (!token) {
    throw new Error('NO_TMDB_CREDENTIALS');
  }

  const normalizedPath = tmdbPath.startsWith('/') ? tmdbPath : `/${tmdbPath}`;
  const url = new URL(`https://api.themoviedb.org/3${normalizedPath}`);

  // Append query params
  Object.entries(queryParams).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      url.searchParams.set(k, String(v));
    }
  });

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (type === 'bearer') {
    headers['Authorization'] = `Bearer ${token}`;
  } else if (type === 'api_key') {
    url.searchParams.set('api_key', token);
  }

  const cacheKey = url.toString();
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  // Fetch with simple retry logic
  let attempts = 0;
  let lastError: any = null;

  while (attempts < 2) {
    attempts++;
    try {
      const response = await fetch(url.toString(), {
        headers,
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`TMDB HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      cache.set(cacheKey, { timestamp: Date.now(), data });
      return data;
    } catch (err: any) {
      lastError = err;
      if (attempts >= 2) break;
      await new Promise((res) => setTimeout(res, 500));
    }
  }

  throw lastError;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // API Status & Configuration
  app.get('/api/tmdb/status', (req: Request, res: Response) => {
    const { source, type } = getActiveTmdbToken();
    res.json({
      configured: source !== 'none',
      source,
      authType: type,
      cacheSize: cache.size,
      message:
        source !== 'none'
          ? 'Connected to live TMDB API'
          : 'Running in demonstration snapshot mode with authentic TMDB catalog & YouTube trailers. Add your TMDB token to unlock the entire live TMDB database.',
    });
  });

  app.post('/api/tmdb/configure', (req: Request, res: Response) => {
    const { token } = req.body;
    if (typeof token === 'string') {
      sessionTmdbToken = token.trim();
      cache.clear(); // Clear cached responses to refresh
      const { source, type } = getActiveTmdbToken();
      res.json({
        success: true,
        configured: source !== 'none',
        source,
        authType: type,
      });
    } else {
      res.status(400).json({ error: 'Token string required' });
    }
  });

  // Direct generic TMDB proxy
  app.get('/api/tmdb/proxy', async (req: Request, res: Response) => {
    const tmdbPath = req.query.path as string;
    if (!tmdbPath) {
      return res.status(400).json({ error: 'Missing path query parameter' });
    }

    const queryParams: Record<string, any> = { ...req.query };
    delete queryParams.path;

    try {
      const data = await fetchFromTMDB(tmdbPath, queryParams);
      res.json(data);
    } catch (err: any) {
      if (err.message === 'NO_TMDB_CREDENTIALS') {
        return res.status(401).json({
          error: 'TMDB credentials missing',
          hint: 'Set TMDB_API_READ_ACCESS_TOKEN in .env or configure in CineTube Settings',
        });
      }
      res.status(502).json({ error: err.message || 'Error communicating with TMDB' });
    }
  });

  // Curated Companies List
  app.get('/api/tmdb/companies', (req: Request, res: Response) => {
    res.json(CURATED_COMPANIES);
  });

  // Curated Networks List
  app.get('/api/tmdb/networks', (req: Request, res: Response) => {
    res.json(CURATED_NETWORKS);
  });

  // Company details and catalog
  app.get('/api/tmdb/company/:id', async (req: Request, res: Response) => {
    const companyId = parseInt(req.params.id, 10);
    const curated = CURATED_COMPANIES.find((c) => c.id === companyId);

    const { token } = getActiveTmdbToken();
    if (token) {
      try {
        const [details, moviesData] = await Promise.all([
          fetchFromTMDB(`/company/${companyId}`),
          fetchFromTMDB('/discover/movie', {
            with_companies: companyId,
            sort_by: req.query.sort_by || 'popularity.desc',
            page: req.query.page || 1,
            include_adult: false,
            primary_release_year: req.query.year,
            with_genres: req.query.genre,
          }),
        ]);

        return res.json({
          company: {
            ...details,
            description: details.description || curated?.description || '',
          },
          movies: moviesData,
        });
      } catch (err) {
        console.warn(`TMDB company fetch error for ${companyId}:`, err);
      }
    }

    // Fallback company data
    const fallbackList = FALLBACK_STUDIO_MOVIES[companyId] || FALLBACK_TRENDING_MOVIES;
    res.json({
      company: {
        id: companyId,
        name: curated?.name || `Studio #${companyId}`,
        description: curated?.description || 'Renowned entertainment and cinema production company.',
        headquarters: 'California, United States',
        origin_country: curated?.originCountry || 'US',
        logo_path: curated?.logoPath || null,
        homepage: '',
      },
      movies: {
        page: 1,
        results: fallbackList,
        total_pages: 1,
        total_results: fallbackList.length,
      },
      isFallback: true,
    });
  });

  // Company TV catalog (separate endpoint as required by prompt)
  app.get('/api/tmdb/company/:id/tv', async (req: Request, res: Response) => {
    const companyId = parseInt(req.params.id, 10);
    const { token } = getActiveTmdbToken();

    if (token) {
      try {
        const tvData = await fetchFromTMDB('/discover/tv', {
          with_companies: companyId,
          sort_by: req.query.sort_by || 'popularity.desc',
          page: req.query.page || 1,
          include_adult: false,
          first_air_date_year: req.query.year,
          with_genres: req.query.genre,
        });
        return res.json(tvData);
      } catch (err) {
        console.warn(`TMDB company TV fetch error for ${companyId}:`, err);
      }
    }

    res.json({
      page: 1,
      results: FALLBACK_TRENDING_TV,
      total_pages: 1,
      total_results: FALLBACK_TRENDING_TV.length,
      isFallback: true,
    });
  });

  // High-performance unified home rows endpoint
  app.get('/api/tmdb/home-rows', async (req: Request, res: Response) => {
    const { token } = getActiveTmdbToken();

    if (token) {
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
          fetchFromTMDB('/trending/all/day'),
          fetchFromTMDB('/trending/all/week'),
          fetchFromTMDB('/movie/popular', { page: 1 }),
          fetchFromTMDB('/tv/popular', { page: 1 }),
          fetchFromTMDB('/movie/now_playing', { page: 1 }),
          fetchFromTMDB('/movie/upcoming', { page: 1 }),
          fetchFromTMDB('/movie/top_rated', { page: 1 }),
          fetchFromTMDB('/tv/top_rated', { page: 1 }),
          fetchFromTMDB('/discover/movie', { with_genres: 28, sort_by: 'popularity.desc' }),
          fetchFromTMDB('/discover/movie', { with_genres: 35, sort_by: 'popularity.desc' }),
          fetchFromTMDB('/discover/movie', { with_genres: 18, sort_by: 'popularity.desc' }),
          fetchFromTMDB('/discover/movie', { with_genres: 878, sort_by: 'popularity.desc' }),
          fetchFromTMDB('/discover/movie', { with_genres: 16, sort_by: 'popularity.desc' }),
        ]);

        return res.json({
          hero: trendingToday.results[0] || popularMovies.results[0],
          trendingToday: trendingToday.results.slice(0, 15),
          trendingWeek: trendingWeek.results.slice(0, 15),
          popularMovies: popularMovies.results.slice(0, 15),
          popularTV: popularTV.results.slice(0, 15),
          nowPlaying: nowPlaying.results.slice(0, 15),
          upcoming: upcoming.results.slice(0, 15),
          topRatedMovies: topRatedMovies.results.slice(0, 15),
          topRatedTV: topRatedTV.results.slice(0, 15),
          actionMovies: actionMovies.results.slice(0, 15),
          comedyMovies: comedyMovies.results.slice(0, 15),
          dramaMovies: dramaMovies.results.slice(0, 15),
          scifiMovies: scifiMovies.results.slice(0, 15),
          animationMovies: animationMovies.results.slice(0, 15),
          isFallback: false,
        });
      } catch (err) {
        console.warn('Failed to fetch live home rows from TMDB, using fallback:', err);
      }
    }

    // Rich authentic fallback
    res.json({
      hero: FALLBACK_TRENDING_MOVIES[0],
      trendingToday: FALLBACK_TRENDING_MOVIES,
      trendingWeek: [...FALLBACK_TRENDING_MOVIES].reverse(),
      popularMovies: FALLBACK_TRENDING_MOVIES,
      popularTV: FALLBACK_TRENDING_TV,
      nowPlaying: FALLBACK_TRENDING_MOVIES.slice(0, 5),
      upcoming: FALLBACK_TRENDING_MOVIES.slice(3, 7),
      topRatedMovies: [...FALLBACK_TRENDING_MOVIES].sort((a, b) => b.vote_average - a.vote_average),
      topRatedTV: FALLBACK_TRENDING_TV,
      actionMovies: FALLBACK_TRENDING_MOVIES.filter((m) => m.genre_ids?.includes(28) || m.genres?.some((g) => g.id === 28)),
      comedyMovies: FALLBACK_TRENDING_MOVIES.filter((m) => m.genre_ids?.includes(35) || m.genres?.some((g) => g.id === 35)),
      dramaMovies: FALLBACK_TRENDING_MOVIES.filter((m) => m.genre_ids?.includes(18) || m.genres?.some((g) => g.id === 18)),
      scifiMovies: FALLBACK_TRENDING_MOVIES.filter((m) => m.genre_ids?.includes(878) || m.genres?.some((g) => g.id === 878)),
      animationMovies: FALLBACK_TRENDING_MOVIES.filter((m) => m.genre_ids?.includes(16) || m.genres?.some((g) => g.id === 16)),
      isFallback: true,
    });
  });

  // Movie Details
  app.get('/api/tmdb/movie/:id', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const { token } = getActiveTmdbToken();

    if (token) {
      try {
        const data = await fetchFromTMDB(`/movie/${id}`, {
          append_to_response: 'credits,videos,similar,recommendations,watch/providers',
        });
        return res.json(data);
      } catch (err) {
        console.warn(`TMDB movie fetch error for ${id}:`, err);
      }
    }

    // Fallback movie
    const found =
      FALLBACK_TRENDING_MOVIES.find((m) => m.id === id) ||
      Object.values(FALLBACK_STUDIO_MOVIES)
        .flat()
        .find((m) => m.id === id) ||
      FALLBACK_TRENDING_MOVIES[0];

    res.json({
      ...found,
      isFallback: true,
    });
  });

  // TV Show Details
  app.get('/api/tmdb/tv/:id', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const { token } = getActiveTmdbToken();

    if (token) {
      try {
        const data = await fetchFromTMDB(`/tv/${id}`, {
          append_to_response: 'credits,videos,similar,recommendations,watch/providers',
        });
        return res.json(data);
      } catch (err) {
        console.warn(`TMDB TV fetch error for ${id}:`, err);
      }
    }

    const found = FALLBACK_TRENDING_TV.find((t) => t.id === id) || FALLBACK_TRENDING_TV[0];
    res.json({
      ...found,
      isFallback: true,
    });
  });

  // TV Season & Episodes Details
  app.get('/api/tmdb/tv/:id/season/:seasonNumber', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const seasonNumber = parseInt(req.params.seasonNumber, 10);
    const { token } = getActiveTmdbToken();

    if (token) {
      try {
        const data = await fetchFromTMDB(`/tv/${id}/season/${seasonNumber}`);
        return res.json(data);
      } catch (err) {
        console.warn(`TMDB TV season fetch error for ${id} s${seasonNumber}:`, err);
      }
    }

    res.json({
      id: 144598,
      name: `Season ${seasonNumber}`,
      overview: 'Critical missions and high-stakes survival unfold across this season.',
      season_number: seasonNumber,
      poster_path: '/uKvVjHNqB5VmOrdxqAt2V7JMrHG.jpg',
      air_date: '2023-01-15',
      episodes: FALLBACK_EPISODES,
      isFallback: true,
    });
  });

  // Person Details
  app.get('/api/tmdb/person/:id', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const { token } = getActiveTmdbToken();

    if (token) {
      try {
        const data = await fetchFromTMDB(`/person/${id}`, {
          append_to_response: 'combined_credits',
        });
        return res.json(data);
      } catch (err) {
        console.warn(`TMDB person fetch error for ${id}:`, err);
      }
    }

    res.json({
      id,
      name: 'Christopher Nolan',
      biography:
        'Christopher Edward Nolan is a British-American filmmaker known for his Hollywood blockbusters with complex, non-linear storytelling. He has received numerous accolades including two Academy Awards.',
      birthday: '1970-07-30',
      place_of_birth: 'Westminster, London, England, UK',
      profile_path: '/xuAIuYSmsUzKlUMBFGVZaWsY3Z.jpg',
      known_for_department: 'Directing',
      combined_credits: {
        cast: [],
        crew: FALLBACK_TRENDING_MOVIES,
      },
      isFallback: true,
    });
  });

  // Global Search (movies, tv, people, companies)
  app.get('/api/tmdb/search', async (req: Request, res: Response) => {
    const query = (req.query.q as string) || '';
    const type = (req.query.type as string) || 'multi';
    const page = parseInt(req.query.page as string, 10) || 1;

    if (!query.trim()) {
      return res.json({ page: 1, results: [], total_pages: 0, total_results: 0 });
    }

    const { token } = getActiveTmdbToken();
    if (token) {
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

        const data = await fetchFromTMDB(endpoint, {
          query,
          page,
          include_adult: false,
        });
        return res.json(data);
      } catch (err) {
        console.warn(`TMDB search error for query "${query}":`, err);
      }
    }

    // Local fallback matching
    const qLower = query.toLowerCase();
    const matchingMovies = FALLBACK_TRENDING_MOVIES.filter(
      (m) => m.title.toLowerCase().includes(qLower) || m.overview.toLowerCase().includes(qLower)
    );
    const matchingTV = FALLBACK_TRENDING_TV.filter(
      (t) => t.name.toLowerCase().includes(qLower) || t.overview.toLowerCase().includes(qLower)
    );
    const matchingCompanies = CURATED_COMPANIES.filter(
      (c) => c.name.toLowerCase().includes(qLower) || c.shortName.toLowerCase().includes(qLower)
    );

    const results = [
      ...matchingMovies.map((m) => ({ ...m, media_type: 'movie' })),
      ...matchingTV.map((t) => ({ ...t, media_type: 'tv' })),
      ...matchingCompanies.map((c) => ({
        id: c.id,
        name: c.name,
        logo_path: c.logoPath,
        media_type: 'company',
      })),
    ];

    res.json({
      page: 1,
      results,
      total_pages: 1,
      total_results: results.length,
      isFallback: true,
    });
  });

  // Watchlist Sync Endpoints
  app.get('/api/user/watchlist', (req: Request, res: Response) => {
    res.json(serverWatchlist);
  });

  app.post('/api/user/watchlist', (req: Request, res: Response) => {
    if (Array.isArray(req.body.watchlist)) {
      serverWatchlist = req.body.watchlist;
      res.json({ success: true, count: serverWatchlist.length });
    } else {
      res.status(400).json({ error: 'Watchlist array required' });
    }
  });

  // Watch History Endpoints
  app.get('/api/user/history', (req: Request, res: Response) => {
    res.json(serverWatchHistory);
  });

  app.post('/api/user/history', (req: Request, res: Response) => {
    if (Array.isArray(req.body.history)) {
      serverWatchHistory = req.body.history;
      res.json({ success: true, count: serverWatchHistory.length });
    } else {
      res.status(400).json({ error: 'History array required' });
    }
  });

  // Mount Vite or serve static assets
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎬 CineTube Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server error:', err);
  process.exit(1);
});
