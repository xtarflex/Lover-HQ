/**
 * @file StepAvatar.jsx
 * @description Onboarding Step 4: Avatar selection from the SVG manifest grid.
 */

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import Avatar from '../../../components/Avatar';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import avatarManifest from '../../../assets/avatars_manifest.json';

/**
 * Renders the fourth onboarding step where the user selects their avatar
 * from a scrollable grid populated from the SVG avatar manifest.
 *
 * @param {{
 *   selectedAvatarId: string,
 *   setSelectedAvatarId: Function,
 *   loading: boolean,
 *   onBack: Function,
 *   onNext: Function,
 * }} props
 * @param {string} props.selectedAvatarId - URL of the currently selected avatar.
 * @param {Function} props.setSelectedAvatarId - Setter for the selected avatar URL.
 * @param {boolean} props.loading - Whether the submit request is in-flight.
 * @param {Function} props.onBack - Callback to go to the previous step.
 * @param {Function} props.onNext - Callback to submit the profile and advance.
 * @returns {React.ReactElement}
 */
export default function StepAvatar({
  selectedAvatarId,
  setSelectedAvatarId,
  loading,
  onBack,
  onNext,
}) {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <span className="text-primary font-semibold tracking-tighter text-sm uppercase">
          04 / 05
        </span>
        <h2 className="font-heading text-4xl md:text-5xl leading-tight font-bold text-text-main">
          How do you look?
        </h2>
        <p className="text-sm text-text-muted italic">
          Pick an avatar that represents how you&apos;d love to look.
        </p>
      </div>

      <div className="flex flex-col items-center space-y-6 py-4">
        <Avatar fallback={selectedAvatarId} size="xl" />
        <div className="w-full max-w-md max-h-64 overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-5 gap-3 p-1">
            {avatarManifest.map((opt) => (
              <button
                key={opt.url}
                type="button"
                onClick={() => setSelectedAvatarId(opt.url)}
                className={`aspect-square rounded-full transition-all flex items-center justify-center border-2 overflow-hidden bg-brand-surface ${
                  selectedAvatarId === opt.url
                    ? 'border-primary bg-primary/10 scale-110 shadow-md z-10'
                    : 'border-surface-border hover:border-text-muted hover:scale-105'
                }`}
              >
                <img
                  src={opt.url}
                  alt={opt.name}
                  className="w-full h-full object-cover rounded-full"
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <button
          type="button"
          onClick={onBack}
          className="p-4 rounded-full border border-surface-border hover:border-text-muted text-text-main transition-colors relative z-10 bg-background"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={loading}
          className="bg-text-main text-background hover-heart-scale flex-grow py-4 rounded-full text-sm font-bold uppercase tracking-widest transition-all disabled:opacity-50 group flex items-center justify-center"
        >
          <span className="relative z-10 flex items-center justify-center">
            {loading ? <LoadingSpinner size="xs" className="text-background" /> : 'Almost There'}
          </span>
        </button>
      </div>
    </div>
  );
}
