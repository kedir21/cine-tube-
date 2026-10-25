import React from 'react';

export const MovieCardSkeleton: React.FC<{ aspectRatio?: 'poster' | 'backdrop' }> = ({
  aspectRatio = 'poster',
}) => {
  return (
    <div className="flex flex-col animate-pulse">
      <div
        className={`w-full rounded-xl bg-neutral-800/80 border border-neutral-800 ${
          aspectRatio === 'backdrop' ? 'aspect-video' : 'aspect-[2/3]'
        }`}
      />
      <div className="mt-2.5 h-4 w-3/4 rounded bg-neutral-800" />
      <div className="mt-1.5 h-3 w-1/2 rounded bg-neutral-800/60" />
    </div>
  );
};

export const ContentRowSkeleton: React.FC = () => {
  return (
    <div className="my-6 px-4 md:px-6">
      <div className="mb-3 h-6 w-48 rounded bg-neutral-800" />
      <div className="flex gap-4 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="w-36 sm:w-44 md:w-48 shrink-0">
            <MovieCardSkeleton />
          </div>
        ))}
      </div>
    </div>
  );
};

export const HeroSkeleton: React.FC = () => {
  return (
    <div className="relative w-full h-[60vh] min-h-[420px] max-h-[640px] bg-neutral-900 animate-pulse flex flex-col justify-end px-5 pb-10 md:px-12 md:pb-14">
      <div className="h-4 w-36 rounded bg-neutral-800 mb-3" />
      <div className="h-10 w-96 max-w-full rounded bg-neutral-800 mb-3" />
      <div className="h-4 w-full max-w-xl rounded bg-neutral-800/70 mb-2" />
      <div className="h-4 w-3/4 max-w-lg rounded bg-neutral-800/70 mb-6" />
      <div className="flex gap-3">
        <div className="h-10 w-32 rounded-xl bg-neutral-800" />
        <div className="h-10 w-32 rounded-xl bg-neutral-800" />
      </div>
    </div>
  );
};
