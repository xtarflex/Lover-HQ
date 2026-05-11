import React, { useState } from 'react';
import { useAppContext, useAppDispatch } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';
import Avatar from '../../components/Avatar';

/**
 * Onboarding component for new users.
 * Handles profile setup and pairing code generation/entry.
 */
export default function Onboarding() {
  const { user } = useAppContext();
  const dispatch = useAppDispatch();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🦊');
  const [pairingCode, setPairingCode] = useState('');
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
        .update({ name: name.trim(), avatar_url: selectedEmoji })
        .eq('id', user.id);

      if (updateError) throw updateError;

      dispatch({
        type: 'SET_USER',
        payload: { ...user, name: name.trim(), avatar_url: selectedEmoji },
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

      const { error: updateError } = await supabase
        .from('users')
        .update({ pairing_code: code })
        .eq('id', user.id);

      if (updateError) throw updateError;

      dispatch({ type: 'SET_USER', payload: { ...user, pairing_code: code } });
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
      // Find the partner with this code
      const { data: partner, error: findError } = await supabase
        .from('users')
        .select('*')
        .eq('pairing_code', pairingCode)
        .single();

      if (findError || !partner) {
        throw new Error('Invalid pairing code. Please check and try again.');
      }

      if (partner.id === user.id) {
        throw new Error("You can't pair with yourself!");
      }

      // Link both users
      const { error: linkError } = await supabase
        .from('users')
        .update({ partner_id: partner.id, pairing_code: null })
        .eq('id', user.id);

      if (linkError) throw linkError;

      const { error: partnerLinkError } = await supabase
        .from('users')
        .update({ partner_id: user.id, pairing_code: null })
        .eq('id', partner.id);

      if (partnerLinkError) throw partnerLinkError;

      dispatch({ type: 'SET_PARTNER', payload: partner });
      dispatch({ type: 'SET_PAIRING_STATUS', payload: 'paired' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-2xl shadow-xl border border-gray-100">
      {step === 1 ? (
        <form onSubmit={handleProfileSubmit} className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-heading font-bold text-gray-800">Welcome Home</h1>
            <p className="text-gray-500 mt-2">Let&apos;s set up your profile first</p>
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
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 ml-1">Your Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="What should they call you?"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
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
            <h1 className="text-3xl font-heading font-bold text-gray-800">Find Your Partner</h1>
            <p className="text-gray-500 mt-2">Lover-HQ is best enjoyed by two</p>
          </div>

          <div className="space-y-4">
            <div className="p-6 bg-brand-slate/5 rounded-2xl border border-dashed border-gray-300 flex flex-col items-center">
              <h2 className="font-bold text-gray-700">Invite them</h2>
              <p className="text-xs text-gray-500 mb-4">Generate a code to share</p>

              {user.pairing_code ? (
                <div className="text-center">
                  <div className="text-4xl font-mono font-bold tracking-[0.5em] text-primary bg-white px-6 py-3 rounded-xl shadow-inner border border-gray-100">
                    {user.pairing_code}
                  </div>
                  <p className="text-xs text-primary mt-4 animate-pulse">
                    Waiting for them to join...
                  </p>
                </div>
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
                <span className="w-full border-t border-gray-200"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-400">Or</span>
              </div>
            </div>

            <form onSubmit={handleEnterCode} className="space-y-4">
              <div className="text-center">
                <h2 className="font-bold text-gray-700">Enter their code</h2>
                <p className="text-xs text-gray-500 mb-4">If they already have one</p>
              </div>

              <input
                type="text"
                maxLength="6"
                value={pairingCode}
                onChange={(e) => setPairingCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full text-center text-2xl font-mono tracking-widest px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              />

              {error && (
                <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">{error}</p>
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
  );
}
