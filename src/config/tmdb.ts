/**
 * Centralized TMDB API Configuration
 *
 * Stores official TMDB API keys, base endpoints, image path configurations,
 * and request options without requiring a .env file.
 */

export const TMDB_CONFIG = {
  // Official TMDB API Key (v3 authentication)
  apiKey: '5e6a638a16f35974c254b7e6da34619d',

  // Official TMDB Read Access Token (v4 Bearer authentication)
  readAccessToken:
    'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI1ZTZhNjM4YTE2ZjM1OTc0YzI1NGI3ZTZkYTM0NjE5ZCIsIm5iZiI6MTY3ODk5NTgyMS4xNzIsInN1YiI6IjY0MTM3MTZkMzIzZWJhMDEwYjkzMDJmNiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.fs8MDiKlMApuX5CBceqz54LswCOjrmA-tm-90lsOoek',

  // TMDB API Base Endpoints
  baseUrl: 'https://api.themoviedb.org/3',
  imageBaseUrl: 'https://image.tmdb.org/t/p',

  // Request defaults
  language: 'en-US',
  timeoutMs: 12000,
  cacheTtlMs: 15 * 60 * 1000, // 15 minutes in-memory cache
  maxRetries: 2,
};

/**
 * Returns authenticated headers for TMDB requests.
 */
export function getTmdbHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (TMDB_CONFIG.readAccessToken) {
    headers['Authorization'] = `Bearer ${TMDB_CONFIG.readAccessToken}`;
  }

  return headers;
}
