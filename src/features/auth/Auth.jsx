import React, { useState, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { useAppDispatch } from '../../contexts/AppContext';
import { LoverHQLogo } from '../../assets/Logo';
import { Heart, Sparkles, Home } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const dispatch = useAppDispatch();

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

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = isLogin
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

      if (authError) throw authError;

      if (data.user) {
        dispatch({ type: 'SET_USER', payload: data.user });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 w-full h-[100dvh] bg-background overflow-hidden flex flex-col">
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 pb-12 pt-8 relative flex flex-col items-center justify-center">
        {/* Animated Background Elements - Floating Hearts */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {floatingHearts.map((heart) => (
            <div
              key={heart.id}
              className="absolute text-primary/20 dark:text-primary/10 animate-float"
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

        {/* Gradient Glow Orbs */}
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-primary/20 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div
          className="absolute bottom-1/4 -right-20 w-72 h-72 bg-secondary/15 rounded-full blur-[120px] animate-pulse-slow"
          style={{ animationDelay: '1s' }}
        ></div>

        {/* Main Card */}
        <div className="max-w-md w-full space-y-8 bg-surface/60 backdrop-blur-2xl p-10 rounded-3xl border-2 border-surface-border relative z-10 animate-slide-up">
          {/* House Icon with Pulsing Glow */}
          <div className="text-center">
            <div className="mx-auto h-20 w-20 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center text-4xl relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-2xl blur-xl opacity-60 animate-pulse"></div>
              <LoverHQLogo className="text-white w-10 h-10 relative z-10" />
            </div>

            <h2 className="mt-6 text-3xl font-heading font-bold text-text-main animate-fade-in">
              {isLogin ? 'Welcome Home' : 'Build Your Space'}
            </h2>

            <p className="mt-3 text-text-muted font-handwriting text-lg animate-fade-in-delay">
              {isLogin ? "they've been waiting for you..." : 'create a home for two hearts'}
            </p>
          </div>

          <form className="mt-8 space-y-6 animate-fade-in-delay-2" onSubmit={handleAuth}>
            <div className="space-y-5">
              {/* Email Input with Focus Effects */}
              <div className="group relative">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1 mb-2 block group-focus-within:text-primary transition-colors duration-300">
                  Your email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    className="appearance-none relative block w-full px-5 py-4 bg-surface/80 border-2 border-surface-border placeholder-text-muted/60 text-text-main rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/30 focus:border-primary transition-all duration-300 text-base"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                </div>
              </div>

              {/* Password Input with Focus Effects */}
              <div className="group relative">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1 mb-2 block group-focus-within:text-primary transition-colors duration-300">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    className="appearance-none relative block w-full px-5 py-4 bg-surface/80 border-2 border-surface-border placeholder-text-muted/60 text-text-main rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/30 focus:border-primary transition-all duration-300 text-base"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                </div>
              </div>
            </div>

            {/* Romantic Error Message */}
            {error && (
              <div className="absolute top-4 left-4 right-4 z-50 animate-slide-down-fade">
                <div className="mx-auto max-w-sm bg-error-bg/10 backdrop-blur-xl border border-error-bg/30 p-4 rounded-2xl shadow-xl shadow-error-bg/5 flex items-center gap-3">
                  <Heart className="w-5 h-5 text-error-bg shrink-0" />
                  <span className="font-handwriting text-lg text-error-bg leading-tight">
                    {error}
                  </span>
                </div>
              </div>
            )}

            {/* Submit Button with Gradient and Hover Effects */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative overflow-hidden w-full flex justify-center py-4 px-6 border-2 border-transparent text-base font-bold rounded-xl text-white bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary focus:outline-none focus:ring-4 focus:ring-primary/50 transition-all duration-500 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {/* Button Shine Effect */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>

                <span className="relative z-10 flex items-center gap-2">
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                      opening the door...
                    </>
                  ) : (
                    <>
                      {isLogin ? (
                        <>
                          <Sparkles className="w-5 h-5" /> Enter Your Home
                        </>
                      ) : (
                        <>
                          <Home className="w-5 h-5" /> Create Your Space
                        </>
                      )}
                    </>
                  )}
                </span>
              </button>
            </div>
          </form>

          {/* Toggle Link with Smooth Transition */}
          <div className="text-center animate-fade-in-delay-3">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="font-medium text-primary hover:text-secondary transition-all duration-300 hover:scale-105 inline-block font-handwriting text-xl"
            >
              {isLogin
                ? "don't have a home yet? build one together →"
                : 'already have a home? welcome back →'}
            </button>
          </div>

          {/* Decorative Bottom Border */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>
        </div>
      </div>
    </div>
  );
}
