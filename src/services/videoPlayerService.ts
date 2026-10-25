export type PlayerSourceId = 'vidy' | 'viduki' | 'vidzee';

export interface PlayerConfig {
  id: PlayerSourceId;
  name: string;
  serverLabel: string;
  baseUrl: string;
  description: string;
  defaultColor: string;
  supportsProgressTracking: boolean;
  supportsNextEpisodeParam: boolean;
}

export const AVAILABLE_PLAYERS: PlayerConfig[] = [
  {
    id: 'vidy',
    name: 'Vidy',
    serverLabel: 'Server 1 (Vidy)',
    baseUrl: 'https://vidy.st',
    description: 'High-speed stream with progress resume, episode controls & custom color.',
    defaultColor: 'DC2626',
    supportsProgressTracking: true,
    supportsNextEpisodeParam: true,
  },
  {
    id: 'viduki',
    name: 'Viduki',
    serverLabel: 'Server 2 (Viduki)',
    baseUrl: 'https://viduki.net/1',
    description: 'Reliable multi-CDN backup stream with TMDB ID & IMDb fallback.',
    defaultColor: 'DC2626',
    supportsProgressTracking: false,
    supportsNextEpisodeParam: false,
  },
  {
    id: 'vidzee',
    name: 'Vidzee',
    serverLabel: 'Server 3 (Vidzee)',
    baseUrl: 'https://player.vidzee.wtf/embed',
    description: 'Alternative fast streaming player with color theming.',
    defaultColor: '8C52FF',
    supportsProgressTracking: false,
    supportsNextEpisodeParam: false,
  },
];

export interface PlayerUrlOptions {
  mediaType: 'movie' | 'tv' | 'anime';
  tmdbId: number;
  imdbId?: string;
  season?: number;
  episode?: number;
  anilistId?: number;
  color?: string; // 6-digit hex without #
  progress?: number; // seconds
  autoplay?: boolean;
  nextEpisode?: boolean;
  episodeSelector?: boolean;
  autoplayNextEpisode?: boolean;
}

/**
 * Sanitize hex color (ensure 6 characters, no #)
 */
export function sanitizeColor(color?: string, fallback: string = 'DC2626'): string {
  if (!color) return fallback;
  const cleaned = color.replace(/^#/, '').trim();
  return /^[0-9A-Fa-f]{6}$/.test(cleaned) ? cleaned : fallback;
}

/**
 * Generates the embed URL for any of the 3 supported player sources
 */
export function generatePlayerUrl(
  source: PlayerSourceId,
  options: PlayerUrlOptions
): string {
  const {
    mediaType,
    tmdbId,
    season = 1,
    episode = 1,
    anilistId,
    color,
    progress,
    autoplay = false,
    nextEpisode = true,
    episodeSelector = true,
    autoplayNextEpisode = false,
  } = options;

  // Validate TMDB ID
  if (!tmdbId || isNaN(tmdbId) || tmdbId <= 0) {
    throw new Error('Valid TMDB ID is required for video playback');
  }

  const s = Math.max(1, Math.floor(season));
  const ep = Math.max(1, Math.floor(episode));

  switch (source) {
    case 'vidy': {
      let path = '';
      if (mediaType === 'anime' && anilistId && anilistId > 0) {
        // Anime route requires valid AniList ID
        path = `https://vidy.st/anime/${anilistId}/${ep}`;
      } else if (mediaType === 'tv') {
        path = `https://vidy.st/tv/${tmdbId}/${s}/${ep}`;
      } else {
        path = `https://vidy.st/movie/${tmdbId}`;
      }

      const params = new URLSearchParams();
      const activeColor = sanitizeColor(color, 'DC2626');
      if (activeColor) params.set('color', activeColor);

      // Only resume if progress is substantial (> 5 seconds)
      if (progress && progress > 5) {
        params.set('progress', String(Math.floor(progress)));
      }

      if (autoplay) params.set('autoplay', 'true');
      if (mediaType === 'tv') {
        if (nextEpisode) params.set('nextEpisode', 'true');
        if (episodeSelector) params.set('episodeSelector', 'true');
        if (autoplayNextEpisode) params.set('autoplayNextEpisode', 'true');
      }

      const queryString = params.toString();
      return queryString ? `${path}?${queryString}` : path;
    }

    case 'viduki': {
      const activeColor = sanitizeColor(color, 'DC2626');
      if (mediaType === 'tv') {
        return `https://viduki.net/1/tv/${tmdbId}/${s}/${ep}?color=${activeColor}`;
      }
      return `https://viduki.net/1/movie/${tmdbId}?color=${activeColor}`;
    }

    case 'vidzee': {
      const activeColor = sanitizeColor(color, '8C52FF');
      if (mediaType === 'tv') {
        return `https://player.vidzee.wtf/embed/tv/${tmdbId}/${s}/${ep}?color=${activeColor}`;
      }
      return `https://player.vidzee.wtf/embed/movie/${tmdbId}?color=${activeColor}`;
    }

    default:
      throw new Error(`Unsupported player source: ${source}`);
  }
}

/**
 * Validates postMessage events from embedded iframe (e.g., Vidy postMessage API)
 */
export interface VidyPlaybackEvent {
  type: 'timeupdate' | 'play' | 'pause' | 'ended' | 'ready';
  currentTime?: number;
  duration?: number;
  progressPercent?: number;
}

export function parseVidyMessage(event: MessageEvent): VidyPlaybackEvent | null {
  // Check origin if available
  if (event.origin && !event.origin.includes('vidy.st')) {
    // Return null if from unexpected origin
    return null;
  }

  let data = event.data;
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      return null;
    }
  }

  if (!data || typeof data !== 'object') {
    return null;
  }

  // Common Vidy event formats
  const eventName = data.event || data.type || data.action;
  if (!eventName || typeof eventName !== 'string') {
    return null;
  }

  const normalized = eventName.toLowerCase();
  const currentTime = typeof data.currentTime === 'number' ? data.currentTime : typeof data.time === 'number' ? data.time : undefined;
  const duration = typeof data.duration === 'number' ? data.duration : undefined;

  let progressPercent: number | undefined = undefined;
  if (currentTime !== undefined && duration && duration > 0) {
    progressPercent = Math.min(100, Math.max(0, (currentTime / duration) * 100));
  } else if (typeof data.progress === 'number') {
    progressPercent = Math.min(100, Math.max(0, data.progress));
  }

  if (normalized.includes('timeupdate') || normalized.includes('progress')) {
    return { type: 'timeupdate', currentTime, duration, progressPercent };
  }
  if (normalized.includes('play')) {
    return { type: 'play', currentTime, duration, progressPercent };
  }
  if (normalized.includes('pause')) {
    return { type: 'pause', currentTime, duration, progressPercent };
  }
  if (normalized.includes('ended')) {
    return { type: 'ended', currentTime, duration, progressPercent: 100 };
  }
  if (normalized.includes('ready') || normalized.includes('loaded')) {
    return { type: 'ready' };
  }

  return null;
}
