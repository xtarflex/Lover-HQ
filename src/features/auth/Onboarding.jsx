import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { useAppDispatch, useAppContext } from '../../contexts/AppContext';
import { LoverHQLogo } from '../../assets/Logo';
import { Link as LinkIcon, ChevronRight, ArrowLeft, Heart, Sparkles, Copy } from 'lucide-react';
import Avatar from '../../components/Avatar';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Notification } from '../../components/Notification';
import { motion, AnimatePresence } from 'framer-motion';
import avatarManifest from '../../assets/avatars_manifest.json';

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

const COUNTRIES = [
  { code: '+234', flag: '🇳🇬', name: 'Nigeria' },
  { code: '+254', flag: '🇰🇪', name: 'Kenya' },
  { code: '+27', flag: '🇿🇦', name: 'South Africa' },
  { code: '+233', flag: '🇬🇭', name: 'Ghana' },
  { code: '+20', flag: '🇪🇬', name: 'Egypt' },
  { code: '+250', flag: '🇷🇼', name: 'Rwanda' },
  { code: '+256', flag: '🇺🇬', name: 'Uganda' },
  { code: '+255', flag: '🇹🇿', name: 'Tanzania' },
  { code: '+212', flag: '🇲🇦', name: 'Morocco' },
  { code: '+216', flag: '🇹🇳', name: 'Tunisia' },
  { code: '+1', flag: '🇺🇸', name: 'United States' },
  { code: '+44', flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+33', flag: '🇫🇷', name: 'France' },
  { code: '+49', flag: '🇩🇪', name: 'Germany' },
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+81', flag: '🇯🇵', name: 'Japan' },
  { code: '+86', flag: '🇨🇳', name: 'China' },
  { code: '+55', flag: '🇧🇷', name: 'Brazil' },
  { code: '+52', flag: '🇲🇽', name: 'Mexico' },
  { code: '+61', flag: '🇦🇺', name: 'Australia' },
];

/**
 * Formats a local phone number string with spaces.
 * E.g., "8031234567" -> "803 123 4567"
 *
 * @param {string} input - The raw input digits.
 * @returns {string} The formatted local number.
 */
const formatLocalNumber = (input) => {
  const digits = input.replace(/\D/g, '');
  if (digits.length <= 3) {
    return digits;
  } else if (digits.length <= 6) {
    return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  } else {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)}`;
  }
};

/**
 * Helper to convert country code (e.g. 'US') to flag emoji.
 *
 * @param {string} countryCode - Two letter country code.
 * @returns {string} The country flag emoji.
 */
const getFlagEmoji = (countryCode) => {
  if (!countryCode) return '🌍';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

/**
 * Parses a full phone number into its country code object and local number.
 *
 * @param {string} fullNumber - The full phone number including country code.
 * @param {Array<Object>} [countries=COUNTRIES] - The list of countries.
 * @returns {{country: Object, local: string}} The parsed country object and local number.
 */
const parsePhoneNumber = (fullNumber, countries = COUNTRIES) => {
  if (!fullNumber) {
    return { country: countries[0], local: '' };
  }
  const cleanNumber = fullNumber.replace(/\s+/g, '');
  const sortedCountries = [...countries].sort((a, b) => b.code.length - a.code.length);
  const matchedCountry = sortedCountries.find((c) => cleanNumber.startsWith(c.code));
  if (matchedCountry) {
    const local = fullNumber.slice(matchedCountry.code.length).trim();
    return { country: matchedCountry, local };
  }
  return { country: countries[0], local: fullNumber };
};

/**
 * Onboarding component for user profile initialization and partner pairing.
 * Allows users to set their name, phone number, birthday, avatar, and pair with their partner.
 *
 * @returns {React.ReactElement} The rendered Onboarding component.
 */
export default function Onboarding() {
  const { user } = useAppContext();
  const dispatch = useAppDispatch();

  const [[step, direction], setStep] = useState([1, 0]);
  const [name, setName] = useState(user?.name || '');
  const [countriesList, setCountriesList] = useState(COUNTRIES);
  const [selectedCountry, setSelectedCountry] = useState(() => {
    if (user?.phone_number) {
      return parsePhoneNumber(user.phone_number, countriesList).country;
    }
    return countriesList[0];
  });
  const [localNumber, setLocalNumber] = useState(() => {
    if (user?.phone_number) {
      return parsePhoneNumber(user.phone_number, countriesList).local;
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

  // Floating Hearts Background (Same as Auth)
  const floatingHearts = useMemo(() => {
    return [...Array(8)].map((_, i) => {
      const arr = new Uint32Array(3);
      window.crypto.getRandomValues(arr);
      const rand1 = arr[0] / (0xffffffff + 1);
      const rand2 = arr[1] / (0xffffffff + 1);
      const rand3 = arr[2] / (0xffffffff + 1);
      return {
        id: i,
        left: `${rand1 * 100}%`,
        top: `${rand2 * 100}%`,
        fontSize: `${20 + rand3 * 40}px`,
        animationDelay: `${i * 0.8}s`,
        animationDuration: `${8 + rand1 * 4}s`,
      };
    });
  }, []);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Fetch country calling code based on IP Geolocation on mount
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
            // Find matched country in static list
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

  // Auto-skip to Step 5 if profile details are already set or onboarding is completed
  useEffect(() => {
    if ((user?.onboarding_completed || user?.name) && step < 5) {
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  /**
   * Handles selecting a country from the dropdown.
   *
   * @param {Object} country - The country object.
   */
  const handleSelectCountry = (country) => {
    setSelectedCountry(country);
    setShowCountryDropdown(false);
  };

  /**
   * Handles changes to the local phone number input.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} e - The input change event.
   */
  const handleLocalNumberChange = (e) => {
    const inputVal = e.target.value;
    setLocalNumber(formatLocalNumber(inputVal));
  };

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
      // This will fire the SECURITY DEFINER database trigger "on_partner_id_updated",
      // which automatically and securely links the partner's record back to this user
      // and consumes their pairing code within the same atomic transaction.
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

  const handleSkipPairing = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({ onboarding_completed: true })
        .eq('id', user.id);

      if (updateError) throw updateError;

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
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {floatingHearts.map((heart) => (
          <div
            key={heart.id}
            className="absolute text-primary/20 animate-float"
            style={{
              left: heart.left,
              top: heart.top,
              fontSize: heart.fontSize,
              animationDelay: heart.animationDelay,
              animationDuration: heart.animationDuration,
            }}
          >
            <Heart className="fill-current w-full h-full" />
          </div>
        ))}
      </div>

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

      <main className="flex-grow flex items-center justify-center px-6 md:px-8 relative z-10 overflow-y-auto">
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
                <div className="space-y-8">
                  <div className="space-y-2">
                    <span className="text-primary font-semibold tracking-tighter text-sm uppercase">
                      01 / 05
                    </span>
                    <h2 className="font-heading text-4xl md:text-5xl leading-tight font-bold text-text-main">
                      First, what should we call you?
                    </h2>
                  </div>
                  <div className="border-b-2 border-surface-border focus-within:border-primary transition-colors py-4">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="w-full bg-transparent text-2xl md:text-3xl placeholder-text-muted/50 text-text-main focus:outline-none"
                      autoFocus
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (name.trim()) setStep([2, 1]);
                    }}
                    disabled={!name.trim()}
                    className="bg-text-main text-background hover-heart-scale px-10 py-4 rounded-full text-sm font-bold uppercase tracking-widest flex items-center space-x-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <span className="relative z-10">Continue</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform relative z-10" />
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-8">
                  <div className="space-y-2">
                    <span className="text-primary font-semibold tracking-tighter text-sm uppercase">
                      02 / 05
                    </span>
                    <h2 className="font-heading text-4xl md:text-5xl leading-tight font-bold text-text-main">
                      Tell us a bit more about yourself.
                    </h2>
                  </div>
                  <div className="space-y-6">
                    <div className="border-b-2 border-surface-border focus-within:border-primary transition-colors py-4 group flex flex-col">
                      <label className="text-xs font-bold uppercase tracking-widest text-text-muted group-focus-within:text-primary transition-colors block mb-2">
                        Phone Number (Optional)
                      </label>
                      <div className="flex items-center relative">
                        {/* Country Selector Dropdown */}
                        <div className="relative mr-3 shrink-0">
                          <button
                            type="button"
                            onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-surface/40 hover:bg-surface/70 border border-surface-border/50 text-text-main transition-colors text-lg"
                          >
                            <span className="text-xl leading-none">{selectedCountry.flag}</span>
                            <span className="font-bold text-sm leading-none">
                              {selectedCountry.code}
                            </span>
                            <span className="text-[10px] text-text-muted">▼</span>
                          </button>

                          {showCountryDropdown && (
                            <>
                              <div
                                className="fixed inset-0 z-40"
                                onClick={() => setShowCountryDropdown(false)}
                              />
                              <div className="absolute top-full left-0 mt-2 w-64 max-h-60 overflow-y-auto bg-surface border border-surface-border rounded-2xl shadow-xl z-50 py-2 custom-scrollbar">
                                {countriesList.map((c) => (
                                  <button
                                    key={c.code}
                                    type="button"
                                    onClick={() => handleSelectCountry(c)}
                                    className="w-full px-4 py-2.5 hover:bg-primary/10 flex items-center space-x-3 text-left transition-colors"
                                  >
                                    <span className="text-xl shrink-0">{c.flag}</span>
                                    <span className="text-sm font-semibold text-text-main shrink-0 w-12">
                                      {c.code}
                                    </span>
                                    <span className="text-xs text-text-muted truncate">
                                      {c.name}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>

                        {/* Phone Number Input */}
                        <input
                          type="tel"
                          value={localNumber}
                          onChange={handleLocalNumberChange}
                          placeholder="803 123 4567"
                          className="w-full bg-transparent text-xl md:text-2xl placeholder-text-muted/30 text-text-main focus:outline-none"
                          autoFocus
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button
                      type="button"
                      onClick={() => setStep([1, -1])}
                      className="p-4 rounded-full border border-surface-border hover:border-text-muted text-text-main transition-colors relative z-10 bg-background"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep([3, 1])}
                      className="bg-text-main text-background hover-heart-scale flex-grow py-4 rounded-full text-sm font-bold uppercase tracking-widest transition-all group"
                    >
                      <span className="relative z-10">Next</span>
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-8">
                  <div className="space-y-2">
                    <span className="text-primary font-semibold tracking-tighter text-sm uppercase">
                      03 / 05
                    </span>
                    <h2 className="font-heading text-4xl md:text-5xl leading-tight font-bold text-text-main">
                      When is your special day?
                    </h2>
                  </div>
                  <div className="space-y-6">
                    <div className="border-b-2 border-surface-border focus-within:border-primary transition-colors py-4 group">
                      <label className="text-xs font-bold uppercase tracking-widest text-text-muted group-focus-within:text-primary transition-colors block mb-2">
                        Your Birthday
                      </label>
                      <input
                        type="date"
                        value={birthday}
                        onChange={(e) => setBirthday(e.target.value)}
                        className="w-full bg-transparent text-xl md:text-2xl text-text-main focus:outline-none"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button
                      type="button"
                      onClick={() => setStep([2, -1])}
                      className="p-4 rounded-full border border-surface-border hover:border-text-muted text-text-main transition-colors relative z-10 bg-background"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep([4, 1])}
                      className="bg-text-main text-background hover-heart-scale flex-grow py-4 rounded-full text-sm font-bold uppercase tracking-widest transition-all group"
                    >
                      <span className="relative z-10">Next</span>
                    </button>
                  </div>
                </div>
              )}

              {step === 4 && (
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
                      onClick={() => setStep([3, -1])}
                      className="p-4 rounded-full border border-surface-border hover:border-text-muted text-text-main transition-colors relative z-10 bg-background"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleProfileSubmit}
                      disabled={loading}
                      className="bg-text-main text-background hover-heart-scale flex-grow py-4 rounded-full text-sm font-bold uppercase tracking-widest transition-all disabled:opacity-50 group flex items-center justify-center"
                    >
                      <span className="relative z-10 flex items-center justify-center">
                        {loading ? (
                          <LoadingSpinner size="sm" className="text-background" />
                        ) : (
                          'Almost There'
                        )}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-8">
                  <div className="space-y-2">
                    <span className="text-primary font-semibold tracking-tighter text-sm uppercase">
                      05 / 05
                    </span>
                    <h2 className="font-heading text-4xl md:text-5xl leading-tight font-bold text-text-main">
                      Find Your Partner.
                    </h2>
                    <p className="text-sm text-text-muted italic">
                      Lover-HQ is best enjoyed by two.
                    </p>
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
                              onClick={handleGenerateCode}
                              disabled={loading}
                              className="w-full bg-transparent border-2 border-primary text-primary font-bold py-3 px-6 rounded-full hover:bg-primary/5 transition-all disabled:opacity-50 flex items-center justify-center"
                            >
                              {loading ? (
                                <LoadingSpinner size="sm" className="text-primary" />
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
                                  setError({ text: 'Pairing code copied!', type: 'success' });
                                }}
                                className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-text-main text-sm font-bold rounded-full border border-white/5 transition-colors flex items-center justify-center gap-2 hover-heart-scale"
                              >
                                <span>Copy Code</span>
                                <Copy size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={handleShareLink}
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
                          onClick={handleGenerateCode}
                          disabled={loading}
                          className="w-full bg-transparent border-2 border-primary text-primary font-bold py-3 px-6 rounded-full hover:bg-primary/5 transition-all disabled:opacity-50 flex items-center justify-center"
                        >
                          {loading ? (
                            <LoadingSpinner size="sm" className="text-primary" />
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

                    <form onSubmit={handleEnterCode} className="space-y-6">
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
                            <LoadingSpinner size="sm" className="text-white" />
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
                        onClick={handleSkipPairing}
                        disabled={loading}
                        className="text-xs font-bold uppercase tracking-widest text-text-muted hover:text-primary transition-colors py-2.5 px-4 rounded-xl hover:bg-white/5 flex items-center justify-center gap-2 mx-auto"
                      >
                        {loading && <LoadingSpinner size="sm" className="text-text-muted w-4 h-4" />}
                        <span>{user?.pairing_code ? 'Go to Dashboard' : 'Explore in Solo Mode'}</span>
                      </button>
                    </div>
                  </div>
                </div>
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
