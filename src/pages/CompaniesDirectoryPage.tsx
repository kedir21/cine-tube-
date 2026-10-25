import React from 'react';
import { Building2, Globe2, ArrowRight } from 'lucide-react';
import { CURATED_COMPANIES } from '../data/curatedCompanies';
import { getTMDBImageUrl } from '../services/tmdbApi';
import { useApp } from '../context/AppContext';

export const CompaniesDirectoryPage: React.FC = () => {
  const { navigate } = useApp();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 pb-20">
      {/* Page Header */}
      <div className="mb-8 border-b border-neutral-800 pb-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-red-500 mb-1">
          <Building2 className="h-4 w-4" />
          <span>Production Companies &amp; Studios</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white font-['Oswald',sans-serif]">
          STUDIO DIRECTORY
        </h1>
        <p className="mt-2 text-sm text-neutral-400 max-w-2xl">
          Explore movies and television productions cataloged by the world’s most iconic film studios and independent powerhouses using real TMDB company metadata.
        </p>
      </div>

      {/* Grid of Companies */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {CURATED_COMPANIES.map((company) => (
          <div
            key={company.id}
            onClick={() => navigate(`/company/${company.id}`)}
            className="group flex flex-col justify-between rounded-2xl border border-neutral-800 bg-[#161616] p-5 shadow-lg transition-all duration-300 hover:border-neutral-700 hover:bg-[#1a1a1a] hover:shadow-2xl cursor-pointer"
          >
            <div>
              {/* Studio Logo Container */}
              <div className="flex h-20 w-full items-center justify-center rounded-xl bg-neutral-900 border border-neutral-800/80 p-3 mb-4 group-hover:border-neutral-700 transition">
                {company.logoPath ? (
                  <img
                    src={getTMDBImageUrl(company.logoPath, 'w300')}
                    alt={company.name}
                    className="max-h-full max-w-full object-contain filter invert brightness-200 group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <Building2 className="h-8 w-8 text-neutral-500" />
                )}
              </div>

              {/* Title & Metadata */}
              <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
                <span className="flex items-center gap-1">
                  <Globe2 className="h-3 w-3" />
                  {company.originCountry}
                </span>
                {company.founded && <span>Est. {company.founded}</span>}
              </div>

              <h2 className="text-lg font-bold text-white group-hover:text-red-400 transition-colors font-['Oswald',sans-serif]">
                {company.name}
              </h2>

              <p className="mt-2 text-xs text-neutral-400 line-clamp-3 leading-relaxed">
                {company.description}
              </p>
            </div>

            {/* Bottom link */}
            <div className="mt-5 flex items-center justify-between border-t border-neutral-800/80 pt-3 text-xs font-semibold text-neutral-300 group-hover:text-red-400 transition-colors">
              <span>Explore Catalog</span>
              <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
