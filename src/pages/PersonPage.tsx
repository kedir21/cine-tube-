import React, { useEffect, useState } from 'react';
import { User, Calendar, MapPin, ArrowLeft, Film, Tv } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { tmdbApi, getTMDBImageUrl } from '../services/tmdbApi';
import { MovieCard } from '../components/common/MovieCard';
import { TMDBPerson } from '../types/tmdb';

interface PersonPageProps {
  personId: number;
}

export const PersonPage: React.FC<PersonPageProps> = ({ personId }) => {
  const { navigate } = useApp();
  const [person, setPerson] = useState<TMDBPerson | null>(null);
  const [contentTab, setContentTab] = useState<'all' | 'movies' | 'tv'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;
    const loadPerson = async () => {
      setIsLoading(true);
      try {
        const data = await tmdbApi.getPersonDetails(personId);
        if (!isCancelled) setPerson(data);
      } catch (err) {
        console.error('Failed to load person:', err);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };
    loadPerson();
    return () => {
      isCancelled = true;
    };
  }, [personId]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
      </div>
    );
  }

  if (!person) {
    return (
      <div className="p-8 text-center text-sm text-neutral-400">
        Person information not available.
      </div>
    );
  }

  const movieCredits = (person as any).movie_credits?.cast || (person as any).combined_credits?.cast?.filter((x: any) => x.media_type === 'movie') || [];
  const tvCredits = (person as any).tv_credits?.cast || (person as any).combined_credits?.cast?.filter((x: any) => x.media_type === 'tv') || [];
  const allCredits = (person as any).combined_credits?.cast || [...movieCredits, ...tvCredits];

  const displayedWorks =
    contentTab === 'movies'
      ? movieCredits
      : contentTab === 'tv'
      ? tvCredits
      : allCredits;

  // Deduplicate by ID
  const uniqueWorks = Array.from(new Map(displayedWorks.map((item: any) => [item.id, item])).values())
    .sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 pb-20">
      <button
        onClick={() => window.history.back()}
        className="mb-6 flex items-center gap-1.5 text-xs font-semibold text-neutral-400 hover:text-white transition"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back</span>
      </button>

      <div className="flex flex-col md:flex-row gap-8 items-start mb-10">
        {/* Photo */}
        <div className="w-48 sm:w-56 shrink-0 aspect-[2/3] overflow-hidden rounded-2xl bg-neutral-900 border border-neutral-800 shadow-xl">
          {person.profile_path ? (
            <img
              src={getTMDBImageUrl(person.profile_path, 'h632')}
              alt={person.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-neutral-600">
              <User className="h-16 w-16" />
            </div>
          )}
        </div>

        {/* Bio & Details */}
        <div className="flex-1">
          <div className="text-xs uppercase tracking-wider text-red-500 font-bold mb-1">
            {person.known_for_department || 'Film & Television'}
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white font-['Oswald',sans-serif]">
            {person.name}
          </h1>

          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-xs text-neutral-400">
            {person.birthday && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Born: {person.birthday}
              </span>
            )}
            {person.place_of_birth && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {person.place_of_birth}
              </span>
            )}
          </div>

          {person.biography && (
            <div className="mt-5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">Biography</h2>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed whitespace-pre-line max-h-60 overflow-y-auto pr-2 scrollbar-thin">
                {person.biography}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Filmography Section */}
      <section className="border-t border-neutral-800 pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white font-['Oswald',sans-serif]">
              KNOWN FOR &amp; FILMOGRAPHY
            </h2>
            <p className="text-xs text-neutral-400">
              Titles starring or directed by {person.name}
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center gap-1 p-1 bg-neutral-900 rounded-xl border border-neutral-800">
            <button
              onClick={() => setContentTab('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                contentTab === 'all' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              All Works ({uniqueWorks.length})
            </button>
            <button
              onClick={() => setContentTab('movies')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                contentTab === 'movies' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Movies
            </button>
            <button
              onClick={() => setContentTab('tv')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                contentTab === 'tv' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              TV Series
            </button>
          </div>
        </div>

        {uniqueWorks.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {uniqueWorks.map((work: any) => (
              <MovieCard
                key={`${work.media_type || 'work'}-${work.id}`}
                item={work}
                mediaTypeOverride={work.media_type === 'tv' ? 'tv' : 'movie'}
              />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-neutral-400">
            No filmography records found for this category.
          </div>
        )}
      </section>
    </div>
  );
};
