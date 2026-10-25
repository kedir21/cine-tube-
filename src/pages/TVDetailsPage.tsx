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
  Tv2,
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
          // Set initial season
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
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
          <span className="text-xs text-neutral-400">Loading TMDB TV metadata...</span>
        </div>
      </div>
    );
  }

  if (error || !tvShow) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold text-white">TV Series not found</h2>
        <p className="mt-1 text-xs text-neutral-400">{error || 'Unable to retrieve series from TMDB.'}</p>
        <button
          onClick={() => navigate('/tv-shows')}
          className="mt-4 flex items-center gap-2 rounded-xl bg-neutral-800 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-700"
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

  // Official Trailer
  const officialTrailer =
    tvShow.videos?.results?.find((v) => v.site === 'YouTube' && v.type === 'Trailer') ||
    tvShow.videos?.results?.find((v) => v.site === 'YouTube' && v.type === 'Teaser');

  // Watch providers
  const watchProvidersAll = tvShow['watch/providers']?.results || {};
  const currentProviders = watchProvidersAll[userRegion] || watchProvidersAll['US'];

  return (
    <div className="pb-20">
      {/* Backdrop Header */}
      <div className="relative min-h-[500px] w-full overflow-hidden bg-neutral-950">
        <img
          src={
            tvShow.backdrop_path
              ? getTMDBImageUrl(tvShow.backdrop_path, 'original')
              : getBackdropFallback()
          }
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-top opacity-35 filter brightness-[0.7]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f0f0f] via-[#0f0f0f]/60 to-transparent" />

        {/* Header content */}
        <div className="relative z-10 mx-auto max-w-7xl px-4 pt-8 pb-12 md:px-8">
          <button
            onClick={() => window.history.back()}
            className="mb-6 flex items-center gap-1.5 text-xs font-semibold text-neutral-400 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>

          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* TV Poster */}
            <div className="w-52 sm:w-64 md:w-72 shrink-0 overflow-hidden rounded-2xl border border-neutral-700/80 shadow-2xl bg-neutral-900 aspect-[2/3]">
              <img
                src={tvShow.poster_path ? getTMDBImageUrl(tvShow.poster_path, 'w500') : getPosterFallback(tvShow.name)}
                alt={tvShow.name}
                className="h-full w-full object-cover"
              />
            </div>

            {/* Details Column */}
            <div className="flex-1 text-neutral-200">
              {/* Unboxed Metadata */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-neutral-400 mb-1.5">
                <span className="uppercase tracking-widest text-emerald-400 font-bold">TV Series</span>
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
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white font-['Oswald',sans-serif]">
                {tvShow.name}
              </h1>
              {tvShow.tagline && (
                <p className="mt-1 text-sm italic text-neutral-400">&ldquo;{tvShow.tagline}&rdquo;</p>
              )}

              {/* Rating & Genres */}
              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-medium">
                {tvShow.vote_average > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="text-base font-bold text-white">{tvShow.vote_average.toFixed(1)}</span>
                    <span className="text-neutral-400">/ 10 ({tvShow.vote_count.toLocaleString()} votes)</span>
                  </div>
                )}

                {tvShow.genres && tvShow.genres.length > 0 && (
                  <div className="flex items-center gap-2 text-neutral-300">
                    <span aria-hidden="true">·</span>
                    <span>{tvShow.genres.map((g) => g.name).join(', ')}</span>
                  </div>
                )}
              </div>

              {/* Overview */}
              <div className="mt-5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Overview</h2>
                <p className="mt-1.5 text-sm sm:text-base text-neutral-300 leading-relaxed max-w-3xl">
                  {tvShow.overview || 'No overview summary available.'}
                </p>
              </div>

              {/* Network Information */}
              {tvShow.networks && tvShow.networks.length > 0 && (
                <div className="mt-5 flex items-center gap-3 border-t border-neutral-800/80 pt-4 text-xs text-neutral-300">
                  <span className="text-neutral-400">Original Network:</span>
                  <div className="flex items-center gap-2">
                    {tvShow.networks.map((net) => (
                      <span key={net.id} className="font-semibold text-white">
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
                  className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-900/30 hover:bg-red-500 transition focus-visible:outline-none"
                >
                  <Play className="h-4 w-4 fill-white" />
                  <span>Stream Series</span>
                </button>

                {officialTrailer && (
                  <button
                    onClick={() => openTrailer(officialTrailer.key, tvShow.name, 'tv', tvShow.id)}
                    className="flex items-center gap-2 rounded-xl bg-neutral-800 px-5 py-2.5 text-sm font-semibold text-neutral-200 hover:bg-neutral-700 transition"
                  >
                    <Tv className="h-4 w-4 text-neutral-400" />
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
                  className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold border transition ${
                    inWatchlist
                      ? 'bg-red-950/60 text-red-300 border-red-800/60 hover:bg-red-900/40'
                      : 'bg-neutral-800 text-white border-neutral-700 hover:bg-neutral-700'
                  }`}
                >
                  {inWatchlist ? <BookmarkCheck className="h-4 w-4 text-red-400" /> : <Bookmark className="h-4 w-4" />}
                  <span>{inWatchlist ? 'Saved in Watchlist' : 'Add to Watchlist'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 md:px-8 mt-8 space-y-10">
        {/* TV Seasons & Episode Browser */}
        <section className="rounded-2xl border border-neutral-800 bg-[#141414] p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white font-['Oswald',sans-serif]">
                SEASONS &amp; EPISODES
              </h2>
              <p className="text-xs text-neutral-400">
                Explore episode stills, air dates, runtimes, and plotlines from TMDB.
              </p>
            </div>

            {/* Season Selector Tabs */}
            {tvShow.seasons && tvShow.seasons.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-neutral-900 rounded-xl border border-neutral-800">
                {tvShow.seasons
                  .filter((s) => s.season_number > 0)
                  .map((season) => (
                    <button
                      key={season.id}
                      onClick={() => setSelectedSeasonNumber(season.season_number)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                        selectedSeasonNumber === season.season_number
                          ? 'bg-neutral-800 text-white shadow-sm'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      {season.name || `Season ${season.season_number}`}
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Episode Cards List */}
          <div className="mt-6 space-y-4">
            {isLoadingSeason ? (
              <div className="py-12 text-center text-xs text-neutral-400">Loading episodes...</div>
            ) : seasonData?.episodes && seasonData.episodes.length > 0 ? (
              seasonData.episodes.map((ep) => (
                <div
                  key={ep.id || ep.episode_number}
                  className="flex flex-col sm:flex-row gap-4 rounded-xl border border-neutral-800/80 bg-neutral-900/60 p-3 sm:p-4 hover:border-neutral-700 transition"
                >
                  {/* Episode Still */}
                  <div className="relative w-full sm:w-56 shrink-0 aspect-video rounded-lg overflow-hidden bg-neutral-950 border border-neutral-800">
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
                    <div className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-mono text-neutral-300">
                      S{ep.season_number} E{ep.episode_number}
                    </div>
                  </div>

                  {/* Episode Info */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-neutral-400 mb-1">
                        <span className="font-semibold text-red-500">Episode {ep.episode_number}</span>
                        {ep.air_date && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{ep.air_date}</span>
                          </>
                        )}
                        {ep.runtime && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{ep.runtime} min</span>
                          </>
                        )}
                        {ep.vote_average > 0 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-amber-400">★ {ep.vote_average.toFixed(1)}</span>
                          </>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-white">{ep.name}</h3>
                      <p className="mt-1 text-xs sm:text-sm text-neutral-300 line-clamp-3 leading-relaxed">
                        {ep.overview || 'Episode plot synopsis not currently available.'}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-end">
                      <button
                        onClick={() =>
                          navigate(`/watch/tv/${tvShow.id}?season=${ep.season_number}&episode=${ep.episode_number}`)
                        }
                        className="flex items-center gap-1.5 rounded-lg bg-red-600/90 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 transition"
                      >
                        <Play className="h-3 w-3 fill-white" />
                        <span>Stream Episode {ep.episode_number}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-neutral-400">
                Episode list not available for this season.
              </div>
            )}
          </div>
        </section>

        {/* Production Studios */}
        {tvShow.production_companies && tvShow.production_companies.length > 0 && (
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-emerald-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-400">
                Production Companies &amp; Studios
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {tvShow.production_companies.map((comp) => (
                <button
                  key={comp.id}
                  onClick={() => navigate(`/company/${comp.id}`)}
                  className="flex items-center gap-3 rounded-xl border border-neutral-800 bg-[#161616] px-4 py-2 text-xs font-semibold text-neutral-200 hover:border-neutral-600 hover:bg-neutral-800 transition"
                >
                  <span>{comp.name}</span>
                  <span className="text-[10px] text-red-400 font-normal">View studio catalog →</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Cast Section */}
        {tvShow.credits?.cast && tvShow.credits.cast.length > 0 && (
          <section>
            <h2 className="text-base font-bold text-white uppercase tracking-wider font-['Oswald',sans-serif] mb-4">
              SERIES CAST
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-none">
              {tvShow.credits.cast.slice(0, 14).map((actor) => (
                <button
                  key={actor.id}
                  onClick={() => navigate(`/person/${actor.id}`)}
                  className="group flex w-28 sm:w-32 shrink-0 flex-col text-left transition hover:opacity-90"
                >
                  <div className="h-36 sm:h-40 w-full overflow-hidden rounded-xl bg-neutral-900 border border-neutral-800">
                    {actor.profile_path ? (
                      <img
                        src={getTMDBImageUrl(actor.profile_path, 'w185')}
                        alt={actor.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-neutral-600">
                        No Photo
                      </div>
                    )}
                  </div>
                  <div className="mt-2 text-xs font-semibold text-neutral-200 group-hover:text-red-400 truncate">
                    {actor.name}
                  </div>
                  <div className="text-[11px] text-neutral-400 truncate">
                    {actor.character || 'Cast'}
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Recommendations & Similar */}
        {tvShow.recommendations?.results && tvShow.recommendations.results.length > 0 && (
          <ContentRow
            title="Recommended TV Series"
            subtitle="Shows that fans also watch"
            items={tvShow.recommendations.results}
            mediaTypeOverride="tv"
          />
        )}
      </div>
    </div>
  );
};
