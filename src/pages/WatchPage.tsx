import React, { useEffect, useState, useCallback } from 'react';
import {
  Play,
  Film,
  Tv,
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  Bookmark,
  BookmarkCheck,
  Star,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { tmdbApi, getTMDBImageUrl, getBackdropFallback } from '../services/tmdbApi';
import { TMDBMovie, TMDBTVShow, TMDBSeasonDetail } from '../types/tmdb';
import { SUPPORTED_REGIONS } from '../data/curatedCompanies';
import { MultiSourcePlayer } from '../components/player/MultiSourcePlayer';
import { AVAILABLE_PLAYERS } from '../services/videoPlayerService';

interface WatchPageProps {
  mediaType: 'movie' | 'tv';
  mediaId: number;
}

export const WatchPage: React.FC<WatchPageProps> = ({ mediaType, mediaId }) => {
  const {
    navigate,
    userRegion,
    setUserRegion,
    toggleWatchlist,
    isInWatchlist,
    addToHistory,
    getSavedProgress,
  } = useApp();

  const urlParams = new URLSearchParams(window.location.search);
  const initialSeason = parseInt(urlParams.get('season') || '1', 10);
  const initialEpisode = parseInt(urlParams.get('episode') || '1', 10);

  const [item, setItem] = useState<TMDBMovie | TMDBTVShow | null>(null);
  const [season, setSeason] = useState<number>(initialSeason);
  const [episode, setEpisode] = useState<number>(initialEpisode);
  const [seasonDetails, setSeasonDetails] = useState<TMDBSeasonDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingSeason, setIsLoadingSeason] = useState<boolean>(false);

  // Load Movie or TV metadata
  useEffect(() => {
    let isCancelled = false;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const data =
          mediaType === 'movie'
            ? await tmdbApi.getMovieDetails(mediaId)
            : await tmdbApi.getTVDetails(mediaId);

        if (!isCancelled) {
          setItem(data);

          const savedProgress = getSavedProgress(mediaId, 'tv');
          if (mediaType === 'tv') {
            const hasUrlSeason = urlParams.has('season');
            const targetSeason = hasUrlSeason ? initialSeason : savedProgress?.season || 1;
            const targetEpisode = hasUrlSeason ? initialEpisode : savedProgress?.episode || 1;
            setSeason(targetSeason);
            setEpisode(targetEpisode);
          }

          addToHistory({
            id: mediaId,
            media_type: mediaType,
            title: (data as any).title || (data as any).name || 'Video',
            poster_path: data.poster_path,
            backdrop_path: data.backdrop_path,
            vote_average: data.vote_average,
            season: mediaType === 'tv' ? season : undefined,
            episode: mediaType === 'tv' ? episode : undefined,
          });
        }
      } catch (err) {
        console.error('Failed to load playback data:', err);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [mediaType, mediaId, addToHistory]);

  // Load Season Episodes when season changes on TV shows
  useEffect(() => {
    if (mediaType !== 'tv') return;

    let isCancelled = false;
    const fetchSeason = async () => {
      setIsLoadingSeason(true);
      try {
        const details = await tmdbApi.getTVSeason(mediaId, season);
        if (!isCancelled) {
          setSeasonDetails(details);
        }
      } catch (err) {
        console.warn('Could not load season episodes:', err);
      } finally {
        if (!isCancelled) setIsLoadingSeason(false);
      }
    };

    fetchSeason();

    return () => {
      isCancelled = true;
    };
  }, [mediaType, mediaId, season]);

  const handleEpisodeChange = useCallback(
    (newEpisode: number) => {
      setEpisode(newEpisode);
      const url = new URL(window.location.href);
      url.searchParams.set('season', String(season));
      url.searchParams.set('episode', String(newEpisode));
      window.history.replaceState({}, '', url.pathname + url.search);
    },
    [season]
  );

  const handleSeasonChange = useCallback((newSeason: number) => {
    setSeason(newSeason);
    setEpisode(1);
    const url = new URL(window.location.href);
    url.searchParams.set('season', String(newSeason));
    url.searchParams.set('episode', '1');
    window.history.replaceState({}, '', url.pathname + url.search);
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-rose-500" />
          <span className="text-xs text-zinc-400">Loading stream options...</span>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
        <Film className="h-12 w-12 text-zinc-600 mb-2" />
        <h2 className="text-xl font-bold text-white">Title Not Found</h2>
        <p className="mt-1 text-xs text-zinc-400">
          Unable to locate metadata for ID #{mediaId}.
        </p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 flex items-center gap-2 rounded-xl bg-zinc-800 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-700 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return Home</span>
        </button>
      </div>
    );
  }

  const title = (item as any).title || (item as any).name || 'Title';
  const year = ((item as any).release_date || (item as any).first_air_date || '').slice(0, 4);
  const inWatchlist = isInWatchlist(item.id, mediaType);
  const watchProviders =
    item['watch/providers']?.results?.[userRegion] || item['watch/providers']?.results?.['US'];
  const officialTrailer =
    item.videos?.results?.find((v) => v.site === 'YouTube' && v.type === 'Trailer') ||
    item.videos?.results?.find((v) => v.site === 'YouTube' && v.type === 'Teaser');

  const tvShow = mediaType === 'tv' ? (item as TMDBTVShow) : null;
  const currentEpisodeObj = seasonDetails?.episodes?.find((ep) => ep.episode_number === episode);
  const totalEpisodesInSeason = seasonDetails?.episodes?.length || 24;

  return (
    <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 md:px-8 pb-24">
      {/* Top back navigation */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => navigate(`/${mediaType}/${mediaId}`)}
          className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to {title} Overview</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span className="uppercase text-rose-500 font-bold">{mediaType === 'tv' ? 'Series' : 'Movie'}</span>
          {year && (
            <>
              <span aria-hidden="true">·</span>
              <span>{year}</span>
            </>
          )}
          {item.vote_average > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1 text-amber-400 font-medium">
                <Star className="h-3 w-3 fill-amber-400" />
                {item.vote_average.toFixed(1)}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Main Multi-Source Video Player */}
      <MultiSourcePlayer
        mediaType={mediaType}
        tmdbId={mediaId}
        imdbId={(item as any).imdb_id}
        title={title}
        season={season}
        episode={episode}
        totalEpisodesInSeason={totalEpisodesInSeason}
        onSeasonChange={handleSeasonChange}
        onEpisodeChange={handleEpisodeChange}
        officialTrailer={officialTrailer}
      />

      {/* Title & Metadata Sub-Header */}
      <div className="mt-6 flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white font-['Oswald',sans-serif]">
            {title}
          </h1>

          {mediaType === 'tv' && (
            <div className="mt-1 flex items-center gap-2 text-xs sm:text-sm text-zinc-300">
              <span className="font-semibold text-rose-400">
                Season {season}, Episode {episode}
              </span>
              {currentEpisodeObj?.name && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="italic">{currentEpisodeObj.name}</span>
                </>
              )}
            </div>
          )}

          <p className="mt-2 text-xs sm:text-sm text-zinc-400 max-w-3xl leading-relaxed">
            {mediaType === 'tv' && currentEpisodeObj?.overview
              ? currentEpisodeObj.overview
              : item.overview}
          </p>
        </div>

        {/* Watchlist toggle */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() =>
              toggleWatchlist({
                id: item.id,
                media_type: mediaType,
                title,
                poster_path: item.poster_path,
                backdrop_path: item.backdrop_path,
                vote_average: item.vote_average,
                release_year: year,
              })
            }
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-medium border transition ${
              inWatchlist
                ? 'bg-rose-950/40 text-rose-300 border-rose-800/50'
                : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            {inWatchlist ? <BookmarkCheck className="h-4 w-4 text-rose-400" /> : <Bookmark className="h-4 w-4" />}
            <span>{inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}</span>
          </button>
        </div>
      </div>

      {/* TV Season & Episode Selector List */}
      {mediaType === 'tv' && tvShow && (
        <section className="mt-8 rounded-2xl border border-zinc-800/80 bg-[#121215] p-5 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-emerald-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                  Episode Selector
                </h2>
              </div>
              <p className="text-xs text-zinc-400">
                Switch season or episode to dynamically load the video stream.
              </p>
            </div>

            {/* Season Selector Tabs */}
            {tvShow.seasons && tvShow.seasons.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-zinc-900/80 rounded-lg border border-zinc-800">
                {tvShow.seasons
                  .filter((s) => s.season_number > 0)
                  .map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleSeasonChange(s.season_number)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition ${
                        season === s.season_number
                          ? 'bg-zinc-800 text-white shadow-sm'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {s.name || `Season ${s.season_number}`}
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Episode Cards Grid */}
          <div className="mt-5">
            {isLoadingSeason ? (
              <div className="py-12 text-center text-xs text-zinc-400">
                Loading Season {season} episodes...
              </div>
            ) : seasonDetails?.episodes && seasonDetails.episodes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {seasonDetails.episodes.map((ep) => {
                  const isCurrent = ep.episode_number === episode;
                  return (
                    <button
                      key={ep.id || ep.episode_number}
                      onClick={() => handleEpisodeChange(ep.episode_number)}
                      className={`group flex flex-col text-left rounded-xl border overflow-hidden p-3 transition ${
                        isCurrent
                          ? 'border-rose-600 bg-rose-950/20 shadow-md ring-1 ring-rose-600'
                          : 'border-zinc-800/80 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-800/50'
                      }`}
                    >
                      <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-zinc-950 border border-zinc-800/80 mb-2.5">
                        <img
                          src={
                            ep.still_path
                              ? getTMDBImageUrl(ep.still_path, 'w300')
                              : getBackdropFallback()
                          }
                          alt={ep.name}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute bottom-1.5 left-1.5 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-bold text-white">
                          EP {ep.episode_number}
                        </div>
                        {isCurrent && (
                          <div className="absolute top-1.5 right-1.5 rounded bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                            Now Playing
                          </div>
                        )}
                      </div>

                      <div className="text-xs font-semibold text-zinc-100 group-hover:text-rose-400 transition truncate w-full">
                        {ep.episode_number}. {ep.name}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-1">
                        {ep.runtime && <span>{ep.runtime} min</span>}
                        {ep.runtime && ep.air_date && <span aria-hidden="true">·</span>}
                        {ep.air_date && <span>{ep.air_date}</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-zinc-400">
                Episode list not available for this season.
              </div>
            )}
          </div>
        </section>
      )}

      {/* Streaming Sources Architecture */}
      <section className="mt-8 rounded-2xl border border-zinc-800/80 bg-[#121215] p-5 shadow-lg">
        <div className="flex items-center gap-2 pb-3 border-b border-zinc-800/80">
          <Sparkles className="h-4 w-4 text-rose-500" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-white">
            Available Streaming Sources
          </h2>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {AVAILABLE_PLAYERS.map((player) => (
            <div
              key={player.id}
              className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-white">{player.serverLabel}</span>
                <span className="font-mono text-[10px] text-zinc-500">{player.baseUrl}</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">{player.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Official Legal Streaming Providers */}
      <section className="mt-8 rounded-2xl border border-zinc-800/80 bg-[#121215] p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                Official Licensed Providers
              </h2>
            </div>
            <p className="text-xs text-zinc-400">
              Verified local options to watch {title} in your country.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">Country:</span>
            <select
              value={userRegion}
              onChange={(e) => setUserRegion(e.target.value)}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 focus:outline-none"
            >
              {SUPPORTED_REGIONS.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.flag} {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
              Stream (Subscription)
            </div>
            {watchProviders?.flatrate && watchProviders.flatrate.length > 0 ? (
              <div className="space-y-2">
                {watchProviders.flatrate.map((prov) => (
                  <div
                    key={prov.provider_id}
                    className="flex items-center gap-3 rounded-lg bg-zinc-900/60 border border-zinc-800/80 p-2.5"
                  >
                    <img
                      src={getTMDBImageUrl(prov.logo_path, 'w92')}
                      alt={prov.provider_name}
                      className="h-7 w-7 rounded-md object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-zinc-200 truncate">{prov.provider_name}</div>
                      <div className="text-[10px] text-emerald-400">Available in plan</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-zinc-500 py-2">Not in local subscription services.</div>
            )}
          </div>

          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
              Rent Online
            </div>
            {watchProviders?.rent && watchProviders.rent.length > 0 ? (
              <div className="space-y-2">
                {watchProviders.rent.map((prov) => (
                  <div
                    key={prov.provider_id}
                    className="flex items-center gap-3 rounded-lg bg-zinc-900/60 border border-zinc-800/80 p-2.5"
                  >
                    <img
                      src={getTMDBImageUrl(prov.logo_path, 'w92')}
                      alt={prov.provider_name}
                      className="h-7 w-7 rounded-md object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-zinc-200 truncate">{prov.provider_name}</div>
                      <div className="text-[10px] text-zinc-500">On-demand rental</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-zinc-500 py-2">No digital rental services listed.</div>
            )}
          </div>

          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
              Buy Digital
            </div>
            {watchProviders?.buy && watchProviders.buy.length > 0 ? (
              <div className="space-y-2">
                {watchProviders.buy.map((prov) => (
                  <div
                    key={prov.provider_id}
                    className="flex items-center gap-3 rounded-lg bg-zinc-900/60 border border-zinc-800/80 p-2.5"
                  >
                    <img
                      src={getTMDBImageUrl(prov.logo_path, 'w92')}
                      alt={prov.provider_name}
                      className="h-7 w-7 rounded-md object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-zinc-200 truncate">{prov.provider_name}</div>
                      <div className="text-[10px] text-zinc-500">Digital purchase</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-zinc-500 py-2">No digital buy options listed.</div>
            )}
          </div>
        </div>

        {watchProviders?.link && (
          <div className="mt-5 border-t border-zinc-800/80 pt-3 text-right">
            <a
              href={watchProviders.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white"
            >
              <span>View complete JustWatch listing on TMDB</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </section>
    </div>
  );
};
