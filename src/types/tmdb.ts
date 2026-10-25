export interface TMDBMovie {
  id: number;
  title: string;
  original_title?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  vote_average: number;
  vote_count: number;
  popularity: number;
  adult?: boolean;
  runtime?: number;
  budget?: number;
  revenue?: number;
  original_language?: string;
  status?: string;
  tagline?: string;
  production_companies?: TMDBCompanyBrief[];
  credits?: TMDBCredits;
  videos?: { results: TMDBVideo[] };
  similar?: { results: TMDBMovie[] };
  recommendations?: { results: TMDBMovie[] };
  'watch/providers'?: { results: Record<string, TMDBWatchProviderCountry> };
  media_type?: 'movie';
}

export interface TMDBTVShow {
  id: number;
  name: string;
  original_name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date?: string;
  last_air_date?: string;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  vote_average: number;
  vote_count: number;
  popularity: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
  episode_run_time?: number[];
  status?: string;
  tagline?: string;
  networks?: { id: number; name: string; logo_path: string | null }[];
  production_companies?: TMDBCompanyBrief[];
  seasons?: TMDBSeasonSummary[];
  credits?: TMDBCredits;
  videos?: { results: TMDBVideo[] };
  similar?: { results: TMDBTVShow[] };
  recommendations?: { results: TMDBTVShow[] };
  'watch/providers'?: { results: Record<string, TMDBWatchProviderCountry> };
  media_type?: 'tv';
}

export type TMDBMediaItem = (TMDBMovie & { media_type?: 'movie' }) | (TMDBTVShow & { media_type?: 'tv' });

export interface TMDBCompanyBrief {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country?: string;
}

export interface TMDBCompanyDetail {
  id: number;
  name: string;
  description: string;
  headquarters: string;
  homepage: string;
  logo_path: string | null;
  origin_country: string;
  parent_company: null | { id: number; name: string; logo_path: string | null };
}

export interface TMDBSeasonSummary {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  season_number: number;
  episode_count: number;
  air_date?: string;
}

export interface TMDBEpisode {
  id: number;
  name: string;
  overview: string;
  still_path: string | null;
  episode_number: number;
  season_number: number;
  air_date?: string;
  runtime?: number;
  vote_average: number;
  vote_count: number;
}

export interface TMDBSeasonDetail {
  id: number;
  name: string;
  overview: string;
  season_number: number;
  poster_path: string | null;
  air_date?: string;
  episodes: TMDBEpisode[];
}

export interface TMDBCastMember {
  id: number;
  name: string;
  character?: string;
  profile_path: string | null;
  order?: number;
  known_for_department?: string;
}

export interface TMDBCrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface TMDBCredits {
  cast: TMDBCastMember[];
  crew: TMDBCrewMember[];
}

export interface TMDBPerson {
  id: number;
  name: string;
  biography?: string;
  birthday?: string;
  deathday?: string | null;
  place_of_birth?: string;
  profile_path: string | null;
  known_for_department?: string;
  movie_credits?: { cast: TMDBMovie[]; crew: TMDBMovie[] };
  tv_credits?: { cast: TMDBTVShow[]; crew: TMDBTVShow[] };
}

export interface TMDBVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  size: number;
  type: string;
  official: boolean;
  published_at?: string;
}

export interface TMDBWatchProviderItem {
  provider_id: number;
  provider_name: string;
  logo_path: string;
  display_priority?: number;
}

export interface TMDBWatchProviderCountry {
  link?: string;
  flatrate?: TMDBWatchProviderItem[];
  rent?: TMDBWatchProviderItem[];
  buy?: TMDBWatchProviderItem[];
  free?: TMDBWatchProviderItem[];
}

export interface TMDBGenre {
  id: number;
  name: string;
}

export interface TMDBPaginatedResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface ConfiguredCompany {
  id: number;
  name: string;
  shortName: string;
  slug: string;
  logoPath?: string;
  backdropUrl?: string;
  originCountry: string;
  founded?: number;
  description: string;
  featuredMovieId?: number;
  accentColor?: string;
}

export interface ConfiguredNetwork {
  id: number;
  name: string;
  logoPath?: string;
  description: string;
  color?: string;
}

export interface WatchlistItem {
  id: number;
  media_type: 'movie' | 'tv';
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  release_year?: string;
  added_at: number;
}

export interface WatchHistoryItem {
  id: number;
  media_type: 'movie' | 'tv';
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  watched_at: number;
  progress_percent?: number;
  vote_average?: number;
  currentTime?: number;
  duration?: number;
  season?: number;
  episode?: number;
  playerSource?: 'vidy' | 'viduki' | 'vidzee';
}
