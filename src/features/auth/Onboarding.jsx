import React, { useState } from 'react';
import { useAppContext, useAppDispatch } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';
import Avatar from '../../components/Avatar';
import { LoverHQLogo } from '../../assets/Logo';
import { Link as LinkIcon } from 'lucide-react';

/**
 * Onboarding component for new users.
 * Handles profile setup and pairing code generation/entry.
 */
export default function Onboarding() {
  const { user } = useAppContext();
  const dispatch = useAppDispatch();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🦊');
  const [pairingCode, setPairingCode] = useState(
    () => sessionStorage.getItem('lover_hq_pairing_code') || ''
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const emojis = ['🦊', '🐰', '🐼', '🐨', '🐯', '🦁', '🐸', '🐧', '🐱', '🐶'];

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          name: name.trim(),
          avatar_url: selectedEmoji,
          phone_number: phoneNumber.trim() || null,
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      dispatch({
        type: 'SET_USER',
        payload: {
          ...user,
          name: name.trim(),
          avatar_url: selectedEmoji,
          phone_number: phoneNumber.trim() || null,
        },
      });

      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCode = async () => {
    setLoading(true);
    setError(null);

    try {
      // Generate random 6-digit code securely
      const array = new Uint32Array(1);
      window.crypto.getRandomValues(array);
      const code = Math.floor(100000 + (array[0] / 4294967296) * 900000).toString();

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const { error: updateError } = await supabase
        .from('users')
        .update({
          pairing_code: code,
          pairing_code_expires_at: expiresAt.toISOString(),
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      dispatch({
        type: 'SET_USER',
        payload: { ...user, pairing_code: code, pairing_code_expires_at: expiresAt.toISOString() },
      });
      dispatch({ type: 'SET_PAIRING_STATUS', payload: 'pending' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEnterCode = async (e) => {
    e.preventDefault();
    if (pairingCode.length !== 6) return;

    setLoading(true);
    setError(null);

    try {
      // Find the partner with this code and check expiration
      const { data: partner, error: findError } = await supabase
        .from('users')
        .select('*')
        .eq('pairing_code', pairingCode)
        .gt('pairing_code_expires_at', new Date().toISOString())
        .single();

      if (findError || !partner) {
        throw new Error('Invalid or expired pairing code. Please check and try again.');
      }

      if (partner.id === user.id) {
        throw new Error("You can't pair with yourself!");
      }

      // Link both users
      const { error: linkError } = await supabase
        .from('users')
        .update({ partner_id: partner.id, pairing_code: null, pairing_code_expires_at: null })
        .eq('id', user.id);

      if (linkError) throw linkError;

      const { error: partnerLinkError } = await supabase
        .from('users')
        .update({ partner_id: user.id, pairing_code: null, pairing_code_expires_at: null })
        .eq('id', partner.id);

      if (partnerLinkError) throw partnerLinkError;

      // Clear session storage code
      sessionStorage.removeItem('lover_hq_pairing_code');

      dispatch({ type: 'SET_PARTNER', payload: partner });
      dispatch({ type: 'SET_PAIRING_STATUS', payload: 'paired' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleShareLink = async () => {
    if (!user.pairing_code) return;

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
          alert('Link copied to clipboard!');
        }
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    }
  };

  const isExpired = user.pairing_code_expires_at
    ? new Date(user.pairing_code_expires_at) < new Date()
    : false;

  return (
    <div className="fixed inset-0 w-full h-[100dvh] bg-pink-50 dark:bg-brand-slate overflow-hidden flex flex-col">
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 pb-12 pt-8 relative flex flex-col items-center justify-center">
        <div className="max-w-md w-full p-6 bg-white/60 dark:bg-brand-surface/40 backdrop-blur-2xl rounded-3xl border-2 border-pink-100 dark:border-white/5 relative z-10">
          {step === 1 ? (
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div className="text-center">
                <LoverHQLogo className="text-primary w-12 h-12 mx-auto mb-4" />
                <h1 className="text-3xl font-heading font-bold text-slate-800 dark:text-white">
                  Welcome Home
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-2">
                  Let&apos;s set up your profile first
                </p>
              </div>

              <div className="flex flex-col items-center space-y-4">
                <Avatar fallback={selectedEmoji} size="xl" />
                <div className="grid grid-cols-5 gap-2">
                  {emojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setSelectedEmoji(emoji)}
                      className={`text-2xl p-2 rounded-lg transition-all ${
                        selectedEmoji === emoji
                          ? 'bg-primary/20 scale-110 shadow-sm'
                          : 'hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200 ml-1">
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="What should they call you?"
                  className="w-full px-5 py-4 bg-white dark:bg-brand-slate/50 border-2 border-pink-200 dark:border-slate-700 placeholder-slate-400 dark:placeholder-slate-500 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/30 focus:border-primary transition-all duration-300 text-base"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200 ml-1">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-5 py-4 bg-white dark:bg-brand-slate/50 border-2 border-pink-200 dark:border-slate-700 placeholder-slate-400 dark:placeholder-slate-500 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/30 focus:border-primary transition-all duration-300 text-base"
                />
              </div>

              {error && (
                <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/30 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Next Step'}
              </button>
            </form>
          ) : (
            <div className="space-y-8">
              <div className="text-center">
                <LoverHQLogo className="text-primary w-12 h-12 mx-auto mb-4" />
                <h1 className="text-3xl font-heading font-bold text-slate-800 dark:text-white">
                  Find Your Partner
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-2">
                  Lover-HQ is best enjoyed by two
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-6 bg-white/40 dark:bg-brand-surface/40 backdrop-blur-2xl rounded-2xl border-2 border-pink-100 dark:border-white/5 flex flex-col items-center">
                  <h2 className="font-bold text-slate-700 dark:text-slate-200">Invite them</h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
                    Generate a code to share
                  </p>

                  {user.pairing_code ? (
                    isExpired ? (
                      <div className="text-center w-full">
                        <p className="text-sm text-red-500 mb-4 font-bold">Code Expired</p>
                        <button
                          onClick={handleGenerateCode}
                          disabled={loading}
                          className="bg-white border-2 border-primary text-primary font-bold py-2 px-6 rounded-xl hover:bg-primary/5 transition-all disabled:opacity-50 w-full"
                        >
                          {loading ? 'Creating...' : 'Generate New Code'}
                        </button>
                      </div>
                    ) : (
                      <div className="text-center w-full flex flex-col items-center">
                        <div className="text-4xl font-mono font-bold tracking-[0.5em] text-primary bg-white/80 dark:bg-brand-slate/80 px-6 py-3 rounded-xl border-2 border-pink-100 dark:border-slate-700 shadow-inner">
                          {user.pairing_code}
                        </div>
                        <button
                          onClick={handleShareLink}
                          className="mt-4 bg-primary text-white font-bold py-2 px-6 rounded-xl shadow-md hover:brightness-110 active:scale-[0.98] transition-all w-full flex items-center justify-center gap-2"
                        >
                          <span>Share Link</span>
                          <LinkIcon size={18} />
                        </button>
                        <p className="text-xs text-primary mt-4 animate-pulse">
                          Waiting for them to join... (Expires in 24h)
                        </p>
                      </div>
                    )
                  ) : (
                    <button
                      onClick={handleGenerateCode}
                      disabled={loading}
                      className="bg-white border-2 border-primary text-primary font-bold py-2 px-6 rounded-xl hover:bg-primary/5 transition-all disabled:opacity-50"
                    >
                      {loading ? 'Creating...' : 'Generate Code'}
                    </button>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-pink-200 dark:border-slate-700"></span>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-transparent px-2 text-slate-500 dark:text-slate-500 bg-white/60 dark:bg-brand-surface/40 backdrop-blur-2xl">
                      Or
                    </span>
                  </div>
                </div>

                <form onSubmit={handleEnterCode} className="space-y-4">
                  <div className="text-center">
                    <h2 className="font-bold text-slate-700 dark:text-slate-200">
                      Enter their code
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
                      If they already have one
                    </p>
                  </div>

                  <input
                    type="text"
                    maxLength="6"
                    value={pairingCode}
                    onChange={(e) => setPairingCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full text-center text-2xl font-mono tracking-widest px-5 py-4 bg-white dark:bg-brand-slate/50 border-2 border-pink-200 dark:border-slate-700 placeholder-slate-400 dark:placeholder-slate-500 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/30 focus:border-primary transition-all duration-300"
                  />

                  {error && (
                    <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading || pairingCode.length !== 6}
                    className="w-full bg-secondary text-white font-bold py-4 rounded-xl shadow-lg shadow-secondary/30 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {loading ? 'Pairing...' : 'Complete Pairing'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
