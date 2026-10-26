import React, { useState } from 'react';
import { X, Key, CheckCircle2, AlertCircle, ExternalLink, ShieldCheck, RefreshCw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { tmdbApi } from '../../services/tmdbApi';

export const ApiSetupModal: React.FC = () => {
  const { isApiModalOpen, closeApiModal, apiStatus, refreshApiStatus } = useApp();
  const [tokenInput, setTokenInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isApiModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
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
          message: 'TMDB credentials configured successfully! Live API calls activated.',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={closeApiModal} />

      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-xl border border-zinc-800 bg-[#121215] p-6 shadow-2xl text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600/20 text-red-500 border border-red-500/30">
              <Key className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">TMDB API Configuration</h2>
              <p className="text-xs text-zinc-400">The Movie Database Connection</p>
            </div>
          </div>
          <button
            onClick={closeApiModal}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Status card */}
        <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3.5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <div className="font-semibold text-white">
                Live TMDB Catalog Active
              </div>
              <div className="mt-1 text-zinc-400 leading-relaxed">
                The application is directly connected to the TMDB API via bundled centralized configuration (<code className="text-zinc-300 font-mono text-[11px]">src/config/tmdb.ts</code>). No <code className="text-zinc-300 font-mono text-[11px]">.env</code> file is required.
              </div>
            </div>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Enter Custom TMDB Read Access Token (or API Key)
            </label>
            <input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiJ9..."
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

          <div className="flex items-center justify-between pt-1">
            <a
              href="https://www.themoviedb.org/settings/api"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white"
            >
              <span>Get personal TMDB token</span>
              <ExternalLink className="h-3 w-3" />
            </a>

            <button
              type="submit"
              disabled={isSubmitting || !tokenInput.trim()}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
              <span>Save &amp; Connect</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
