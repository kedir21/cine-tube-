import React from 'react';
import { Bookmark, BookmarkCheck, Play, Star, Film, Tv } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TMDBMovie, TMDBTVShow } from '../../types/tmdb';
import { getTMDBImageUrl, getPosterFallback } from '../../services/tmdbApi';
import { GENRE_MAP } from '../../data/curatedCompanies';

interface MovieCardProps {
  item: TMDBMovie | TMDBTVShow | any;
  mediaTypeOverride?: 'movie' | 'tv';
  aspectRatio?: 'poster' | 'backdrop';
}

export const MovieCard: React.FC<MovieCardProps> = ({
  item,
  mediaTypeOverride,
  aspectRatio = 'poster',
}) => {
  const { navigate, openTrailer, toggleWatchlist, isInWatchlist } = useApp();

  const isTv = mediaTypeOverride === 'tv' || item.media_type === 'tv' || (!item.title && !!item.name);
  const mediaType: 'movie' | 'tv' = isTv ? 'tv' : 'movie';
  const title = item.title || item.name || 'Untitled';
  const dateStr = item.release_date || item.first_air_date || '';
  const year = dateStr ? dateStr.slice(0, 4) : '';
  const rating = typeof item.vote_average === 'number' && item.vote_average > 0 ? item.vote_average.toFixed(1) : null;
  const inWatchlist = isInWatchlist(item.id, mediaType);

  const posterSrc =
    aspectRatio === 'backdrop'
      ? item.backdrop_path
        ? getTMDBImageUrl(item.backdrop_path, 'w780')
        : getTMDBImageUrl(item.poster_path, 'w500')
      : item.poster_path
      ? getTMDBImageUrl(item.poster_path, 'w500')
      : null;

  // Extract primary genre name
  const genreId = item.genre_ids?.[0] || item.genres?.[0]?.id;
  const genreName = item.genres?.[0]?.name || (genreId ? GENRE_MAP[genreId] : null);

  const handleCardClick = () => {
    navigate(`/${mediaType}/${item.id}`);
  };

  const handleQuickTrailer = (e: React.MouseEvent) => {
    e.stopPropagation();
    const trailer = item.videos?.results?.find(
      (v: any) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
    );
    if (trailer) {
      openTrailer(trailer.key, title, mediaType, item.id);
    } else {
      // Navigate to details page where trailer can be fetched
      navigate(`/${mediaType}/${item.id}`);
    }
  };

  const handleWatchlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWatchlist({
      id: item.id,
      media_type: mediaType,
      title,
      poster_path: item.poster_path || null,
      backdrop_path: item.backdrop_path || null,
      vote_average: item.vote_average || 0,
      release_year: year,
    });
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative flex flex-col cursor-pointer transition-all duration-200 select-none"
    >
      {/* Poster Image Container */}
      <div
        className={`relative w-full overflow-hidden rounded-xl bg-neutral-900 border border-neutral-800/80 shadow-md transition-all duration-300 group-hover:border-neutral-700 group-hover:shadow-xl group-hover:scale-[1.02] ${
          aspectRatio === 'backdrop' ? 'aspect-video' : 'aspect-[2/3]'
        }`}
      >
        <img
          src={posterSrc || getPosterFallback(title)}
          alt={title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = getPosterFallback(title);
          }}
        />

        {/* Subtle Dark Gradient Overlay on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex flex-col justify-between p-3">
          {/* Top Row: Media Type & Watchlist Button */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-300 backdrop-blur-md">
              {isTv ? <Tv className="h-2.5 w-2.5 text-emerald-400" /> : <Film className="h-2.5 w-2.5 text-red-500" />}
              {isTv ? 'TV' : 'Movie'}
            </span>

            <button
              onClick={handleWatchlistClick}
              title={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
              aria-label={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
              className={`flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md transition ${
                inWatchlist
                  ? 'bg-red-600 text-white'
                  : 'bg-black/60 text-white hover:bg-neutral-800'
              }`}
            >
              {inWatchlist ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
            </button>
          </div>

          {/* Center Play Button on Hover */}
          <div className="flex justify-center">
            <button
              onClick={handleQuickTrailer}
              aria-label="Play Trailer"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-red-600/90 text-white shadow-lg transition-transform hover:scale-110 hover:bg-red-600"
            >
              <Play className="h-5 w-5 fill-white ml-0.5" />
            </button>
          </div>

          {/* Bottom overview peek */}
          <div className="text-[11px] line-clamp-2 text-neutral-300 leading-tight">
            {item.overview || 'Click for full cast, trailer & streaming providers.'}
          </div>
        </div>

        {/* Rating Badge (Always visible in top right if rated) */}
        {rating && (
          <div className="absolute top-2 right-2 flex items-center gap-1 rounded-md bg-black/75 px-1.5 py-0.5 text-[11px] font-semibold text-neutral-200 backdrop-blur-md group-hover:opacity-0 transition-opacity">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span>{rating}</span>
          </div>
        )}
      </div>

      {/* Title & Metadata (Clean typography, zero pill capsules) */}
      <div className="mt-2 flex flex-col">
        <h3 className="truncate text-sm font-semibold text-neutral-100 transition-colors group-hover:text-red-400">
          {title}
        </h3>
        <div className="flex items-center gap-1.5 text-xs text-neutral-400 mt-0.5">
          {year && <span>{year}</span>}
          {year && (genreName || rating) && <span aria-hidden="true">·</span>}
          {genreName && <span>{genreName}</span>}
          {rating && !genreName && (
            <span className="flex items-center gap-1 text-amber-400">
              <Star className="h-2.5 w-2.5 fill-amber-400" />
              {rating}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
