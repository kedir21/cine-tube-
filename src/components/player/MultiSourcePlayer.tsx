import React, { useState, useEffect, useRef } from 'react';
import {
  RotateCcw,
  Maximize2,
  Tv,
  Film,
  AlertTriangle,
  Play,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isTheaterMode, setIsTheaterMode] = useState<boolean>(false);
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
    setErrorMessage(null);

    // Timeout safety for unresponsive streams
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 4500);

    return () => clearTimeout(timer);
  }, [embedUrl, iframeKey]);

  // Listen to postMessage events from Vidy iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (activeSource !== 'vidy') return;

      const parsed = parseVidyMessage(event);
      if (!parsed) return;

      if (parsed.duration !== undefined && parsed.duration > 0) {
        setDuration(parsed.duration);
      }
      if (parsed.progressPercent !== undefined) {
        setProgressPercent(parsed.progressPercent);
      }

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

  const handleSelectSource = (src: PlayerSourceId | 'trailer') => {
    setActiveSource(src);
    setHasError(false);
    setErrorMessage(null);
    setIsLoading(true);
    if (src !== 'trailer') {
      setPreferredPlayer(src);
    }
  };

  const handleReload = () => {
    setHasError(false);
    setErrorMessage(null);
    setIsLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
    setErrorMessage(
      'Unable to load the video stream. The external server may be temporarily unreachable, blocking iframe playback, or undergoing maintenance.'
    );
  };

  const handleOpenDirect = () => {
    if (embedUrl) {
      window.open(embedUrl, '_blank', 'noopener,noreferrer');
    }
  };

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
      className={`relative w-full rounded-2xl bg-black border border-zinc-800/80 shadow-2xl overflow-hidden transition-all duration-300 ${
        isTheaterMode ? 'fixed inset-x-0 top-14 z-40 max-w-none rounded-none border-x-0' : ''
      }`}
    >
      {/* Player Top Navigation Bar: Server Selector & Clean Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-zinc-800/80 bg-zinc-900/90 px-3.5 py-2.5 backdrop-blur-md">
        {/* Source Tabs */}
        <div className="flex items-center gap-1 p-0.5 bg-zinc-950 rounded-xl border border-zinc-800/80">
          {AVAILABLE_PLAYERS.map((player) => {
            const isSelected = activeSource === player.id;
            return (
              <button
                key={player.id}
                onClick={() => handleSelectSource(player.id)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  isSelected
                    ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
                title={player.description}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isSelected ? 'bg-rose-500' : 'bg-zinc-600'
                  }`}
                />
                <span>{player.name}</span>
              </button>
            );
          })}

          {/* Official Trailer Source */}
          {officialTrailer?.key && (
            <button
              onClick={() => handleSelectSource('trailer')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                activeSource === 'trailer'
                  ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
              title="Official YouTube Trailer"
            >
              <Play className="h-3 w-3 fill-current" />
              <span>Trailer</span>
            </button>
          )}
        </div>

        {/* Right Player Controls (Direct Open, Reload, Theater, Fullscreen) */}
        <div className="flex items-center gap-1.5">
          {/* Direct Stream in New Tab */}
          <button
            onClick={handleOpenDirect}
            title="Open direct stream in a new tab"
            className="flex h-8 items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950/70 px-2.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
          >
            <span>Open Direct</span>
            <ExternalLink className="h-3.5 w-3.5 text-zinc-400" />
          </button>

          {/* Reload Player */}
          <button
            onClick={handleReload}
            title="Reload Player Stream"
            className="flex h-8 items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950/70 px-2.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Reload</span>
          </button>

          {/* Theater Mode */}
          <button
            onClick={() => setIsTheaterMode(!isTheaterMode)}
            title="Toggle Theater Mode"
            className={`hidden sm:flex h-8 w-8 items-center justify-center rounded-lg border transition ${
              isTheaterMode
                ? 'border-zinc-600 bg-zinc-700 text-white'
                : 'border-zinc-800 bg-zinc-950/70 text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            <Tv className="h-3.5 w-3.5" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={handleFullscreen}
            title="Toggle Fullscreen"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950/70 text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Video Viewport: Strict Responsive 16:9 Aspect Ratio with Unrestricted Iframe Embedding */}
      <div className="relative w-full aspect-video bg-black overflow-hidden">
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
            onLoad={() => {
              setIsLoading(false);
              setHasError(false);
            }}
            onError={handleIframeError}
            className="h-full w-full border-0"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center text-zinc-500">
            <Film className="h-10 w-10 text-zinc-700 mb-2" />
            <div className="text-sm font-medium text-zinc-300">No Stream URL Available</div>
            <p className="mt-1 text-xs text-zinc-500 max-w-sm">
              Please verify that this title has a valid TMDB identifier.
            </p>
          </div>
        )}

        {/* Minimalist Loading Spinner */}
        {isLoading && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-xs transition-opacity">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-rose-500" />
            <span className="mt-2.5 text-xs font-medium tracking-wide text-zinc-400">
              Connecting to {activeSource === 'trailer' ? 'Trailer' : activePlayerObj?.name}...
            </span>
          </div>
        )}

        {/* User-friendly Fallback Message & Actions */}
        {hasError && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-950/95 p-6 text-center backdrop-blur-sm">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-zinc-100">Playback Connection Issue</h3>
            <p className="mt-1.5 max-w-md text-xs leading-relaxed text-zinc-400">
              {errorMessage ||
                'The embedded video source is temporarily unreachable or restricted by browser policies. You can retry the stream, switch to another server, or open the link directly.'}
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
              {/* Prominent Retry Button */}
              <button
                onClick={handleReload}
                className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-rose-950/40 hover:bg-rose-500 active:scale-95 transition"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Retry Player</span>
              </button>

              {/* Direct Open in New Tab */}
              <button
                onClick={handleOpenDirect}
                className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 px-3.5 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-700 active:scale-95 transition"
              >
                <span>Open in New Tab</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </button>

              {/* Alternative Server Switchers */}
              {AVAILABLE_PLAYERS.filter((p) => p.id !== activeSource).map((alt) => (
                <button
                  key={alt.id}
                  onClick={() => handleSelectSource(alt.id)}
                  className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white active:scale-95 transition"
                >
                  Switch to {alt.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sub-Player Information Bar */}
      <div className="border-t border-zinc-800/80 bg-zinc-950 px-4 py-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-zinc-400">
          {/* Episode Quick Switcher for TV Series */}
          {mediaType === 'tv' && (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-200">
                Season {season}, Episode {episode}
              </span>
              <div className="flex items-center gap-1 ml-1.5">
                <button
                  onClick={() => onEpisodeChange && onEpisodeChange(Math.max(1, episode - 1))}
                  disabled={episode <= 1}
                  className="flex h-6 items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900 px-2 text-[11px] text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  title="Previous Episode"
                >
                  <ChevronLeft className="h-3 w-3" />
                  <span>Prev</span>
                </button>
                <button
                  onClick={() => onEpisodeChange && onEpisodeChange(episode + 1)}
                  disabled={episode >= totalEpisodesInSeason}
                  className="flex h-6 items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900 px-2 text-[11px] text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  title="Next Episode"
                >
                  <span>Next</span>
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}

          {/* Progress / Status indicator */}
          <div className="flex items-center gap-3">
            {savedSeconds > 0 && (
              <span className="flex items-center gap-1.5 text-zinc-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-rose-500" />
                <span>
                  Resumed at {Math.floor(savedSeconds / 60)}:
                  {String(Math.floor(savedSeconds % 60)).padStart(2, '0')}
                </span>
              </span>
            )}

            <span className="text-[11px] text-zinc-500 font-mono">
              TMDB #{tmdbId}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
