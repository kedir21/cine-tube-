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
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-neutral-700 bg-[#161616] p-6 shadow-2xl text-neutral-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600/20 text-red-500 border border-red-500/30">
              <Key className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">TMDB API Configuration</h2>
              <p className="text-xs text-neutral-400">The Movie Database Connection</p>
            </div>
          </div>
          <button
            onClick={closeApiModal}
            className="rounded-full p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status card */}
        <div className="mt-4 rounded-xl border border-neutral-800 bg-neutral-900/80 p-3.5">
          <div className="flex items-start gap-3">
            {apiStatus?.configured ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div className="text-xs">
              <div className="font-semibold text-white">
                {apiStatus?.configured ? 'Connected to TMDB API' : 'Snapshot Demo Mode Active'}
              </div>
              <div className="mt-1 text-neutral-400 leading-relaxed">
                {apiStatus?.configured
                  ? `Authenticated via server-side ${apiStatus.authType === 'bearer' ? 'v4 Read Access Token' : 'v3 API Key'} (${apiStatus.source === 'env' ? 'Environment Variable' : 'Active Session'}). Millions of movies and TV titles are live!`
                  : 'Currently showing curated real TMDB catalog data, actual studio logos, and working YouTube trailers. To query TMDB’s entire database live, provide your TMDB token below.'}
              </div>
            </div>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Enter TMDB Read Access Token (or API Key)
            </label>
            <input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiJ9..."
              className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600 font-mono"
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
              className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 hover:underline"
            >
              <span>Get free TMDB API token</span>
              <ExternalLink className="h-3 w-3" />
            </a>

            <button
              type="submit"
              disabled={isSubmitting || !tokenInput.trim()}
              className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
              <span>Save &amp; Connect</span>
            </button>
          </div>
        </form>

        {/* Permanent Environment Variable Setup Instructions */}
        <div className="mt-5 border-t border-neutral-800 pt-3.5 text-xs text-neutral-400">
          <div className="flex items-center gap-1.5 font-semibold text-neutral-300">
            <ShieldCheck className="h-4 w-4 text-neutral-400" />
            <span>Permanent Server Configuration</span>
          </div>
          <p className="mt-1 leading-relaxed text-[11px]">
            To persist across server restarts, add to your <code className="text-red-400 bg-neutral-900 px-1 py-0.5 rounded">.env</code> file:
          </p>
          <pre className="mt-2 rounded-lg bg-black/60 p-2.5 text-[11px] font-mono text-neutral-300 border border-neutral-800 overflow-x-auto">
            TMDB_API_READ_ACCESS_TOKEN=&quot;your_token_here&quot;
          </pre>
        </div>
      </div>
    </div>
  );
};
