import React, { useEffect, useState } from 'react';
import { HeroBanner } from '../components/common/HeroBanner';
import { ContentRow } from '../components/common/ContentRow';
import { HeroSkeleton, ContentRowSkeleton } from '../components/common/LoadingSkeleton';
import { tmdbApi, HomeRowsData, getTMDBImageUrl } from '../services/tmdbApi';
import { CURATED_COMPANIES } from '../data/curatedCompanies';
import { useApp } from '../context/AppContext';
import { Building2, Sparkles, AlertCircle, RefreshCw, Play } from 'lucide-react';

export const HomePage: React.FC = () => {
  const { navigate, history } = useApp();
  const [data, setData] = useState<HomeRowsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await tmdbApi.getHomeRows();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load movie & TV discovery feed.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="pb-16">
        <HeroSkeleton />
        <ContentRowSkeleton />
        <ContentRowSkeleton />
        <ContentRowSkeleton />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-3" />
        <h2 className="text-xl font-bold text-white">Could not load movie catalog</h2>
        <p className="mt-1 text-sm text-neutral-400 max-w-md">{error || 'Please check your connection.'}</p>
        <button
          onClick={loadData}
          className="mt-4 flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  return (
    <div className="pb-16">
      {/* Featured Hero Banner */}
      <HeroBanner item={data.hero} />

      {/* Studios Quick Selection Spotlight */}
      <section className="px-4 md:px-6 my-6">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-red-500" />
            <h2 className="text-lg md:text-xl font-bold tracking-tight text-white font-['Oswald',sans-serif]">
              BROWSE BY PRODUCTION STUDIO
            </h2>
          </div>
          <button
            onClick={() => navigate('/companies')}
            className="text-xs font-semibold text-neutral-400 transition hover:text-red-400"
          >
            All Studios ({CURATED_COMPANIES.length}) →
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {CURATED_COMPANIES.slice(0, 7).map((studio) => (
            <button
              key={studio.id}
              onClick={() => navigate(`/company/${studio.id}`)}
              className="group relative flex flex-col items-center justify-center rounded-xl border border-zinc-800/80 bg-[#121215] p-3 text-center transition hover:border-zinc-700 hover:bg-zinc-850/60 focus-visible:outline-none"
            >
              <div className="flex h-10 w-20 items-center justify-center mb-2">
                {studio.logoPath ? (
                  <img
                    src={getTMDBImageUrl(studio.logoPath, 'w185')}
                    alt={studio.name}
                    className="max-h-full max-w-full object-contain filter invert brightness-200 group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <Building2 className="h-6 w-6 text-zinc-500" />
                )}
              </div>
              <span className="text-xs font-semibold text-zinc-200 group-hover:text-white truncate w-full">
                {studio.shortName}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Continue Watching Section */}
      {history.length > 0 && (
        <section className="px-4 md:px-6 my-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Play className="h-4 w-4 text-red-500 fill-red-500" />
              <h2 className="text-base md:text-lg font-bold tracking-tight text-white font-['Oswald',sans-serif]">
                CONTINUE WATCHING
              </h2>
            </div>
            <button
              onClick={() => navigate('/history')}
              className="text-xs font-medium text-zinc-400 transition hover:text-white"
            >
              View Full History →
            </button>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-3 pt-1 scrollbar-none">
            {history.slice(0, 10).map((item) => {
              const resumeUrl =
                item.media_type === 'tv'
                  ? `/watch/tv/${item.id}?season=${item.season || 1}&episode=${item.episode || 1}`
                  : `/watch/movie/${item.id}`;
              const progress = item.progress_percent || (item.currentTime && item.duration ? (item.currentTime / item.duration) * 100 : 0);

              return (
                <div
                  key={`continue-${item.media_type}-${item.id}`}
                  onClick={() => navigate(resumeUrl)}
                  className="group relative flex w-48 sm:w-56 shrink-0 flex-col cursor-pointer transition select-none"
                >
                  <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-zinc-900 border border-zinc-800/80 shadow-md group-hover:border-zinc-700 transition">
                    <img
                      src={
                        item.backdrop_path
                          ? getTMDBImageUrl(item.backdrop_path, 'w500')
                          : item.poster_path
                          ? getTMDBImageUrl(item.poster_path, 'w500')
                          : ''
                      }
                      alt={item.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                    />

                    {/* Dark gradient & Play icon */}
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center transition">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600/90 text-white shadow-lg group-hover:scale-110 transition">
                        <Play className="h-4 w-4 fill-white ml-0.5" />
                      </div>
                    </div>

                    {/* Progress bar line */}
                    {progress > 0 && (
                      <div className="absolute bottom-0 inset-x-0 h-1 bg-neutral-800">
                        <div
                          className="h-full bg-red-600"
                          style={{ width: `${Math.min(100, Math.max(5, progress))}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="mt-2 text-xs font-semibold text-white group-hover:text-red-400 truncate">
                    {item.title}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                    <span className="uppercase text-red-500 font-bold">{item.media_type}</span>
                    {item.media_type === 'tv' && item.season && item.episode && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>S{item.season} E{item.episode}</span>
                      </>
                    )}
                    {item.currentTime && item.currentTime > 0 && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{Math.floor(item.currentTime / 60)}m left</span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Content Rows */}
      <ContentRow
        title="🔥 Trending Today"
        subtitle="Most watched titles across the globe in the last 24 hours"
        items={data.trendingToday}
        exploreLink="/trending"
        onExplore={() => navigate('/trending')}
      />

      <ContentRow
        title="⚡ Trending This Week"
        subtitle="What everyone is tuning into right now"
        items={data.trendingWeek}
        exploreLink="/trending"
        onExplore={() => navigate('/trending')}
      />

      <ContentRow
        title="🎬 Popular Movies"
        subtitle="Blockbusters drawing millions of viewers worldwide"
        items={data.popularMovies}
        mediaTypeOverride="movie"
        exploreLink="/movies"
        onExplore={() => navigate('/movies')}
      />

      <ContentRow
        title="📺 Popular TV Shows"
        subtitle="Critically acclaimed series and trending episodes"
        items={data.popularTV}
        mediaTypeOverride="tv"
        exploreLink="/tv-shows"
        onExplore={() => navigate('/tv-shows')}
      />

      <ContentRow
        title="🍿 Now Playing in Theaters"
        subtitle="Currently lighting up the big screen"
        items={data.nowPlaying}
        mediaTypeOverride="movie"
        exploreLink="/movies?filter=now_playing"
        onExplore={() => navigate('/movies?filter=now_playing')}
      />

      <ContentRow
        title="🚀 Upcoming Movies"
        subtitle="Anticipated cinematic releases arriving soon"
        items={data.upcoming}
        mediaTypeOverride="movie"
        exploreLink="/movies?filter=upcoming"
        onExplore={() => navigate('/movies?filter=upcoming')}
      />

      <ContentRow
        title="🏆 Top-Rated Movies of All Time"
        subtitle="Masterpieces voted highest by the global community"
        items={data.topRatedMovies}
        mediaTypeOverride="movie"
        exploreLink="/movies?sort=top_rated"
        onExplore={() => navigate('/movies?sort=top_rated')}
      />

      <ContentRow
        title="🌟 Top-Rated TV Masterpieces"
        subtitle="The highest praised television of our era"
        items={data.topRatedTV}
        mediaTypeOverride="tv"
        exploreLink="/tv-shows?sort=top_rated"
        onExplore={() => navigate('/tv-shows?sort=top_rated')}
      />

      <ContentRow
        title="💥 Popular Action Movies"
        subtitle="Adrenaline-fueled adventures and high-octane thrillers"
        items={data.actionMovies}
        mediaTypeOverride="movie"
        exploreLink="/genre/28"
        onExplore={() => navigate('/genre/28')}
      />

      <ContentRow
        title="😂 Popular Comedy Movies"
        subtitle="Laugh-out-loud favorites and witty satires"
        items={data.comedyMovies}
        mediaTypeOverride="movie"
        exploreLink="/genre/35"
        onExplore={() => navigate('/genre/35')}
      />

      <ContentRow
        title="🎭 Gripping Dramas"
        subtitle="Compelling stories with profound emotion"
        items={data.dramaMovies}
        mediaTypeOverride="movie"
        exploreLink="/genre/18"
        onExplore={() => navigate('/genre/18')}
      />

      <ContentRow
        title="🌌 Science Fiction &amp; Beyond"
        subtitle="Mind-bending journeys across galaxies and multiverses"
        items={data.scifiMovies}
        mediaTypeOverride="movie"
        exploreLink="/genre/878"
        onExplore={() => navigate('/genre/878')}
      />

      <ContentRow
        title="🎨 Beloved Animation"
        subtitle="Visually stunning wonder for all ages"
        items={data.animationMovies}
        mediaTypeOverride="movie"
        exploreLink="/genre/16"
        onExplore={() => navigate('/genre/16')}
      />
    </div>
  );
};
