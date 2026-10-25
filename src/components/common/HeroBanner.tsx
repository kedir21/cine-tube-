import React from 'react';
import { Play, Info, Bookmark, BookmarkCheck, Star } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TMDBMovie, TMDBTVShow } from '../../types/tmdb';
import { getTMDBImageUrl, getBackdropFallback } from '../../services/tmdbApi';
import { GENRE_MAP } from '../../data/curatedCompanies';

interface HeroBannerProps {
  item: TMDBMovie | TMDBTVShow | any;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ item }) => {
  const { navigate, openTrailer, toggleWatchlist, isInWatchlist } = useApp();

  if (!item) return null;

  const isTv = item.media_type === 'tv' || (!item.title && !!item.name);
  const mediaType: 'movie' | 'tv' = isTv ? 'tv' : 'movie';
  const title = item.title || item.name || 'Featured Title';
  const year = (item.release_date || item.first_air_date || '').slice(0, 4);
  const rating = item.vote_average ? item.vote_average.toFixed(1) : null;
  const inWatchlist = isInWatchlist(item.id, mediaType);

  const backdropUrl = item.backdrop_path
    ? getTMDBImageUrl(item.backdrop_path, 'original')
    : getBackdropFallback();

  const genreNames =
    item.genres?.map((g: any) => g.name) ||
    item.genre_ids?.map((id: number) => GENRE_MAP[id]).filter(Boolean) ||
    [];

  const trailer = item.videos?.results?.find(
    (v: any) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
  );

  const handleTrailerClick = () => {
    if (trailer) {
      openTrailer(trailer.key, title, mediaType, item.id);
    } else {
      navigate(`/${mediaType}/${item.id}`);
    }
  };

  return (
    <div className="relative w-full h-[60vh] min-h-[420px] max-h-[640px] overflow-hidden bg-neutral-950">
      {/* Cinematic Backdrop Image */}
      <img
        src={backdropUrl}
        alt={title}
        className="absolute inset-0 h-full w-full object-cover object-center filter brightness-[0.85]"
      />

      {/* Multi-directional Gradients for cinematic immersion */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0f0f0f] via-[#0f0f0f]/60 to-transparent w-full md:w-3/4" />

      {/* Content Container */}
      <div className="relative z-10 flex h-full flex-col justify-end px-5 pb-10 md:px-12 md:pb-14 max-w-3xl">
        {/* Genre & Meta Kicker (Clean unboxed text) */}
        <div className="flex items-center gap-2 text-xs md:text-sm font-medium text-neutral-300 mb-2">
          <span className="uppercase tracking-widest text-red-500 font-bold">
            Featured {isTv ? 'Series' : 'Film'}
          </span>
          {year && (
            <>
              <span aria-hidden="true">·</span>
              <span>{year}</span>
            </>
          )}
          {rating && (
            <>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1 text-amber-400 font-semibold">
                <Star className="h-3 w-3 fill-amber-400" />
                {rating}
              </span>
            </>
          )}
          {genreNames.length > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-neutral-400">{genreNames.slice(0, 3).join(', ')}</span>
            </>
          )}
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white font-['Oswald',sans-serif] leading-tight drop-shadow-md">
          {title}
        </h1>

        {/* Overview */}
        <p className="mt-3 text-xs sm:text-sm md:text-base text-neutral-200 line-clamp-3 max-w-2xl leading-relaxed drop-shadow">
          {item.overview}
        </p>

        {/* Interactive Action Controls */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {/* Watch Trailer / Play */}
          <button
            onClick={handleTrailerClick}
            className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-900/30 transition hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            <Play className="h-4 w-4 fill-white" />
            <span>Watch Trailer</span>
          </button>

          {/* Details Page */}
          <button
            onClick={() => navigate(`/${mediaType}/${item.id}`)}
            className="flex items-center gap-2 rounded-xl bg-neutral-800/90 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
          >
            <Info className="h-4 w-4 text-neutral-300" />
            <span>View Details</span>
          </button>

          {/* Watchlist Toggle */}
          <button
            onClick={() =>
              toggleWatchlist({
                id: item.id,
                media_type: mediaType,
                title,
                poster_path: item.poster_path,
                backdrop_path: item.backdrop_path,
                vote_average: item.vote_average || 0,
                release_year: year,
              })
            }
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold backdrop-blur-md transition border ${
              inWatchlist
                ? 'bg-red-950/60 text-red-300 border-red-800/60 hover:bg-red-900/40'
                : 'bg-black/60 text-neutral-200 border-neutral-700/60 hover:bg-neutral-800'
            }`}
          >
            {inWatchlist ? <BookmarkCheck className="h-4 w-4 text-red-400" /> : <Bookmark className="h-4 w-4" />}
            <span className="hidden sm:inline">{inWatchlist ? 'In Watchlist' : 'Watchlist'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
