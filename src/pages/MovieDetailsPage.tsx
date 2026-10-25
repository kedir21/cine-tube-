import React, { useEffect, useState } from 'react';
import {
  Play,
  Bookmark,
  BookmarkCheck,
  Star,
  Clock,
  Calendar,
  Globe,
  DollarSign,
  Building2,
  Tv,
  Share2,
  ArrowLeft,
  Tv2,
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
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
          <span className="text-xs text-neutral-400">Loading TMDB metadata...</span>
        </div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold text-white">Movie not found</h2>
        <p className="mt-1 text-xs text-neutral-400">{error || 'Unable to retrieve title from TMDB.'}</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 flex items-center gap-2 rounded-xl bg-neutral-800 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-700"
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

  // Director
  const director = movie.credits?.crew?.find((c) => c.job === 'Director');

  // Official Trailer
  const officialTrailer =
    movie.videos?.results?.find((v) => v.site === 'YouTube' && v.type === 'Trailer') ||
    movie.videos?.results?.find((v) => v.site === 'YouTube' && v.type === 'Teaser');

  // Watch providers for selected region
  const watchProvidersAll = movie['watch/providers']?.results || {};
  const currentProviders = watchProvidersAll[userRegion] || watchProvidersAll['US'];

  const formatCurrency = (val?: number) => {
    if (!val || val <= 0) return 'Undisclosed';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="pb-20">
      {/* Backdrop Header with Ambient Glow */}
      <div className="relative min-h-[500px] w-full overflow-hidden bg-neutral-950">
        <img
          src={
            movie.backdrop_path
              ? getTMDBImageUrl(movie.backdrop_path, 'original')
              : getBackdropFallback()
          }
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-top opacity-35 filter brightness-[0.7]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f0f0f] via-[#0f0f0f]/60 to-transparent" />

        {/* Content Container */}
        <div className="relative z-10 mx-auto max-w-7xl px-4 pt-8 pb-12 md:px-8">
          <button
            onClick={() => window.history.back()}
            className="mb-6 flex items-center gap-1.5 text-xs font-semibold text-neutral-400 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>

          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Movie Poster */}
            <div className="w-52 sm:w-64 md:w-72 shrink-0 overflow-hidden rounded-2xl border border-neutral-700/80 shadow-2xl bg-neutral-900 aspect-[2/3]">
              <img
                src={movie.poster_path ? getTMDBImageUrl(movie.poster_path, 'w500') : getPosterFallback(movie.title)}
                alt={movie.title}
                className="h-full w-full object-cover"
              />
            </div>

            {/* Details Column */}
            <div className="flex-1 text-neutral-200">
              {/* Unboxed Metadata (Zero-pill discipline) */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-neutral-400 mb-1.5">
                <span className="uppercase tracking-widest text-red-500 font-bold">Movie</span>
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
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white font-['Oswald',sans-serif]">
                {movie.title}
              </h1>
              {movie.tagline && (
                <p className="mt-1 text-sm italic text-neutral-400">&ldquo;{movie.tagline}&rdquo;</p>
              )}

              {/* Rating and Genre list */}
              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-medium">
                {movie.vote_average > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="text-base font-bold text-white">{movie.vote_average.toFixed(1)}</span>
                    <span className="text-neutral-400">/ 10 ({movie.vote_count.toLocaleString()} votes)</span>
                  </div>
                )}

                {movie.genres && movie.genres.length > 0 && (
                  <div className="flex items-center gap-2 text-neutral-300">
                    <span aria-hidden="true">·</span>
                    <span>{movie.genres.map((g) => g.name).join(', ')}</span>
                  </div>
                )}
              </div>

              {/* Overview */}
              <div className="mt-5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Overview</h2>
                <p className="mt-1.5 text-sm sm:text-base text-neutral-300 leading-relaxed max-w-3xl">
                  {movie.overview || 'No overview summary currently available for this title.'}
                </p>
              </div>

              {/* Director & Key Info */}
              <div className="mt-5 flex flex-wrap gap-x-8 gap-y-2 text-xs text-neutral-300 border-t border-neutral-800/80 pt-4">
                {director && (
                  <div>
                    <span className="text-neutral-400">Director: </span>
                    <span className="font-semibold text-white">{director.name}</span>
                  </div>
                )}
                {movie.budget !== undefined && movie.budget > 0 && (
                  <div>
                    <span className="text-neutral-400">Budget: </span>
                    <span className="font-semibold text-white">{formatCurrency(movie.budget)}</span>
                  </div>
                )}
                {movie.revenue !== undefined && movie.revenue > 0 && (
                  <div>
                    <span className="text-neutral-400">Box Office Revenue: </span>
                    <span className="font-semibold text-white">{formatCurrency(movie.revenue)}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => navigate(`/watch/movie/${movie.id}`)}
                  className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-900/30 hover:bg-red-500 transition focus-visible:outline-none"
                >
                  <Play className="h-4 w-4 fill-white" />
                  <span>Stream Movie</span>
                </button>

                {officialTrailer && (
                  <button
                    onClick={() => openTrailer(officialTrailer.key, movie.title, 'movie', movie.id)}
                    className="flex items-center gap-2 rounded-xl bg-neutral-800 px-5 py-2.5 text-sm font-semibold text-neutral-200 hover:bg-neutral-700 transition"
                  >
                    <Tv className="h-4 w-4 text-neutral-400" />
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
        {/* Production Studios Section */}
        {movie.production_companies && movie.production_companies.length > 0 && (
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-red-500" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-400">
                Production Studios &amp; Companies
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {movie.production_companies.map((comp) => (
                <button
                  key={comp.id}
                  onClick={() => navigate(`/company/${comp.id}`)}
                  className="flex items-center gap-3 rounded-xl border border-neutral-800 bg-[#161616] px-4 py-2 text-xs font-semibold text-neutral-200 hover:border-neutral-600 hover:bg-neutral-800 transition"
                >
                  {comp.logo_path && (
                    <img
                      src={getTMDBImageUrl(comp.logo_path, 'w92')}
                      alt=""
                      className="h-5 max-w-[60px] object-contain filter invert brightness-200"
                    />
                  )}
                  <span>{comp.name}</span>
                  <span className="text-[10px] text-red-400 font-normal">View studio catalog →</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Watch Providers Availability (By Country) */}
        <section className="rounded-2xl border border-neutral-800 bg-[#141414] p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white font-['Oswald',sans-serif]">
                WHERE TO WATCH (LEGAL STREAMING)
              </h2>
              <p className="text-xs text-neutral-400">
                Official watch provider options powered by JustWatch data via TMDB.
              </p>
            </div>

            {/* Country Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400">Country:</span>
              <select
                value={userRegion}
                onChange={(e) => setUserRegion(e.target.value)}
                className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-red-600"
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
            {/* Stream / Subscription */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2.5">
                Stream (Subscription)
              </div>
              {currentProviders?.flatrate && currentProviders.flatrate.length > 0 ? (
                <div className="flex flex-wrap gap-2.5">
                  {currentProviders.flatrate.map((prov) => (
                    <div
                      key={prov.provider_id}
                      title={prov.provider_name}
                      className="flex items-center gap-2 rounded-xl bg-neutral-900 border border-neutral-800 p-2 pr-3"
                    >
                      <img
                        src={getTMDBImageUrl(prov.logo_path, 'w92')}
                        alt={prov.provider_name}
                        className="h-7 w-7 rounded-lg object-cover"
                      />
                      <span className="text-xs text-neutral-200">{prov.provider_name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-neutral-500">Not currently in standard subscription streaming in this region.</div>
              )}
            </div>

            {/* Rent */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2.5">
                Rent Online
              </div>
              {currentProviders?.rent && currentProviders.rent.length > 0 ? (
                <div className="flex flex-wrap gap-2.5">
                  {currentProviders.rent.map((prov) => (
                    <div
                      key={prov.provider_id}
                      title={prov.provider_name}
                      className="flex items-center gap-2 rounded-xl bg-neutral-900 border border-neutral-800 p-2 pr-3"
                    >
                      <img
                        src={getTMDBImageUrl(prov.logo_path, 'w92')}
                        alt={prov.provider_name}
                        className="h-7 w-7 rounded-lg object-cover"
                      />
                      <span className="text-xs text-neutral-200">{prov.provider_name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-neutral-500">No rental options listed.</div>
              )}
            </div>

            {/* Buy */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2.5">
                Buy Digital
              </div>
              {currentProviders?.buy && currentProviders.buy.length > 0 ? (
                <div className="flex flex-wrap gap-2.5">
                  {currentProviders.buy.map((prov) => (
                    <div
                      key={prov.provider_id}
                      title={prov.provider_name}
                      className="flex items-center gap-2 rounded-xl bg-neutral-900 border border-neutral-800 p-2 pr-3"
                    >
                      <img
                        src={getTMDBImageUrl(prov.logo_path, 'w92')}
                        alt={prov.provider_name}
                        className="h-7 w-7 rounded-lg object-cover"
                      />
                      <span className="text-xs text-neutral-200">{prov.provider_name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-neutral-500">No digital purchase options listed.</div>
              )}
            </div>
          </div>
        </section>

        {/* Cast & Crew Section */}
        {movie.credits?.cast && movie.credits.cast.length > 0 && (
          <section>
            <h2 className="text-base font-bold text-white uppercase tracking-wider font-['Oswald',sans-serif] mb-4">
              TOP BILLED CAST
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-none">
              {movie.credits.cast.slice(0, 14).map((actor) => (
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

        {/* Similar & Recommended Movies */}
        {movie.recommendations?.results && movie.recommendations.results.length > 0 && (
          <ContentRow
            title="Recommended Movies"
            subtitle="Based on viewers who loved this movie"
            items={movie.recommendations.results}
            mediaTypeOverride="movie"
          />
        )}

        {movie.similar?.results && movie.similar.results.length > 0 && (
          <ContentRow
            title="Similar Movies"
            subtitle="Titles with matching genres and themes"
            items={movie.similar.results}
            mediaTypeOverride="movie"
          />
        )}
      </div>
    </div>
  );
};
