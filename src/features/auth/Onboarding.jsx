import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { useAppDispatch, useAppContext } from '../../contexts/AppContext';
import { LoverHQLogo } from '../../assets/Logo';
import {
  Link as LinkIcon,
  Heart,
  Cat,
  Dog,
  Rabbit,
  Bird,
  Turtle,
  Leaf,
  Flower2,
  Star,
  Moon,
  Sun,
  X,
  ChevronRight,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import Avatar from '../../components/Avatar';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';

const avatarOptions = [
  { id: 'cat', icon: Cat },
  { id: 'dog', icon: Dog },
  { id: 'rabbit', icon: Rabbit },
  { id: 'bird', icon: Bird },
  { id: 'turtle', icon: Turtle },
  { id: 'leaf', icon: Leaf },
  { id: 'flower', icon: Flower2 },
  { id: 'star', icon: Star },
  { id: 'moon', icon: Moon },
  { id: 'sun', icon: Sun },
];

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
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || '');
  const [birthday, setBirthday] = useState(user?.birthday || '');
  const [selectedAvatarId, setSelectedAvatarId] = useState(user?.avatar_url || 'cat');
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

  // Auto-skip to Step 5 if onboarding is already completed
  useEffect(() => {
    if (user?.onboarding_completed && step < 5) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStep([5, 1]);
    }
  }, [user, step]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleProfileSubmit = async (e) => {
    e?.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          name: name.trim(),
          avatar_url: selectedAvatarId,
          phone_number: phoneNumber.trim() || null,
          birthday: birthday || null,
          onboarding_completed: true,
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      dispatch({
        type: 'SET_USER',
        payload: {
          ...user,
          name: name.trim(),
          avatar_url: selectedAvatarId,
          phone_number: phoneNumber.trim() || null,
          birthday: birthday || null,
          onboarding_completed: true,
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
      const { data: partner, error: findError } = await supabase
        .from('users')
        .select('*')
        .eq('pairing_code', pairingCode)
        .single();

      if (findError || !partner) {
        throw new Error('Invalid pairing code. Please check and try again.');
      }

      if (partner.pairing_code_expires_at) {
        const expiresAt = new Date(partner.pairing_code_expires_at);
        const now = new Date();
        if (expiresAt < now) {
          throw new Error('This pairing code has expired. Please generate a new one.');
        }
      }

      if (partner.id === user.id) {
        throw new Error("You can't pair with yourself!");
      }

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
        <button
          onClick={handleSignOut}
          className="text-xs font-semibold uppercase tracking-widest text-text-muted hover:text-text-main transition-colors"
        >
          Sign Out
        </button>
      </header>

      {/* Progress Track */}
      <div className="w-full h-1 bg-surface-border relative z-20">
        <div
          className="h-full bg-primary transition-all duration-700 ease-in-out"
          style={{ width: `${(step / 5) * 100}%` }}
        ></div>
      </div>

      <main className="flex-grow flex items-center justify-center px-6 md:px-8 relative z-10 overflow-y-auto">
        {/* Romantic Error Message */}
        {error && (
          <div className="absolute top-4 left-4 right-4 z-50 animate-slide-down-fade">
            <div className="mx-auto max-w-sm bg-error-bg/10 backdrop-blur-xl border border-error-bg/30 p-4 rounded-2xl shadow-xl shadow-error-bg/5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Heart className="w-5 h-5 text-error-bg shrink-0" />
                <span className="font-handwriting text-lg text-error-bg leading-tight">
                  {error}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-error-bg/70 hover:text-error-bg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

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
                      Welcome Home. First, what should we call you?
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
                    <div className="border-b-2 border-surface-border focus-within:border-primary transition-colors py-4 group">
                      <label className="text-xs font-bold uppercase tracking-widest text-text-muted group-focus-within:text-primary transition-colors block mb-2">
                        Phone Number (Optional)
                      </label>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        className="w-full bg-transparent text-xl md:text-2xl placeholder-text-muted/50 text-text-main focus:outline-none"
                        autoFocus
                      />
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
                    <div className="grid grid-cols-5 gap-3">
                      {avatarOptions.map((opt) => {
                        const Icon = opt.icon;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setSelectedAvatarId(opt.id)}
                            className={`p-3 rounded-full transition-all flex items-center justify-center ${
                              selectedAvatarId === opt.id
                                ? 'bg-primary/20 text-primary scale-110 shadow-sm border border-primary/30'
                                : 'text-text-muted hover:bg-surface-border border border-transparent'
                            }`}
                          >
                            <Icon size={24} strokeWidth={selectedAvatarId === opt.id ? 2.5 : 2} />
                          </button>
                        );
                      })}
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
                      className="bg-text-main text-background hover-heart-scale flex-grow py-4 rounded-full text-sm font-bold uppercase tracking-widest transition-all disabled:opacity-50 group"
                    >
                      <span className="relative z-10">
                        {loading ? 'Saving...' : 'Almost There'}
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
                              className="w-full bg-transparent border-2 border-primary text-primary font-bold py-3 px-6 rounded-full hover:bg-primary/5 transition-all disabled:opacity-50"
                            >
                              {loading ? 'Creating...' : 'Generate New Code'}
                            </button>
                          </div>
                        ) : (
                          <div className="text-center w-full flex flex-col items-center">
                            <div className="text-4xl font-mono font-bold tracking-[0.5em] text-primary bg-surface/40 px-8 py-4 rounded-2xl shadow-inner mb-6">
                              {user.pairing_code}
                            </div>
                            <button
                              onClick={handleShareLink}
                              className="w-full bg-primary text-white font-bold py-3 px-6 rounded-full shadow-lg hover:shadow-xl hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 hover-heart-scale group"
                            >
                              <span className="relative z-10 flex items-center justify-center gap-2">
                                <span>Share Link</span>
                                <LinkIcon size={18} />
                              </span>
                            </button>
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
                          className="w-full bg-transparent border-2 border-primary text-primary font-bold py-3 px-6 rounded-full hover:bg-primary/5 transition-all disabled:opacity-50"
                        >
                          {loading ? 'Creating...' : 'Generate Code'}
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
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
