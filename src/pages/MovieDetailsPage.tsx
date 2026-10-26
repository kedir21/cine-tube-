import React, { useEffect, useState } from 'react';
import {
  Play,
  Bookmark,
  BookmarkCheck,
  Star,
  Clock,
  Calendar,
  Globe,
  Building2,
  Tv,
  ArrowLeft,
  Share2,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { tmdbApi, getTMDBImageUrl, getBackdropFallback, getPosterFallback } from '../services/tmdbApi';
import { ContentRow } from '../components/common/ContentRow';
import { TMDBMovie } from '../types/tmdb';
import { SUPPORTED_REGIONS } from '../data/curatedCompanies';

interface MovieDetailsPageProps {
  movieId: number;
}

export const MovieDetailsPage: React.FC<MovieDetailsPageProps> = ({ movieId }) => {
  const {
    navigate,
    openTrailer,
    toggleWatchlist,
    isInWatchlist,
    userRegion,
    setUserRegion,
  } = useApp();

  const [movie, setMovie] = useState<TMDBMovie | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const loadMovie = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await tmdbApi.getMovieDetails(movieId);
        if (!isCancelled) setMovie(data);
      } catch (err: any) {
        if (!isCancelled) setError(err.message || 'Failed to load movie details');
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    loadMovie();

    return () => {
      isCancelled = true;
    };
  }, [movieId]);

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-rose-500" />
          <span className="text-xs text-zinc-400">Loading title details...</span>
        </div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold text-white">Movie Not Found</h2>
        <p className="mt-1 text-xs text-zinc-400">{error || 'Unable to retrieve title metadata.'}</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 flex items-center gap-2 rounded-xl bg-zinc-800 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-700 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </button>
      </div>
    );
  }

  const inWatchlist = isInWatchlist(movie.id, 'movie');
  const releaseYear = (movie.release_date || '').slice(0, 4);
  const runtimeHours = movie.runtime ? Math.floor(movie.runtime / 60) : 0;
  const runtimeMins = movie.runtime ? movie.runtime % 60 : 0;
  const runtimeFormatted = movie.runtime ? `${runtimeHours}h ${runtimeMins}m` : null;

  const director = movie.credits?.crew?.find((c) => c.job === 'Director');

  const officialTrailer =
    movie.videos?.results?.find((v) => v.site === 'YouTube' && v.type === 'Trailer') ||
    movie.videos?.results?.find((v) => v.site === 'YouTube' && v.type === 'Teaser');

  const watchProvidersAll = movie['watch/providers']?.results || {};
  const currentProviders = watchProvidersAll[userRegion] || watchProvidersAll['US'];

  const formatCurrency = (val?: number) => {
    if (!val || val <= 0) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="pb-24">
      {/* Clean Cinematic Backdrop Header */}
      <div className="relative min-h-[460px] w-full overflow-hidden bg-[#09090b]">
        {/* Backdrop Image with gradient overlay */}
        <div className="absolute inset-0">
          <img
            src={
              movie.backdrop_path
                ? getTMDBImageUrl(movie.backdrop_path, 'original')
                : getBackdropFallback()
            }
            alt=""
            className="h-full w-full object-cover object-top opacity-30 filter brightness-[0.65]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#09090b] via-[#09090b]/60 to-transparent" />
        </div>

        {/* Content Container */}
        <div className="relative z-10 mx-auto max-w-7xl px-4 pt-6 pb-10 md:px-8">
          {/* Back button */}
          <button
            onClick={() => window.history.back()}
            className="mb-6 flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>

          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Poster Card */}
            <div className="w-48 sm:w-60 md:w-64 shrink-0 overflow-hidden rounded-2xl border border-zinc-800 shadow-2xl bg-zinc-900 aspect-[2/3]">
              <img
                src={movie.poster_path ? getTMDBImageUrl(movie.poster_path, 'w500') : getPosterFallback(movie.title)}
                alt={movie.title}
                className="h-full w-full object-cover"
              />
            </div>

            {/* Details Information */}
            <div className="flex-1 text-zinc-200">
              {/* Badges / Minimalist Metadata */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-zinc-400 mb-2">
                <span className="font-bold text-rose-500 uppercase tracking-wider text-[11px]">Movie</span>
                {releaseYear && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{releaseYear}</span>
                  </>
                )}
                {runtimeFormatted && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{runtimeFormatted}</span>
                  </>
                )}
                {movie.original_language && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="uppercase">{movie.original_language}</span>
                  </>
                )}
              </div>

              {/* Title & Tagline */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white font-['Oswald',sans-serif]">
                {movie.title}
              </h1>
              {movie.tagline && (
                <p className="mt-1 text-xs sm:text-sm italic text-zinc-400">&ldquo;{movie.tagline}&rdquo;</p>
              )}

              {/* Rating & Genres */}
              <div className="mt-3.5 flex flex-wrap items-center gap-4 text-xs font-medium">
                {movie.vote_average > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-bold text-white">{movie.vote_average.toFixed(1)}</span>
                    <span className="text-zinc-500">/ 10 ({movie.vote_count.toLocaleString()} votes)</span>
                  </div>
                )}

                {movie.genres && movie.genres.length > 0 && (
                  <div className="flex items-center gap-2 text-zinc-400">
                    <span aria-hidden="true">·</span>
                    <span>{movie.genres.map((g) => g.name).join(', ')}</span>
                  </div>
                )}
              </div>

              {/* Overview */}
              <div className="mt-4">
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-3xl">
                  {movie.overview || 'No synopsis summary available for this title.'}
                </p>
              </div>

              {/* Key Crew info */}
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1.5 text-xs text-zinc-400 border-t border-zinc-800/80 pt-3">
                {director && (
                  <div>
                    <span className="text-zinc-500">Director: </span>
                    <span className="font-medium text-zinc-200">{director.name}</span>
                  </div>
                )}
                {movie.budget !== undefined && movie.budget > 0 && (
                  <div>
                    <span className="text-zinc-500">Budget: </span>
                    <span className="font-medium text-zinc-200">{formatCurrency(movie.budget)}</span>
                  </div>
                )}
                {movie.revenue !== undefined && movie.revenue > 0 && (
                  <div>
                    <span className="text-zinc-500">Box Office: </span>
                    <span className="font-medium text-zinc-200">{formatCurrency(movie.revenue)}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => navigate(`/watch/movie/${movie.id}`)}
                  className="flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-950/40 hover:bg-rose-500 active:scale-95 transition"
                >
                  <Play className="h-4 w-4 fill-white" />
                  <span>Stream Movie</span>
                </button>

                {officialTrailer && (
                  <button
                    onClick={() => openTrailer(officialTrailer.key, movie.title, 'movie', movie.id)}
                    className="flex items-center gap-2 rounded-xl bg-zinc-850 px-4 py-2.5 text-xs font-medium text-zinc-200 hover:bg-zinc-800 transition"
                  >
                    <Tv className="h-4 w-4 text-zinc-400" />
                    <span>Watch Trailer</span>
                  </button>
                )}

                <button
                  onClick={() =>
                    toggleWatchlist({
                      id: movie.id,
                      media_type: 'movie',
                      title: movie.title,
                      poster_path: movie.poster_path,
                      backdrop_path: movie.backdrop_path,
                      vote_average: movie.vote_average,
                      release_year: releaseYear,
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

      {/* Main Details Body */}
      <div className="mx-auto max-w-7xl px-4 md:px-8 mt-8 space-y-10">
        {/* Production Studios */}
        {movie.production_companies && movie.production_companies.length > 0 && (
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-rose-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Production Studios
              </h2>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {movie.production_companies.map((comp) => (
                <button
                  key={comp.id}
                  onClick={() => navigate(`/company/${comp.id}`)}
                  className="flex items-center gap-2.5 rounded-xl border border-zinc-800 bg-[#121215] px-3.5 py-2 text-xs font-medium text-zinc-200 hover:border-zinc-700 hover:bg-zinc-850 transition"
                >
                  {comp.logo_path && (
                    <img
                      src={getTMDBImageUrl(comp.logo_path, 'w92')}
                      alt=""
                      className="h-4 max-w-[50px] object-contain filter invert brightness-200"
                    />
                  )}
                  <span>{comp.name}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Legal Where to Watch (JustWatch via TMDB) */}
        <section className="rounded-2xl border border-zinc-800/80 bg-[#121215] p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Official Watch Providers
              </h2>
              <p className="text-xs text-zinc-400">
                Licensed streaming availability in your country.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400">Country:</span>
              <select
                value={userRegion}
                onChange={(e) => setUserRegion(e.target.value)}
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500"
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
            {/* Stream */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2.5">
                Subscription
              </div>
              {currentProviders?.flatrate && currentProviders.flatrate.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {currentProviders.flatrate.map((prov) => (
                    <div
                      key={prov.provider_id}
                      title={prov.provider_name}
                      className="flex items-center gap-2 rounded-xl bg-zinc-900 border border-zinc-800 p-2 pr-3"
                    >
                      <img
                        src={getTMDBImageUrl(prov.logo_path, 'w92')}
                        alt={prov.provider_name}
                        className="h-6 w-6 rounded-md object-cover"
                      />
                      <span className="text-xs text-zinc-300">{prov.provider_name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-zinc-500">Not in standard subscription streaming in this region.</div>
              )}
            </div>

            {/* Rent */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2.5">
                Rent
              </div>
              {currentProviders?.rent && currentProviders.rent.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {currentProviders.rent.map((prov) => (
                    <div
                      key={prov.provider_id}
                      title={prov.provider_name}
                      className="flex items-center gap-2 rounded-xl bg-zinc-900 border border-zinc-800 p-2 pr-3"
                    >
                      <img
                        src={getTMDBImageUrl(prov.logo_path, 'w92')}
                        alt={prov.provider_name}
                        className="h-6 w-6 rounded-md object-cover"
                      />
                      <span className="text-xs text-zinc-300">{prov.provider_name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-zinc-500">No rental options listed.</div>
              )}
            </div>

            {/* Buy */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2.5">
                Buy
              </div>
              {currentProviders?.buy && currentProviders.buy.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {currentProviders.buy.map((prov) => (
                    <div
                      key={prov.provider_id}
                      title={prov.provider_name}
                      className="flex items-center gap-2 rounded-xl bg-zinc-900 border border-zinc-800 p-2 pr-3"
                    >
                      <img
                        src={getTMDBImageUrl(prov.logo_path, 'w92')}
                        alt={prov.provider_name}
                        className="h-6 w-6 rounded-md object-cover"
                      />
                      <span className="text-xs text-zinc-300">{prov.provider_name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-zinc-500">No digital purchase options listed.</div>
              )}
            </div>
          </div>
        </section>

        {/* Top Billed Cast */}
        {movie.credits?.cast && movie.credits.cast.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4">
              Top Cast
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-none">
              {movie.credits.cast.slice(0, 14).map((actor) => (
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

        {/* Recommendations */}
        {movie.recommendations?.results && movie.recommendations.results.length > 0 && (
          <ContentRow
            title="Recommended Movies"
            subtitle="Based on this title"
            items={movie.recommendations.results}
            mediaTypeOverride="movie"
          />
        )}
      </div>
    </div>
  );
};
