/**
 * @file Onboarding.jsx
 * @description Orchestrates the multi-step onboarding flow: name → phone → birthday → avatar → pairing.
 * All state, effects, and async handlers live here; pure UI is delegated to step components.
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAppDispatch, useAppContext } from '../../contexts/AppContext';
import { LoverHQLogo } from '../../assets/Logo';
import { motion, AnimatePresence } from 'framer-motion';

import { COUNTRIES, getFlagEmoji, formatLocalNumber, parsePhoneNumber } from '../../utils/phone';
import FloatingHearts from './components/FloatingHearts';
import { Notification } from '../../components/Notification';
import StepName from './onboarding/StepName';
import StepPhone from './onboarding/StepPhone';
import StepBirthday from './onboarding/StepBirthday';
import StepAvatar from './onboarding/StepAvatar';
import StepPairing from './onboarding/StepPairing';

/** @type {import('framer-motion').Variants} */
const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 20 : -20,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction) => ({
    x: direction > 0 ? -20 : 20,
    opacity: 0,
  }),
};

const slideTransition = {
  duration: 0.5,
  ease: [0.4, 0, 0.2, 1],
};

/**
 * Onboarding component for user profile initialisation and partner pairing.
 * Allows users to set their name, phone number, birthday, avatar, and pair with their partner.
 *
 * @returns {React.ReactElement} The rendered Onboarding component.
 */
export default function Onboarding() {
  const { user } = useAppContext();
  const dispatch = useAppDispatch();

  const [[step, direction], setStepState] = useState(() => {
    const savedStep = sessionStorage.getItem('lover_hq_onboarding_step');
    return savedStep ? [parseInt(savedStep, 10), 0] : [1, 0];
  });

  /**
   * Updates the onboarding step state and persists the next step to sessionStorage.
   *
   * @param {[number, number]} val - An array where the first element is the next step number,
   *                                and the second element is the direction animation value.
   */
  const setStep = (val) => {
    setStepState(val);
    const nextStep = Array.isArray(val) ? val[0] : val;
    sessionStorage.setItem('lover_hq_onboarding_step', nextStep);
  };
  const [name, setName] = useState(user?.name || '');
  const [countriesList, setCountriesList] = useState(COUNTRIES);
  const [selectedCountry, setSelectedCountry] = useState(() => {
    if (user?.phone_number) {
      return parsePhoneNumber(user.phone_number, COUNTRIES).country;
    }
    return COUNTRIES[0];
  });
  const [localNumber, setLocalNumber] = useState(() => {
    if (user?.phone_number) {
      return parsePhoneNumber(user.phone_number, COUNTRIES).local;
    }
    return '';
  });
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [birthday, setBirthday] = useState(user?.birthday || '');
  const defaultAvatar = '/avatars/509010-avatar-thinking.svg';
  const [selectedAvatarId, setSelectedAvatarId] = useState(() =>
    user?.avatar_url && user.avatar_url.includes('/') ? user.avatar_url : defaultAvatar
  );
  const [pairingCode, setPairingCode] = useState(
    () => sessionStorage.getItem('lover_hq_pairing_code') || ''
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Auto-clear error after 5 s
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Detect country from IP on mount when no phone is already stored
  useEffect(() => {
    if (!user?.phone_number) {
      fetch('https://ipapi.co/json/')
        .then((res) => {
          if (!res.ok) throw new Error('Failed to fetch country info');
          return res.json();
        })
        .then((data) => {
          if (data && data.country_calling_code) {
            const callingCode = data.country_calling_code.startsWith('+')
              ? data.country_calling_code
              : `+${data.country_calling_code}`;
            const matched = COUNTRIES.find((c) => c.code === callingCode);
            if (matched) {
              setSelectedCountry(matched);
            } else {
              const newCountry = {
                code: callingCode,
                flag: getFlagEmoji(data.country_code) || '🌍',
                name: data.country_name || 'Detected Country',
              };
              setCountriesList((prev) => {
                if (prev.some((c) => c.code === callingCode)) return prev;
                return [newCountry, ...prev];
              });
              setSelectedCountry(newCountry);
            }
          }
        })
        .catch((err) => {
          console.warn('Geolocation failed, falling back to default:', err);
        });
    }
  }, [user]);

  // Auto-skip to Step 5 if profile details are already set or onboarding is completed.
  // We check if avatar_url has been set to something other than the default 'cat' placeholder.
  useEffect(() => {
    const isProfileInitialized = user?.avatar_url && user.avatar_url !== 'cat';
    if ((user?.onboarding_completed || isProfileInitialized) && step < 5) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStep([5, 1]);
    }
  }, [user, step]);

  // Sync avatar selection when user object loads
  useEffect(() => {
    if (user?.avatar_url && user.avatar_url.includes('/')) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedAvatarId(user.avatar_url);
    }
  }, [user?.avatar_url]);

  /** Signs the user out of Supabase. */
  const handleSignOut = async () => {
    sessionStorage.removeItem('lover_hq_onboarding_step');
    await supabase.auth.signOut();
  };

  /**
   * Handles selecting a country from the dropdown.
   * @param {Object} country - The selected country object.
   */
  const handleSelectCountry = (country) => {
    setSelectedCountry(country);
    setShowCountryDropdown(false);
  };

  /**
   * Handles changes to the local phone number input, applying formatting.
   * @param {React.ChangeEvent<HTMLInputElement>} e - The input change event.
   */
  const handleLocalNumberChange = (e) => {
    setLocalNumber(formatLocalNumber(e.target.value));
  };

  /**
   * Persists name, phone, birthday, and avatar to Supabase then advances to Step 5.
   * @param {React.FormEvent} [e]
   */
  const handleProfileSubmit = async (e) => {
    e?.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);

    const trimmedLocal = localNumber.trim();
    const finalPhone = trimmedLocal ? `${selectedCountry.code} ${trimmedLocal}` : null;

    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          name: name.trim(),
          avatar_url: selectedAvatarId,
          phone_number: finalPhone,
          birthday: birthday || null,
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      dispatch({
        type: 'SET_USER',
        payload: {
          ...user,
          name: name.trim(),
          avatar_url: selectedAvatarId,
          phone_number: finalPhone,
          birthday: birthday || null,
        },
      });

      setStep([5, 1]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Generates a cryptographically-random 6-digit pairing code and stores it in Supabase.
   */
  const handleGenerateCode = async () => {
    setLoading(true);
    setError(null);

    try {
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

  /**
   * Submits the entered partner pairing code and links the two accounts.
   * @param {React.FormEvent} [e]
   */
  const handleEnterCode = async (e) => {
    e?.preventDefault();
    if (pairingCode.length !== 6) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Query the partner user securely via the get_user_by_pairing_code RPC
      const { data: partners, error: findError } = await supabase.rpc('get_user_by_pairing_code', {
        input_code: pairingCode,
      });

      const partner = partners?.[0];

      if (findError || !partner) {
        throw new Error('Invalid or expired pairing code. Please check and try again.');
      }

      if (partner.id === user.id) {
        throw new Error("You can't pair with yourself!");
      }

      // 2. Update current user's profile to link partner.
      // This fires the SECURITY DEFINER trigger "on_partner_id_updated" which
      // atomically links the partner's record back and consumes their pairing code.
      const { error: linkError } = await supabase
        .from('users')
        .update({
          partner_id: partner.id,
          pairing_code: null,
          pairing_code_expires_at: null,
          onboarding_completed: true,
        })
        .eq('id', user.id);

      if (linkError) throw linkError;

      sessionStorage.removeItem('lover_hq_pairing_code');
      sessionStorage.removeItem('lover_hq_onboarding_step');
      dispatch({
        type: 'SET_USER',
        payload: {
          ...user,
          partner_id: partner.id,
          onboarding_completed: true,
          pairing_code: null,
          pairing_code_expires_at: null,
        },
      });
      dispatch({ type: 'SET_PARTNER', payload: partner });
      dispatch({ type: 'SET_PAIRING_STATUS', payload: 'paired' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Marks onboarding as completed without pairing (solo mode).
   */
  const handleSkipPairing = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({ onboarding_completed: true })
        .eq('id', user.id);

      if (updateError) throw updateError;

      sessionStorage.removeItem('lover_hq_onboarding_step');
      dispatch({
        type: 'SET_USER',
        payload: { ...user, onboarding_completed: true },
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Shares the pairing invite link via the Web Share API, falling back to clipboard.
   */
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

  const isExpired = user?.pairing_code_expires_at
    ? new Date(user.pairing_code_expires_at) < new Date()
    : false;

  return (
    <div className="fixed inset-0 w-full h-[100dvh] bg-background text-text-main flex flex-col overflow-hidden">
      {/* Animated Background Elements */}
      <FloatingHearts />

      <header className="p-6 flex justify-between items-center relative z-20">
        <div className="flex items-center space-x-2">
          <LoverHQLogo className="w-6 h-6 text-primary" />
          <span className="font-heading font-bold text-xl tracking-widest uppercase text-text-main">
            Lover-HQ
          </span>
        </div>

        <div className="flex items-center space-x-4 md:space-x-6">
          <button
            onClick={handleSignOut}
            className="text-xs font-semibold uppercase tracking-widest text-text-muted hover:text-text-main transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Progress Track */}
      <div className="w-full h-1 bg-surface-border relative z-20">
        <div
          className="h-full bg-primary transition-all duration-700 ease-in-out"
          style={{ width: `${(step / 5) * 100}%` }}
        ></div>
      </div>

      <main className="flex-grow flex items-center justify-center px-6 md:px-8 relative z-10 overflow-y-auto custom-scrollbar">
        <div className="w-full max-w-md relative z-10 min-h-[480px] flex items-center">
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={slideTransition}
              className="w-full py-4"
            >
              {step === 1 && (
                <StepName name={name} setName={setName} onNext={() => setStep([2, 1])} />
              )}

              {step === 2 && (
                <StepPhone
                  countriesList={countriesList}
                  selectedCountry={selectedCountry}
                  localNumber={localNumber}
                  showCountryDropdown={showCountryDropdown}
                  onSelectCountry={handleSelectCountry}
                  onToggleDropdown={() => setShowCountryDropdown(!showCountryDropdown)}
                  onLocalNumberChange={handleLocalNumberChange}
                  onBack={() => setStep([1, -1])}
                  onNext={() => setStep([3, 1])}
                />
              )}

              {step === 3 && (
                <StepBirthday
                  birthday={birthday}
                  setBirthday={setBirthday}
                  onBack={() => setStep([2, -1])}
                  onNext={() => setStep([4, 1])}
                />
              )}

              {step === 4 && (
                <StepAvatar
                  selectedAvatarId={selectedAvatarId}
                  setSelectedAvatarId={setSelectedAvatarId}
                  loading={loading}
                  onBack={() => setStep([3, -1])}
                  onNext={handleProfileSubmit}
                />
              )}

              {step === 5 && (
                <StepPairing
                  user={user}
                  pairingCode={pairingCode}
                  setPairingCode={setPairingCode}
                  loading={loading}
                  isExpired={isExpired}
                  onGenerateCode={handleGenerateCode}
                  onEnterCode={handleEnterCode}
                  onShareLink={handleShareLink}
                  onSkip={handleSkipPairing}
                  onCopyCode={() => setError({ text: 'Pairing code copied!', type: 'success' })}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <Notification
        message={typeof error === 'object' && error !== null ? error.text : error}
        type={typeof error === 'object' && error !== null ? error.type : 'error'}
        onClose={() => setError(null)}
      />
    </div>
  );
}
