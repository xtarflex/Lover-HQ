/**
 * @file AccountPanel.jsx
 * @description Settings panel for account details: display name, avatar,
 * phone number, birthday, email, and privacy toggles.
 */

import React from 'react';
import { ShieldAlert, Check, Pencil } from 'lucide-react';
import Avatar from '../../../components/Avatar';
import { LoadingSpinner } from '../../../components/LoadingSpinner';

/**
 * @param {{
 *   name: string,
 *   setName: Function,
 *   avatarUrl: string,
 *   phone: string,
 *   setPhone: Function,
 *   birthday: string,
 *   setBirthday: Function,
 *   user: Object,
 *   saving: boolean,
 *   onSubmit: Function,
 *   onOpenAvatarPicker: Function,
 * }} props
 * @returns {React.ReactElement}
 */
export default function AccountPanel({
  name,
  setName,
  avatarUrl,
  phone,
  setPhone,
  birthday,
  setBirthday,
  user,
  saving,
  onSubmit,
  onOpenAvatarPicker,
}) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h3 className="text-lg font-bold text-text-main">Account Details</h3>
        <p className="text-xs text-text-muted mt-1">
          Configure user credentials, handle authentication endpoints.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="flex flex-col items-center justify-center space-y-3 py-2">
          <div className="relative cursor-pointer group" onClick={onOpenAvatarPicker}>
            <Avatar src={avatarUrl} fallback="👤" isOnline={true} size="xl" />
            <div className="absolute bottom-0 right-0 w-8 h-8 bg-primary hover:bg-primary-hover rounded-full flex items-center justify-center shadow-lg border-2 border-background z-20 transition-transform active:scale-90 group-hover:scale-105">
              <Pencil className="w-4 h-4 text-white" />
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenAvatarPicker}
            className="text-xs text-primary font-bold hover:underline"
          >
            Change Avatar Profile
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="displayName"
              className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2"
            >
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-surface/50 border border-surface-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm text-text-main"
              placeholder="e.g. Sunny"
            />
          </div>
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              disabled
              value={user?.email || 'N/A'}
              className="w-full px-4 py-3 bg-surface-border/20 border border-surface-border rounded-xl text-sm text-text-muted cursor-not-allowed"
            />
          </div>
          <div>
            <label
              htmlFor="phone"
              className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2"
            >
              Phone Number
            </label>
            <input
              id="phone"
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 bg-surface/50 border border-surface-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm text-text-main"
              placeholder="e.g. +1 555 123 4567"
            />
          </div>
          <div>
            <label
              htmlFor="birthday"
              className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2"
            >
              Birthday
            </label>
            <input
              id="birthday"
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              className="w-full px-4 py-3 bg-surface/50 border border-surface-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm text-text-main"
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end border-b border-surface-border pb-6">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-primary hover:bg-primary-hover disabled:bg-primary/50 text-white font-bold rounded-xl text-sm transition-all shadow-lg flex items-center gap-2"
          >
            {saving ? (
              <LoadingSpinner size="xs" className="text-white" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            Save Profile
          </button>
        </div>
      </form>

      {/* Privacy Placeholder */}
      <div className="space-y-4 pt-2">
        <h4 className="text-sm font-bold text-text-main flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-text-muted" />
          Privacy Settings
        </h4>
        <div className="flex items-center justify-between p-4 bg-surface/50 rounded-2xl border border-surface-border">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-text-main">Hide Profile Status</span>
            <span className="text-xs text-text-muted mt-0.5">
              Don&apos;t show when I am online.
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={false}
            aria-label="Toggle Hide Profile Status"
            className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none bg-surface-border"
          >
            <span className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out translate-x-0" />
          </button>
        </div>
      </div>
    </div>
  );
}
