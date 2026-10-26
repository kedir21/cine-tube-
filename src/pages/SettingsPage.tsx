import React, { useState } from 'react';
import {
  SlidersHorizontal,
  Key,
  Globe,
  Play,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Film,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { tmdbApi } from '../services/tmdbApi';
import { TMDB_CONFIG } from '../config/tmdb';
import { SUPPORTED_REGIONS } from '../data/curatedCompanies';
import { PWAInstallButton } from '../components/common/PWAInstallButton';

export const SettingsPage: React.FC = () => {
  const {
    apiStatus,
    refreshApiStatus,
    userRegion,
    setUserRegion,
    autoplayTrailers,
    setAutoplayTrailers,
    preferredPlayer,
    setPreferredPlayer,
    playerAccentColor,
    setPlayerAccentColor,
    clearHistory,
    history,
    replayIntro,
  } = useApp();

  const [tokenInput, setTokenInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;

    setIsSubmitting(true);
    setFeedback(null);
    try {
      const res = await tmdbApi.configureToken(tokenInput.trim());
      if (res.success) {
        await refreshApiStatus();
        setFeedback({
          type: 'success',
          message: 'TMDB credentials saved and activated successfully!',
        });
        setTokenInput('');
      } else {
        setFeedback({ type: 'error', message: 'Failed to configure token.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error configuring token' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-8 pb-20">
      {/* Header */}
      <div className="mb-8 border-b border-zinc-800/80 pb-5">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-red-500 mb-1">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>Application Settings</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
          Settings &amp; Configuration
        </h1>
        <p className="mt-1 text-xs text-zinc-400">
          Manage TMDB metadata connection, stream sources, country regions, and playback preferences.
        </p>
      </div>

      <div className="space-y-6">
        {/* TMDB API Integration Card */}
        <div className="rounded-xl border border-zinc-800/80 bg-[#121215] p-5 shadow-lg">
          <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-800/80">
            <Key className="h-4 w-4 text-red-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              The Movie Database (TMDB) API
            </h2>
          </div>

          <div className="mt-4 flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <div className="font-semibold text-white flex items-center gap-2">
                <span>Active TMDB Configuration Connected</span>
                <span className="rounded bg-emerald-950/80 px-2 py-0.5 text-[10px] font-mono text-emerald-400 border border-emerald-800/50">
                  Live v3 &amp; v4
                </span>
              </div>
              <p className="mt-1 text-zinc-400 leading-relaxed">
                The application uses centralized configuration with verified TMDB credentials (<code className="text-zinc-300 font-mono text-[11px] bg-zinc-800 px-1 py-0.5 rounded">src/config/tmdb.ts</code>). All movie and television queries, discovery feeds, studio rosters, cast credits, and watch providers query TMDB live directly or through the server proxy without requiring a <code className="text-zinc-300 font-mono text-[11px]">.env</code> file.
              </p>
            </div>
          </div>

          <form onSubmit={handleTokenSubmit} className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Override or Update TMDB Token / API Key (Optional)
              </label>
              <input
                type="password"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Paste your personal TMDB Read Access Token or API Key"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900/80 px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-zinc-600 focus:outline-none font-mono"
              />
            </div>

            {feedback && (
              <div
                className={`rounded-lg p-2.5 text-xs ${
                  feedback.type === 'success'
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                    : 'bg-red-950/80 text-red-300 border border-red-800'
                }`}
              >
                {feedback.message}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <a
                href="https://www.themoviedb.org/settings/api"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white"
              >
                <span>Get your own TMDB API key</span>
                <ExternalLink className="h-3 w-3" />
              </a>

              <button
                type="submit"
                disabled={isSubmitting || !tokenInput.trim()}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
              >
                {isSubmitting && <RefreshCw className="h-3 w-3 animate-spin" />}
                <span>Save Custom Token</span>
              </button>
            </div>
          </form>
        </div>

        {/* Region & Watch Providers */}
        <div className="rounded-xl border border-zinc-800/80 bg-[#121215] p-5 shadow-lg">
          <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-800/80">
            <Globe className="h-4 w-4 text-blue-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Watch Providers Region
            </h2>
          </div>

          <p className="mt-3 text-xs text-zinc-400">
            Watch provider availability differs across countries. Choose your preferred country to see accurate streaming options:
          </p>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {SUPPORTED_REGIONS.map((reg) => (
              <button
                key={reg.code}
                onClick={() => setUserRegion(reg.code)}
                className={`flex items-center justify-between rounded-lg border p-2.5 text-xs font-medium transition ${
                  userRegion === reg.code
                    ? 'border-red-600 bg-red-950/30 text-white'
                    : 'border-zinc-800/80 bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800/60 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="text-sm">{reg.flag}</span>
                  <span>{reg.name}</span>
                </span>
                <span className="font-mono text-[10px] text-zinc-500">{reg.code}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Playback Preferences */}
        <div className="rounded-xl border border-zinc-800/80 bg-[#121215] p-5 shadow-lg">
          <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-800/80">
            <Play className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Video Player &amp; Playback Sources
            </h2>
          </div>

          {/* Default Player Source */}
          <div className="mt-4">
            <label className="block text-xs font-medium text-white mb-1.5">
              Default Video Player Source
            </label>
            <p className="text-xs text-zinc-400 mb-3">
              Choose which video streaming server to prioritize when opening any title:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'vidy', name: 'Server 1: Vidy', desc: 'Auto-resume progress & episode controls' },
                { id: 'viduki', name: 'Server 2: Viduki', desc: 'Direct multi-CDN video player' },
                { id: 'vidzee', name: 'Server 3: Vidzee', desc: 'Fast alternative player embed' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPreferredPlayer(p.id as any)}
                  className={`flex flex-col text-left rounded-lg border p-3 transition ${
                    preferredPlayer === p.id
                      ? 'border-red-600 bg-red-950/30 text-white'
                      : 'border-zinc-800/80 bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800/60 hover:text-white'
                  }`}
                >
                  <span className="text-xs font-semibold text-white">{p.name}</span>
                  <span className="text-[11px] text-zinc-400 mt-1">{p.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Player Accent Color */}
          <div className="mt-6 border-t border-zinc-800/80 pt-4">
            <label className="block text-xs font-medium text-white mb-1.5">
              Player Accent Color
            </label>
            <p className="text-xs text-zinc-400 mb-2.5">
              Configures the accent color for supported embed players (Vidy, Viduki, Vidzee):
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <div
                  className="h-7 w-7 rounded-md border border-zinc-700 shadow-inner"
                  style={{ backgroundColor: `#${playerAccentColor}` }}
                />
                <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs font-mono text-white">
                  <span className="text-zinc-500 mr-1">#</span>
                  <input
                    type="text"
                    maxLength={6}
                    value={playerAccentColor}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9A-Fa-f]/g, '');
                      setPlayerAccentColor(val);
                    }}
                    className="w-16 bg-transparent uppercase focus:outline-none"
                    placeholder="DC2626"
                  />
                </div>
              </div>

              {/* Color Presets */}
              <div className="flex items-center gap-1.5">
                {[
                  { name: 'Red', hex: 'DC2626' },
                  { name: 'Purple', hex: '8C52FF' },
                  { name: 'Blue', hex: '2563EB' },
                  { name: 'Emerald', hex: '10B981' },
                  { name: 'Gold', hex: 'EAB308' },
                ].map((preset) => (
                  <button
                    key={preset.hex}
                    onClick={() => setPlayerAccentColor(preset.hex)}
                    title={preset.name}
                    className={`h-5 w-5 rounded-full border transition hover:scale-110 ${
                      playerAccentColor.toUpperCase() === preset.hex
                        ? 'border-white ring-2 ring-white/40'
                        : 'border-transparent'
                    }`}
                    style={{ backgroundColor: `#${preset.hex}` }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Autoplay Trailers Toggle */}
          <div className="mt-6 border-t border-zinc-800/80 pt-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-white">Autoplay Official Trailers</div>
              <div className="text-xs text-zinc-400">
                Automatically start playback when opening trailer dialogs.
              </div>
            </div>
            <button
              onClick={() => setAutoplayTrailers(!autoplayTrailers)}
              className={`h-5 w-10 rounded-full p-0.5 transition-colors ${
                autoplayTrailers ? 'bg-red-600' : 'bg-zinc-700'
              }`}
            >
              <div
                className={`h-4 w-4 rounded-full bg-white transition-transform ${
                  autoplayTrailers ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Data & History Management */}
        <div className="rounded-xl border border-zinc-800/80 bg-[#121215] p-5 shadow-lg">
          <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-800/80">
            <Trash2 className="h-4 w-4 text-rose-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Local Data Management
            </h2>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-medium text-white">Watch History ({history.length} items)</div>
              <div className="text-xs text-zinc-400">Clear all recorded video preview activity.</div>
            </div>
            <button
              onClick={clearHistory}
              disabled={history.length === 0}
              className="rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-1.5 text-xs font-medium text-zinc-300 hover:text-red-400 hover:bg-zinc-800/60 disabled:opacity-40 transition"
            >
              Clear Watch History
            </button>
          </div>
        </div>

        {/* Progressive Web App (PWA) Installation */}
        <div className="rounded-xl border border-zinc-800/80 bg-[#121215] p-5 shadow-lg">
          <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-800/80">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Progressive Web App &amp; Offline Experience
            </h2>
          </div>

          <p className="mt-3 text-xs text-zinc-400 mb-4">
            Install CineTube as a native standalone app on your desktop, macOS, Android, or iOS device with full offline caching and instant launch.
          </p>

          <PWAInstallButton variant="settings" />
        </div>

        {/* 3D Cinematic Skeleton Intro */}
        <div className="rounded-xl border border-zinc-800/80 bg-[#121215] p-5 shadow-lg">
          <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-800/80">
            <Film className="h-4 w-4 text-red-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Cinematic 3D Intro Animation
            </h2>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-white">Procedural 3D Skeleton Sequence</div>
              <div className="text-xs text-zinc-400 mt-0.5">
                Experience the real-time Three.js cinematic skull assembly and dynamic lighting reveal.
              </div>
            </div>
            <button
              onClick={replayIntro}
              className="flex items-center gap-2 rounded-lg bg-red-600/90 hover:bg-red-600 px-4 py-2 text-xs font-semibold text-white transition shadow-sm shrink-0"
            >
              <Play className="h-3.5 w-3.5 fill-white" />
              <span>Replay 3D Intro</span>
            </button>
          </div>
        </div>

        {/* TMDB Attribution & Compliance */}
        <div className="rounded-xl border border-zinc-800/80 bg-[#121215] p-5 text-xs text-zinc-400">
          <div className="flex items-center gap-2 font-bold text-white uppercase tracking-wider mb-2">
            <Film className="h-4 w-4 text-red-500" />
            <span>TMDB Compliance &amp; Attribution</span>
          </div>
          <p className="leading-relaxed">
            This product uses the TMDB API but is not endorsed or certified by TMDB. Film and television metadata, original titles, backdrops, posters, ratings, and video references are sourced via The Movie Database. Watch provider availability data is supplied by JustWatch via TMDB.
          </p>
        </div>
      </div>
    </div>
  );
};
