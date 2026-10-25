import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MovieCard } from './MovieCard';
import { TMDBMovie, TMDBTVShow } from '../../types/tmdb';

interface ContentRowProps {
  title: string;
  subtitle?: string;
  items: (TMDBMovie | TMDBTVShow | any)[];
  mediaTypeOverride?: 'movie' | 'tv';
  aspectRatio?: 'poster' | 'backdrop';
  exploreLink?: string;
  onExplore?: () => void;
}

export const ContentRow: React.FC<ContentRowProps> = ({
  title,
  subtitle,
  items,
  mediaTypeOverride,
  aspectRatio = 'poster',
  exploreLink,
  onExplore,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 20);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 20);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -scrollRef.current.clientWidth * 0.75 : scrollRef.current.clientWidth * 0.75;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
      setTimeout(checkScroll, 350);
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <section className="relative my-6 px-4 md:px-6">
      {/* Header */}
      <div className="mb-3 flex items-baseline justify-between">
        <div>
          <h2 className="text-lg md:text-xl font-bold tracking-tight text-white font-['Oswald',sans-serif]">
            {title}
          </h2>
          {subtitle && <p className="text-xs text-neutral-400 mt-0.5">{subtitle}</p>}
        </div>

        {(exploreLink || onExplore) && (
          <button
            onClick={onExplore}
            className="text-xs font-semibold text-neutral-400 transition hover:text-red-400"
          >
            Explore all →
          </button>
        )}
      </div>

      {/* Scrollable Container with Left/Right Buttons */}
      <div className="group relative">
        {/* Left Arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            aria-label="Scroll left"
            className="absolute -left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/80 text-white shadow-xl border border-neutral-700/80 transition hover:scale-110 hover:bg-neutral-900 focus-visible:outline-none"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        {/* Right Arrow */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            aria-label="Scroll right"
            className="absolute -right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/80 text-white shadow-xl border border-neutral-700/80 transition hover:scale-110 hover:bg-neutral-900 focus-visible:outline-none"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}

        {/* Row Items */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-4 overflow-x-auto pb-3 pt-1 scrollbar-none scroll-smooth"
        >
          {items.map((item) => (
            <div
              key={`${item.media_type || mediaTypeOverride || 'item'}-${item.id}`}
              className={
                aspectRatio === 'backdrop'
                  ? 'w-64 sm:w-72 md:w-80 shrink-0'
                  : 'w-36 sm:w-44 md:w-48 shrink-0'
              }
            >
              <MovieCard
                item={item}
                mediaTypeOverride={mediaTypeOverride}
                aspectRatio={aspectRatio}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
