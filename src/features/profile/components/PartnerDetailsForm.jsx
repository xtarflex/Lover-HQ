/**
 * @file PartnerDetailsForm.jsx
 * @description Editable partner profile form for the Profile page.
 * Allows changing the partner's display name and avatar.
 */

import React from 'react';
import { User, Check, Pencil } from 'lucide-react';
import Avatar from '../../../components/Avatar';
import { LoadingSpinner } from '../../../components/LoadingSpinner';

/**
 * Form section for editing partner display name and avatar.
 *
 * @param {{
 *   name: string,
 *   setName: Function,
 *   avatarUrl: string,
 *   onOpenAvatarPicker: Function,
 *   presence: Object,
 *   saving: boolean,
 *   onSubmit: Function,
 * }} props
 * @returns {React.ReactElement}
 */
export default function PartnerDetailsForm({
  name,
  setName,
  avatarUrl,
  onOpenAvatarPicker,
  presence,
  saving,
  onSubmit,
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="bg-surface/60 dark:bg-slate-900/40 backdrop-blur-xl border border-surface-border dark:border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col justify-between space-y-6"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-text-main text-base">Their Details</h3>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 border border-primary/20 text-primary">
          <Pencil className="w-3.5 h-3.5" />
          Editable by you
        </span>
      </div>

      <div className="flex flex-col items-center justify-center space-y-3 py-2">
        <div
          className="relative cursor-pointer"
          onClick={onOpenAvatarPicker}
        >
          <Avatar
            src={avatarUrl}
            fallback="👤"
            isOnline={presence?.partner === 'online'}
            size="xl"
          />
          <div className="absolute bottom-0 right-0 w-8 h-8 bg-primary hover:bg-primary-hover rounded-full flex items-center justify-center shadow-lg border-2 border-background z-20 transition-transform active:scale-90">
            <Pencil className="w-4 h-4 text-white" />
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenAvatarPicker}
          className="text-xs text-primary font-bold hover:underline"
        >
          Change Partner Avatar
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
            Display Name
          </label>
          <div className="relative">
            <User className="absolute left-4 top-3.5 w-4 h-4 text-text-muted" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/5 dark:bg-slate-950/50 border border-surface-border dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary text-text-main transition-all font-semibold"
              placeholder="e.g. Partner Name"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 bg-primary hover:bg-primary-hover disabled:bg-primary/50 text-white rounded-xl font-bold shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
        >
          {saving ? (
            <LoadingSpinner size="sm" className="text-white" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          Save
        </button>
      </div>
    </form>
  );
}
