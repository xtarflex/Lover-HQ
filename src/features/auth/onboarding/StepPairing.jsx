/**
 * @file StepPairing.jsx
 * @description Onboarding Step 5: Partner pairing — generate/share invite code or enter partner code.
 */

import React from 'react';
import { Link as LinkIcon, Sparkles, Copy } from 'lucide-react';
import { LoadingSpinner } from '../../../components/LoadingSpinner';

/**
 * Renders the fifth onboarding step where the user can generate a pairing
 * code to invite their partner, enter their partner's code, or skip to solo mode.
 *
 * @param {{
 *   user: Object,
 *   pairingCode: string,
 *   setPairingCode: Function,
 *   loading: boolean,
 *   isExpired: boolean,
 *   onGenerateCode: Function,
 *   onEnterCode: Function,
 *   onShareLink: Function,
 *   onSkip: Function,
 *   onCopyCode: Function,
 * }} props
 * @param {Object} props.user - The current user object (may include pairing_code, pairing_code_expires_at).
 * @param {string} props.pairingCode - The code the user is typing to pair with their partner.
 * @param {Function} props.setPairingCode - Setter for the pairing code input.
 * @param {boolean} props.loading - Whether any async operation is in-flight.
 * @param {boolean} props.isExpired - Whether the user's own generated pairing code has expired.
 * @param {Function} props.onGenerateCode - Callback to generate a new pairing code.
 * @param {Function} props.onEnterCode - Callback to submit the entered partner code.
 * @param {Function} props.onShareLink - Callback to share the invite link via Web Share API or clipboard.
 * @param {Function} props.onSkip - Callback to skip pairing and proceed in solo mode.
 * @param {Function} props.onCopyCode - Callback invoked after copying the pairing code to clipboard.
 * @returns {React.ReactElement}
 */
export default function StepPairing({
  user,
  pairingCode,
  setPairingCode,
  loading,
  isExpired,
  onGenerateCode,
  onEnterCode,
  onShareLink,
  onSkip,
  onCopyCode,
}) {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <span className="text-primary font-semibold tracking-tighter text-sm uppercase">
          05 / 05
        </span>
        <h2 className="font-heading text-4xl md:text-5xl leading-tight font-bold text-text-main">
          Find Your Partner.
        </h2>
        <p className="text-sm text-text-muted italic">Lover-HQ is best enjoyed by two.</p>
      </div>

      <div className="space-y-6 pt-4">
        <div className="p-6 bg-surface/20 rounded-2xl border border-surface-border/50 flex flex-col items-center">
          <h3 className="font-bold text-text-main text-lg mb-1">Invite them</h3>
          <p className="text-xs text-text-muted mb-6">Generate a code to share</p>

          {user?.pairing_code ? (
            isExpired ? (
              <div className="text-center w-full">
                <p className="text-sm text-error-bg mb-4 font-bold">Code Expired</p>
                <button
                  onClick={onGenerateCode}
                  disabled={loading}
                  className="w-full bg-transparent border-2 border-primary text-primary font-bold py-3 px-6 rounded-full hover:bg-primary/5 transition-all disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? (
                    <LoadingSpinner size="xs" className="text-primary" />
                  ) : (
                    'Generate New Code'
                  )}
                </button>
              </div>
            ) : (
              <div className="text-center w-full flex flex-col items-center">
                <div className="text-4xl font-mono font-bold tracking-[0.5em] text-primary bg-surface/40 px-8 py-4 rounded-2xl shadow-inner mb-6 select-all">
                  {user.pairing_code}
                </div>
                <div className="flex gap-4 w-full">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(user.pairing_code);
                      if (onCopyCode) onCopyCode();
                    }}
                    className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-text-main text-sm font-bold rounded-full border border-white/5 transition-colors flex items-center justify-center gap-2 hover-heart-scale"
                  >
                    <span>Copy Code</span>
                    <Copy size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={onShareLink}
                    className="flex-grow bg-primary text-white font-bold py-3 px-6 rounded-full shadow-lg hover:shadow-xl hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 hover-heart-scale group"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <span>Share Link</span>
                      <LinkIcon size={18} />
                    </span>
                  </button>
                </div>
                <p className="text-xs text-primary mt-4 animate-pulse flex items-center gap-1">
                  <Sparkles size={12} />
                  Waiting for them to join...
                </p>
              </div>
            )
          ) : (
            <button
              onClick={onGenerateCode}
              disabled={loading}
              className="w-full bg-transparent border-2 border-primary text-primary font-bold py-3 px-6 rounded-full hover:bg-primary/5 transition-all disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <LoadingSpinner size="xs" className="text-primary" />
              ) : (
                'Generate Code'
              )}
            </button>
          )}
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-surface-border"></span>
          </div>
          <div className="relative flex justify-center text-xs uppercase font-bold tracking-widest">
            <span className="px-4 text-text-muted bg-background">Or</span>
          </div>
        </div>

        <form onSubmit={onEnterCode} className="space-y-6">
          <div className="text-center">
            <h3 className="font-bold text-text-main text-lg mb-1">Enter their code</h3>
          </div>

          <div className="border-b-2 border-surface-border focus-within:border-secondary transition-colors py-2">
            <input
              type="text"
              maxLength="6"
              value={pairingCode}
              onChange={(e) => setPairingCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full text-center text-3xl font-mono tracking-[0.5em] bg-transparent placeholder-text-muted/30 text-text-main focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading || pairingCode.length !== 6}
            className="w-full bg-secondary text-white hover-heart-scale font-bold py-4 rounded-full shadow-lg hover:shadow-xl hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 flex justify-center items-center group"
          >
            <span className="relative z-10 flex items-center justify-center">
              {loading ? (
                <LoadingSpinner size="xs" className="text-white" />
              ) : (
                'Complete Pairing'
              )}
            </span>
          </button>
        </form>

        {/* Solo Mode Skip Option */}
        <div className="text-center pt-4">
          <button
            type="button"
            onClick={onSkip}
            disabled={loading}
            className="text-xs font-bold uppercase tracking-widest text-text-muted hover:text-primary transition-colors py-2.5 px-4 rounded-xl hover:bg-white/5 flex items-center justify-center gap-2 mx-auto"
          >
            {loading && <LoadingSpinner size="sm" className="text-text-muted w-4 h-4" />}
            <span>{user?.pairing_code ? 'Go to Dashboard' : 'Explore in Solo Mode'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
