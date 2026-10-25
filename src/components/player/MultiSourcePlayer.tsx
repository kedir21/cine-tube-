import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  RotateCcw,
  Maximize2,
  Tv,
  Film,
  Sparkles,
  AlertTriangle,
  Play,
  CheckCircle2,
  Sliders,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  Volume2,
  VolumeX,
  ShieldCheck,
} from 'lucide-react';
import {
  PlayerSourceId,
  AVAILABLE_PLAYERS,
  generatePlayerUrl,
  parseVidyMessage,
} from '../../services/videoPlayerService';
import { useApp } from '../../context/AppContext';
import { TMDBVideo } from '../../types/tmdb';

interface MultiSourcePlayerProps {
  mediaType: 'movie' | 'tv' | 'anime';
  tmdbId: number;
  imdbId?: string;
  title: string;
  season?: number;
  episode?: number;
  totalEpisodesInSeason?: number;
  onSeasonChange?: (newSeason: number) => void;
  onEpisodeChange?: (newEpisode: number) => void;
  officialTrailer?: TMDBVideo | null;
}

export const MultiSourcePlayer: React.FC<MultiSourcePlayerProps> = ({
  mediaType,
  tmdbId,
  imdbId,
  title,
  season = 1,
  episode = 1,
  totalEpisodesInSeason = 1,
  onSeasonChange,
  onEpisodeChange,
  officialTrailer,
}) => {
  const {
    preferredPlayer,
    setPreferredPlayer,
    playerAccentColor,
    updateHistoryProgress,
    getSavedProgress,
  } = useApp();

  const [activeSource, setActiveSource] = useState<PlayerSourceId | 'trailer'>(preferredPlayer);
  const [iframeKey, setIframeKey] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [isTheaterMode, setIsTheaterMode] = useState<boolean>(false);
  const [lastTrackedTime, setLastTrackedTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [progressPercent, setProgressPercent] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Check saved progress for this title
  const savedHistory = getSavedProgress(tmdbId, mediaType === 'tv' ? 'tv' : 'movie');
  const savedSeconds =
    mediaType === 'tv'
      ? savedHistory?.season === season && savedHistory?.episode === episode
        ? savedHistory?.currentTime || 0
        : 0
      : savedHistory?.currentTime || 0;

  // Generate current embed URL
  const embedUrl = React.useMemo(() => {
    if (activeSource === 'trailer') {
      if (!officialTrailer?.key) return '';
      return `https://www.youtube-nocookie.com/embed/${officialTrailer.key}?autoplay=1&rel=0&modestbranding=1`;
    }

    try {
      return generatePlayerUrl(activeSource, {
        mediaType,
        tmdbId,
        imdbId,
        season,
        episode,
        color: playerAccentColor,
        progress: savedSeconds > 10 ? savedSeconds : undefined,
        autoplay: false,
        nextEpisode: true,
        episodeSelector: true,
      });
    } catch (err) {
      console.error('Error generating player URL:', err);
      return '';
    }
  }, [
    activeSource,
    mediaType,
    tmdbId,
    imdbId,
    season,
    episode,
    playerAccentColor,
    savedSeconds,
    officialTrailer,
  ]);

  // Reset loading and error states whenever source, season, episode or reload triggers
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);

    // Timeout safety: if iframe doesn't finish loading within 12 seconds, display fallback helper
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 4000);

    return () => clearTimeout(timer);
  }, [embedUrl, iframeKey]);

  // Listen to postMessage events from Vidy iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (activeSource !== 'vidy') return;

      const parsed = parseVidyMessage(event);
      if (!parsed) return;

      if (parsed.currentTime !== undefined) {
        setLastTrackedTime(parsed.currentTime);
      }
      if (parsed.duration !== undefined && parsed.duration > 0) {
        setDuration(parsed.duration);
      }
      if (parsed.progressPercent !== undefined) {
        setProgressPercent(parsed.progressPercent);
      }

      // Save to application state & localStorage
      if (parsed.currentTime !== undefined) {
        updateHistoryProgress(tmdbId, mediaType === 'tv' ? 'tv' : 'movie', {
          currentTime: parsed.currentTime,
          duration: parsed.duration || duration,
          progress_percent: parsed.progressPercent || progressPercent,
          season: mediaType === 'tv' ? season : undefined,
          episode: mediaType === 'tv' ? episode : undefined,
          playerSource: 'vidy',
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [
    activeSource,
    tmdbId,
    mediaType,
    season,
    episode,
    duration,
    progressPercent,
    updateHistoryProgress,
  ]);

  // Handle source switch
  const handleSelectSource = (src: PlayerSourceId | 'trailer') => {
    setActiveSource(src);
    if (src !== 'trailer') {
      setPreferredPlayer(src);
    }
  };

  // Reload player iframe
  const handleReload = () => {
    setIframeKey((prev) => prev + 1);
  };

  // Fullscreen trigger
  const handleFullscreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch((err) => {
          console.warn('Fullscreen request failed:', err);
        });
      } else {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  const activePlayerObj = AVAILABLE_PLAYERS.find((p) => p.id === activeSource);

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-2xl bg-black border border-neutral-800 shadow-2xl transition-all duration-300 ${
        isTheaterMode ? 'fixed inset-x-0 top-14 z-40 max-w-none rounded-none border-x-0' : ''
      }`}
    >
      {/* Player Header Bar: Source Selector & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-neutral-800 bg-[#141414] px-4 py-2.5">
        {/* Source Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-neutral-900/90 rounded-xl border border-neutral-800/80">
          {AVAILABLE_PLAYERS.map((player) => {
            const isSelected = activeSource === player.id;
            return (
              <button
                key={player.id}
                onClick={() => handleSelectSource(player.id)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  isSelected
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                }`}
                title={player.description}
              >
                <span className="relative flex h-2 w-2">
                  <span
                    className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      isSelected ? 'animate-ping bg-white' : 'bg-transparent'
                    }`}
                  />
                  <span
                    className={`relative inline-flex h-2 w-2 rounded-full ${
                      isSelected ? 'bg-white' : 'bg-neutral-600'
                    }`}
                  />
                </span>
                <span>{player.name}</span>
              </button>
            );
          })}

          {/* Official Trailer Source */}
          {officialTrailer?.key && (
            <button
              onClick={() => handleSelectSource('trailer')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeSource === 'trailer'
                  ? 'bg-neutral-700 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
              }`}
              title="Official YouTube Trailer"
            >
              <Play className="h-3 w-3 fill-current" />
              <span>Trailer</span>
            </button>
          )}
        </div>

        {/* Right Player Controls (Reload, Theater, Fullscreen) */}
        <div className="flex items-center gap-2">
          {/* Active source badge */}
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-neutral-400 bg-neutral-900 px-2.5 py-1 rounded-lg border border-neutral-800">
            <span className="text-neutral-500">Source:</span>
            <span className="font-semibold text-white">
              {activeSource === 'trailer' ? 'YouTube Trailer' : activePlayerObj?.serverLabel}
            </span>
          </div>

          {/* Reload Player */}
          <button
            onClick={handleReload}
            title="Reload Player Source"
            className="flex h-8 items-center gap-1.5 rounded-lg bg-neutral-800 px-2.5 text-xs font-medium text-neutral-300 hover:bg-neutral-700 hover:text-white transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Reload</span>
          </button>

          {/* Theater Mode Toggle */}
          <button
            onClick={() => setIsTheaterMode(!isTheaterMode)}
            title="Toggle Theater Mode"
            className={`hidden sm:flex h-8 w-8 items-center justify-center rounded-lg text-xs transition ${
              isTheaterMode ? 'bg-red-600 text-white' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            <Tv className="h-4 w-4" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={handleFullscreen}
            title="Toggle Fullscreen"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white transition"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Video Viewport: Strict Responsive 16:9 Aspect Ratio */}
      <div className="relative w-full aspect-video bg-black overflow-hidden">
        {/* Iframe player */}
        {embedUrl ? (
          <iframe
            key={`${activeSource}-${season}-${episode}-${iframeKey}`}
            ref={iframeRef}
            src={embedUrl}
            title={`${title} - ${activeSource}`}
            width="100%"
            height="100%"
            frameBorder="0"
            allowFullScreen
            allow="encrypted-media; autoplay *; fullscreen *"
            sandbox="allow-scripts allow-same-origin"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
            className="h-full w-full border-0"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center text-neutral-400">
            <Film className="h-12 w-12 text-neutral-600 mb-2" />
            <div className="text-sm font-semibold text-white">No Stream URL Available</div>
            <p className="mt-1 text-xs text-neutral-500 max-w-sm">
              Please check that the title has a valid TMDB ID.
            </p>
          </div>
        )}

        {/* Loading Spinner overlay */}
        {isLoading && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm transition-opacity">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
            <span className="mt-3 text-xs font-semibold tracking-wider uppercase text-neutral-300">
              Connecting to {activeSource === 'trailer' ? 'YouTube' : activePlayerObj?.name}...
            </span>
          </div>
        )}

        {/* Error Fallback Banner */}
        {hasError && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-neutral-950/95 p-6 text-center">
            <AlertTriangle className="h-10 w-10 text-amber-500 mb-2" />
            <h3 className="text-base font-bold text-white">Stream Failed to Load</h3>
            <p className="mt-1 text-xs text-neutral-400 max-w-md">
              Server {activePlayerObj?.name} may be unavailable for this specific title. Switch to an alternative server:
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {AVAILABLE_PLAYERS.filter((p) => p.id !== activeSource).map((alt) => (
                <button
                  key={alt.id}
                  onClick={() => handleSelectSource(alt.id)}
                  className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-500 transition"
                >
                  Switch to {alt.name}
                </button>
              ))}
              <button
                onClick={handleReload}
                className="rounded-xl bg-neutral-800 px-4 py-2 text-xs font-semibold text-neutral-200 hover:bg-neutral-700 transition"
              >
                Retry Current Source
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sub-Player Information Bar */}
      <div className="border-t border-neutral-800 bg-[#121212] px-4 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-neutral-400">
          {/* Episode Quick Switcher for TV */}
          {mediaType === 'tv' && (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">
                Season {season}, Episode {episode}
              </span>
              <div className="flex items-center gap-1 ml-2">
                <button
                  onClick={() => onEpisodeChange && onEpisodeChange(Math.max(1, episode - 1))}
                  disabled={episode <= 1}
                  className="flex h-7 items-center gap-1 rounded bg-neutral-800 px-2 text-[11px] font-medium text-neutral-300 hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  title="Previous Episode"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Prev</span>
                </button>
                <button
                  onClick={() => onEpisodeChange && onEpisodeChange(episode + 1)}
                  disabled={episode >= totalEpisodesInSeason}
                  className="flex h-7 items-center gap-1 rounded bg-neutral-800 px-2 text-[11px] font-medium text-neutral-300 hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  title="Next Episode"
                >
                  <span>Next</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Progress / Status indicator */}
          <div className="flex items-center gap-3">
            {savedSeconds > 0 && (
              <span className="flex items-center gap-1.5 text-neutral-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-red-500" />
                <span>
                  Resumed at {Math.floor(savedSeconds / 60)}:
                  {String(Math.floor(savedSeconds % 60)).padStart(2, '0')}
                </span>
              </span>
            )}
            <span
              className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-900/60 px-2 py-0.5 rounded-md"
              title='Iframe Sandbox enabled: "allow-scripts allow-same-origin" (blocks rogue popups & redirects)'
            >
              <ShieldCheck className="h-3 w-3" />
              <span>Sandbox Protected</span>
            </span>

            <span className="text-[11px] text-neutral-400">
              TMDB ID: <span className="font-mono text-neutral-300">{tmdbId}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
