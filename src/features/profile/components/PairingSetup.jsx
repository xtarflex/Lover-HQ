/**
 * @file PairingSetup.jsx
 * @description Shown when the user has no partner. Allows generating/sharing
 * a pairing code, entering a partner's code, and managing reconnect requests.
 */

import React from 'react';
import { Sparkles, Copy } from 'lucide-react';
import Avatar from '../../../components/Avatar';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import ReconnectInvitesPanel from './ReconnectInvitesPanel';

/**
 * Full no-partner view: pairing code generation/entry and reconnect request management.
 *
 * @param {{
 *   user: Object,
 *   history: Array,
 *   incomingRequests: Array,
 *   outgoingRequests: Array,
 *   inputPairingCode: string,
 *   setInputPairingCode: Function,
 *   pairCodeLoading: boolean,
 *   onGenerateCode: Function,
 *   onEnterCode: Function,
 *   onSendReconnect: Function,
 *   onAcceptReconnect: Function,
 *   onDeclineReconnect: Function,
 *   onCancelRequest: Function,
 *   setMessage: Function,
 * }} props
 * @returns {React.ReactElement}
 */
export default function PairingSetup({
  user,
  history,
  incomingRequests,
  outgoingRequests,
  inputPairingCode,
  setInputPairingCode,
  pairCodeLoading,
  onGenerateCode,
  onEnterCode,
  onSendReconnect,
  onAcceptReconnect,
  onDeclineReconnect,
  onCancelRequest,
  setMessage,
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-slide-up w-full">
      {/* Left Column: Code Exchange */}
      <div className="md:col-span-6 space-y-6">
        {/* Generate Code Box */}
        <div className="bg-surface/60 dark:bg-slate-900/40 backdrop-blur-xl border border-surface-border dark:border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col justify-between space-y-4">
          <h3 className="font-bold text-text-main text-base">Invite Your Partner</h3>
          <p className="text-xs text-text-muted leading-relaxed">
            Generate a temporary connection code to send to your partner. It expires in 24
            hours.
          </p>

          {user?.pairing_code ? (
            <div className="text-center w-full flex flex-col items-center pt-2 space-y-3">
              <div className="text-3xl font-mono font-bold tracking-[0.3em] text-primary bg-white/5 border border-surface-border/50 px-6 py-3 rounded-2xl shadow-inner w-full select-all">
                {user.pairing_code}
              </div>
              <div className="flex gap-2 w-full">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(user.pairing_code);
                    setMessage({ type: 'success', text: 'Pairing code copied!' });
                  }}
                  className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-text-main text-xs font-bold rounded-xl border border-white/5 transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Copy Code</span>
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const shareUrl = window.location.origin + '/auth?pair=' + user.pairing_code;
                    if (navigator.share) {
                      try {
                        await navigator.share({
                          title: 'Join me on Lover-HQ',
                          text: 'Use my code to pair our accounts!',
                          url: shareUrl,
                        });
                      } catch (err) {
                        if (err.name !== 'AbortError') {
                          navigator.clipboard.writeText(shareUrl);
                          setMessage({ type: 'success', text: 'Share link copied!' });
                        }
                      }
                    } else {
                      navigator.clipboard.writeText(shareUrl);
                      setMessage({ type: 'success', text: 'Share link copied!' });
                    }
                  }}
                  className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl transition-all"
                >
                  Share Link
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={onGenerateCode}
              disabled={pairCodeLoading}
              className="w-full py-3 bg-primary hover:bg-primary-hover disabled:bg-primary/50 text-white rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2"
            >
              {pairCodeLoading ? (
                <LoadingSpinner size="xs" className="text-white" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Generate Pairing Code
            </button>
          )}
        </div>

        {/* Enter Code Box */}
        <div className="bg-surface/60 dark:bg-slate-900/40 backdrop-blur-xl border border-surface-border dark:border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col justify-between space-y-4">
          <h3 className="font-bold text-text-main text-base">Enter Their Code</h3>
          <p className="text-xs text-text-muted leading-relaxed">
            Have an invitation code from your partner? Enter it here to complete the pairing.
          </p>

          <form onSubmit={onEnterCode} className="space-y-4">
            <input
              type="text"
              maxLength="6"
              required
              value={inputPairingCode}
              onChange={(e) => setInputPairingCode(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-3 bg-white/5 border border-surface-border dark:border-slate-800 rounded-xl text-center text-xl font-mono font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-primary text-text-main transition-all"
              placeholder="000000"
            />
            <button
              type="submit"
              disabled={pairCodeLoading || inputPairingCode.length !== 6}
              className="w-full py-3 bg-secondary hover:bg-secondary/90 disabled:opacity-50 text-white rounded-xl font-bold shadow-lg transition-all flex items-center justify-center"
            >
              {pairCodeLoading ? (
                <LoadingSpinner size="xs" className="text-white" />
              ) : (
                'Connect'
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Right Column: History & Requests */}
      <div className="md:col-span-6 space-y-6">
        <ReconnectInvitesPanel
          incomingRequests={incomingRequests}
          outgoingRequests={outgoingRequests}
          onAccept={onAcceptReconnect}
          onDecline={onDeclineReconnect}
          onCancel={onCancelRequest}
        />

        {/* Previous Connections History */}
        <div className="bg-surface/60 dark:bg-slate-900/40 backdrop-blur-xl border border-surface-border dark:border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
          <h3 className="font-bold text-text-main text-base">Previous Connections</h3>
          {history.length > 0 ? (
            <div className="space-y-3">
              {history.map((prev) => {
                const isRequested = outgoingRequests.some((req) => req.receiver_id === prev.id);
                return (
                  <div
                    key={prev.id}
                    className="flex items-center justify-between bg-white/5 border border-surface-border/50 p-3 rounded-2xl"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar src={prev.avatar_url} size="sm" fallback="👤" />
                      <span className="text-sm font-semibold text-text-main">{prev.name}</span>
                    </div>
                    <button
                      disabled={isRequested}
                      onClick={() => onSendReconnect(prev.id)}
                      className={`text-xs font-bold px-4 py-2 rounded-xl transition-all ${
                        isRequested
                          ? 'bg-white/5 text-text-muted cursor-not-allowed border border-white/5'
                          : 'bg-primary hover:bg-primary-hover text-white shadow-md'
                      }`}
                    >
                      {isRequested ? 'Requested' : 'Reconnect'}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-text-muted italic leading-relaxed py-2">
              No previous pairings recorded. Connect with a code above to start your history!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
