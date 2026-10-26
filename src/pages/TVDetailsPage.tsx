import React, { useEffect, useState } from 'react';
import {
  Play,
  Bookmark,
  BookmarkCheck,
  Star,
  Clock,
  Calendar,
  Building2,
  Tv,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { tmdbApi, getTMDBImageUrl, getBackdropFallback, getPosterFallback } from '../services/tmdbApi';
import { ContentRow } from '../components/common/ContentRow';
import { TMDBTVShow, TMDBSeasonDetail } from '../types/tmdb';
import { SUPPORTED_REGIONS } from '../data/curatedCompanies';

interface TVDetailsPageProps {
  tvId: number;
}

export const TVDetailsPage: React.FC<TVDetailsPageProps> = ({ tvId }) => {
  const {
    navigate,
    openTrailer,
    toggleWatchlist,
    isInWatchlist,
    userRegion,
    setUserRegion,
  } = useApp();

  const [tvShow, setTvShow] = useState<TMDBTVShow | null>(null);
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number>(1);
  const [seasonData, setSeasonData] = useState<TMDBSeasonDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSeason, setIsLoadingSeason] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load TV show details
  useEffect(() => {
    let isCancelled = false;

    const loadTV = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await tmdbApi.getTVDetails(tvId);
        if (!isCancelled) {
          setTvShow(data);
          const firstSeason = data.seasons?.find((s) => s.season_number > 0) || data.seasons?.[0];
          if (firstSeason) {
            setSelectedSeasonNumber(firstSeason.season_number);
          }
        }
      } catch (err: any) {
        if (!isCancelled) setError(err.message || 'Failed to load TV series details');
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    loadTV();

    return () => {
      isCancelled = true;
    };
  }, [tvId]);

  // Load selected season and episodes
  useEffect(() => {
    let isCancelled = false;

    const loadSeason = async () => {
      if (!selectedSeasonNumber && selectedSeasonNumber !== 0) return;
      setIsLoadingSeason(true);
      try {
        const data = await tmdbApi.getTVSeason(tvId, selectedSeasonNumber);
        if (!isCancelled) setSeasonData(data);
      } catch (err) {
        console.warn('Failed to fetch season:', err);
      } finally {
        if (!isCancelled) setIsLoadingSeason(false);
      }
    };

    loadSeason();

    return () => {
      isCancelled = true;
    };
  }, [tvId, selectedSeasonNumber]);

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-rose-500" />
          <span className="text-xs text-zinc-400">Loading series metadata...</span>
        </div>
      </div>
    );
  }

  if (error || !tvShow) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold text-white">TV Series Not Found</h2>
        <p className="mt-1 text-xs text-zinc-400">{error || 'Unable to retrieve title metadata.'}</p>
        <button
          onClick={() => navigate('/tv-shows')}
          className="mt-4 flex items-center gap-2 rounded-xl bg-zinc-800 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-700 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to TV Shows</span>
        </button>
      </div>
    );
  }

  const inWatchlist = isInWatchlist(tvShow.id, 'tv');
  const firstAirYear = (tvShow.first_air_date || '').slice(0, 4);
  const lastAirYear = (tvShow.last_air_date || '').slice(0, 4);

  const officialTrailer =
    tvShow.videos?.results?.find((v) => v.site === 'YouTube' && v.type === 'Trailer') ||
    tvShow.videos?.results?.find((v) => v.site === 'YouTube' && v.type === 'Teaser');

  const watchProvidersAll = tvShow['watch/providers']?.results || {};
  const currentProviders = watchProvidersAll[userRegion] || watchProvidersAll['US'];

  return (
    <div className="pb-24">
      {/* Clean Cinematic Backdrop Header */}
      <div className="relative min-h-[460px] w-full overflow-hidden bg-[#09090b]">
        <div className="absolute inset-0">
          <img
            src={
              tvShow.backdrop_path
                ? getTMDBImageUrl(tvShow.backdrop_path, 'original')
                : getBackdropFallback()
            }
            alt=""
            className="h-full w-full object-cover object-top opacity-30 filter brightness-[0.65]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#09090b] via-[#09090b]/60 to-transparent" />
        </div>

        {/* Header content */}
        <div className="relative z-10 mx-auto max-w-7xl px-4 pt-6 pb-10 md:px-8">
          <button
            onClick={() => window.history.back()}
            className="mb-6 flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>

          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* TV Poster */}
            <div className="w-48 sm:w-60 md:w-64 shrink-0 overflow-hidden rounded-2xl border border-zinc-800 shadow-2xl bg-zinc-900 aspect-[2/3]">
              <img
                src={tvShow.poster_path ? getTMDBImageUrl(tvShow.poster_path, 'w500') : getPosterFallback(tvShow.name)}
                alt={tvShow.name}
                className="h-full w-full object-cover"
              />
            </div>

            {/* Details Information */}
            <div className="flex-1 text-zinc-200">
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-zinc-400 mb-2">
                <span className="font-bold text-emerald-400 uppercase tracking-wider text-[11px]">TV Series</span>
                {firstAirYear && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>
                      {firstAirYear}
                      {lastAirYear && lastAirYear !== firstAirYear ? ` – ${lastAirYear}` : ''}
                    </span>
                  </>
                )}
                {tvShow.number_of_seasons && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>
                      {tvShow.number_of_seasons} Season{tvShow.number_of_seasons > 1 ? 's' : ''}
                    </span>
                  </>
                )}
                {tvShow.number_of_episodes && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{tvShow.number_of_episodes} Episodes</span>
                  </>
                )}
              </div>

              {/* Title & Tagline */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white font-['Oswald',sans-serif]">
                {tvShow.name}
              </h1>
              {tvShow.tagline && (
                <p className="mt-1 text-xs sm:text-sm italic text-zinc-400">&ldquo;{tvShow.tagline}&rdquo;</p>
              )}

              {/* Rating & Genres */}
              <div className="mt-3.5 flex flex-wrap items-center gap-4 text-xs font-medium">
                {tvShow.vote_average > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-bold text-white">{tvShow.vote_average.toFixed(1)}</span>
                    <span className="text-zinc-500">/ 10 ({tvShow.vote_count.toLocaleString()} votes)</span>
                  </div>
                )}

                {tvShow.genres && tvShow.genres.length > 0 && (
                  <div className="flex items-center gap-2 text-zinc-400">
                    <span aria-hidden="true">·</span>
                    <span>{tvShow.genres.map((g) => g.name).join(', ')}</span>
                  </div>
                )}
              </div>

              {/* Overview */}
              <div className="mt-4">
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-3xl">
                  {tvShow.overview || 'No synopsis summary available for this series.'}
                </p>
              </div>

              {/* Networks */}
              {tvShow.networks && tvShow.networks.length > 0 && (
                <div className="mt-4 flex items-center gap-3 border-t border-zinc-800/80 pt-3 text-xs text-zinc-400">
                  <span className="text-zinc-500">Network:</span>
                  <div className="flex items-center gap-2">
                    {tvShow.networks.map((net) => (
                      <span key={net.id} className="font-medium text-zinc-200">
                        {net.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => navigate(`/watch/tv/${tvShow.id}?season=${selectedSeasonNumber}&episode=1`)}
                  className="flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-950/40 hover:bg-rose-500 active:scale-95 transition"
                >
                  <Play className="h-4 w-4 fill-white" />
                  <span>Stream Series</span>
                </button>

                {officialTrailer && (
                  <button
                    onClick={() => openTrailer(officialTrailer.key, tvShow.name, 'tv', tvShow.id)}
                    className="flex items-center gap-2 rounded-xl bg-zinc-850 px-4 py-2.5 text-xs font-medium text-zinc-200 hover:bg-zinc-800 transition"
                  >
                    <Tv className="h-4 w-4 text-zinc-400" />
                    <span>Watch Trailer</span>
                  </button>
                )}

                <button
                  onClick={() =>
                    toggleWatchlist({
                      id: tvShow.id,
                      media_type: 'tv',
                      title: tvShow.name,
                      poster_path: tvShow.poster_path,
                      backdrop_path: tvShow.backdrop_path,
                      vote_average: tvShow.vote_average,
                      release_year: firstAirYear,
                    })
                  }
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-medium border transition ${
                    inWatchlist
                      ? 'bg-rose-950/40 text-rose-300 border-rose-800/50 hover:bg-rose-900/30'
                      : 'bg-zinc-850 text-zinc-300 border-zinc-700/60 hover:bg-zinc-800'
                  }`}
                >
                  {inWatchlist ? <BookmarkCheck className="h-4 w-4 text-rose-400" /> : <Bookmark className="h-4 w-4" />}
                  <span>{inWatchlist ? 'Saved in Watchlist' : 'Add to Watchlist'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 md:px-8 mt-8 space-y-10">
        {/* TV Seasons & Episode Browser */}
        <section className="rounded-2xl border border-zinc-800/80 bg-[#121215] p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Seasons &amp; Episodes
              </h2>
              <p className="text-xs text-zinc-400">
                Browse episode stills, air dates, runtimes, and play episodes directly.
              </p>
            </div>

            {/* Season Selector Tabs */}
            {tvShow.seasons && tvShow.seasons.length > 0 && (
              <div className="flex items-center gap-1 overflow-x-auto p-1 bg-zinc-900 rounded-xl border border-zinc-800">
                {tvShow.seasons
                  .filter((s) => s.season_number > 0)
                  .map((season) => (
                    <button
                      key={season.id}
                      onClick={() => setSelectedSeasonNumber(season.season_number)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition ${
                        selectedSeasonNumber === season.season_number
                          ? 'bg-zinc-800 text-white shadow-sm'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {season.name || `Season ${season.season_number}`}
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Episode Cards List */}
          <div className="mt-5 space-y-3">
            {isLoadingSeason ? (
              <div className="py-12 text-center text-xs text-zinc-400">Loading episodes...</div>
            ) : seasonData?.episodes && seasonData.episodes.length > 0 ? (
              seasonData.episodes.map((ep) => (
                <div
                  key={ep.id || ep.episode_number}
                  className="flex flex-col sm:flex-row gap-4 rounded-xl border border-zinc-800/70 bg-zinc-900/40 p-3 sm:p-4 hover:border-zinc-700 transition"
                >
                  {/* Episode Still */}
                  <div className="relative w-full sm:w-52 shrink-0 aspect-video rounded-lg overflow-hidden bg-zinc-950 border border-zinc-800">
                    <img
                      src={
                        ep.still_path
                          ? getTMDBImageUrl(ep.still_path, 'w300')
                          : getBackdropFallback()
                      }
                      alt={ep.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = getBackdropFallback();
                      }}
                    />
                    <div className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-mono text-zinc-300">
                      S{ep.season_number} E{ep.episode_number}
                    </div>
                  </div>

                  {/* Episode Info */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
                        <span className="font-semibold text-rose-500">Episode {ep.episode_number}</span>
                        {ep.air_date && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{ep.air_date}</span>
                          </>
                        )}
                        {ep.runtime && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{ep.runtime}m</span>
                          </>
                        )}
                        {ep.vote_average > 0 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-amber-400">★ {ep.vote_average.toFixed(1)}</span>
                          </>
                        )}
                      </div>

                      <h3 className="text-sm font-semibold text-white">{ep.name}</h3>
                      <p className="mt-1 text-xs text-zinc-300 line-clamp-2 leading-relaxed">
                        {ep.overview || 'Episode plot synopsis not currently available.'}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-end">
                      <button
                        onClick={() =>
                          navigate(`/watch/tv/${tvShow.id}?season=${ep.season_number}&episode=${ep.episode_number}`)
                        }
                        className="flex items-center gap-1.5 rounded-lg bg-rose-600/90 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-600 transition"
                      >
                        <Play className="h-3 w-3 fill-white" />
                        <span>Stream Episode {ep.episode_number}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-zinc-400">
                Episode list not available for this season.
              </div>
            )}
          </div>
        </section>

        {/* Cast Section */}
        {tvShow.credits?.cast && tvShow.credits.cast.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4">
              Series Cast
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-none">
              {tvShow.credits.cast.slice(0, 14).map((actor) => (
                <button
                  key={actor.id}
                  onClick={() => navigate(`/person/${actor.id}`)}
                  className="group flex w-24 sm:w-28 shrink-0 flex-col text-left transition hover:opacity-90"
                >
                  <div className="h-32 sm:h-36 w-full overflow-hidden rounded-xl bg-zinc-900 border border-zinc-800">
                    {actor.profile_path ? (
                      <img
                        src={getTMDBImageUrl(actor.profile_path, 'w185')}
                        alt={actor.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] text-zinc-600">
                        No Photo
                      </div>
                    )}
                  </div>
                  <div className="mt-1.5 text-xs font-medium text-zinc-200 group-hover:text-rose-400 truncate">
                    {actor.name}
                  </div>
                  <div className="text-[10px] text-zinc-500 truncate">
                    {actor.character || 'Cast'}
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Recommended TV Series */}
        {tvShow.recommendations?.results && tvShow.recommendations.results.length > 0 && (
          <ContentRow
            title="Recommended Series"
            subtitle="Shows fans also watch"
            items={tvShow.recommendations.results}
            mediaTypeOverride="tv"
          />
        )}
      </div>
    </div>
  );
};
