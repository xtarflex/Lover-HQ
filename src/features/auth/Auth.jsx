import React, { useState, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { useAppDispatch } from '../../contexts/AppContext';
import { LoverHQLogo } from '../../assets/Logo';

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
    <div className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Animated Background Elements - Floating Hearts */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {floatingHearts.map((heart) => (
          <div
            key={heart.id}
            className="absolute text-[#F59E0B]/10 animate-float"
            style={{
              left: heart.left,
              top: heart.top,
              fontSize: heart.fontSize,
              animationDelay: heart.animationDelay,
              animationDuration: heart.animationDuration,
            }}
          >
            ❤️
          </div>
        ))}
      </div>

      {/* Gradient Glow Orbs */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 bg-[#F59E0B]/20 rounded-full blur-[120px] animate-pulse-slow"></div>
      <div
        className="absolute bottom-1/4 -right-20 w-72 h-72 bg-[#EC4899]/15 rounded-full blur-[120px] animate-pulse-slow"
        style={{ animationDelay: '1s' }}
      ></div>

      {/* Main Card */}
      <div className="max-w-md w-full space-y-8 bg-[#1E293B]/80 backdrop-blur-xl p-10 rounded-3xl border border-[#334155]/50 relative z-10 animate-slide-up shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
        {/* House Icon with Pulsing Glow */}
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-gradient-to-br from-[#F59E0B] to-[#EC4899] rounded-2xl flex items-center justify-center text-4xl shadow-[0_0_40px_rgba(245,158,11,0.4)] animate-pulse-glow relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#F59E0B] to-[#EC4899] rounded-2xl blur-xl opacity-60 animate-pulse"></div>
            <LoverHQLogo className="text-white w-10 h-10 relative z-10" />
          </div>

          <h2 className="mt-6 text-3xl font-heading font-bold bg-gradient-to-r from-[#F8FAFC] to-[#CBD5E1] bg-clip-text text-transparent animate-fade-in">
            {isLogin ? 'Welcome Home' : 'Build Your Space'}
          </h2>

          <p className="mt-3 text-sm text-[#CBD5E1] font-handwriting text-lg animate-fade-in-delay">
            {isLogin ? "they've been waiting for you..." : 'create a home for two hearts'}
          </p>
        </div>

        <form className="mt-8 space-y-6 animate-fade-in-delay-2" onSubmit={handleAuth}>
          <div className="space-y-5">
            {/* Email Input with Focus Effects */}
            <div className="group relative">
              <label className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider ml-1 mb-2 block group-focus-within:text-[#F59E0B] transition-colors duration-300">
                Your email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  className="appearance-none relative block w-full px-5 py-4 bg-[#0F172A]/50 border-2 border-[#334155] placeholder-[#64748B] text-[#F8FAFC] rounded-xl focus:outline-none focus:ring-4 focus:ring-[#F59E0B]/30 focus:border-[#F59E0B] transition-all duration-300 text-base hover:border-[#475569]"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#F59E0B]/0 via-[#F59E0B]/5 to-[#F59E0B]/0 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              </div>
            </div>

            {/* Password Input with Focus Effects */}
            <div className="group relative">
              <label className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider ml-1 mb-2 block group-focus-within:text-[#F59E0B] transition-colors duration-300">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  className="appearance-none relative block w-full px-5 py-4 bg-[#0F172A]/50 border-2 border-[#334155] placeholder-[#64748B] text-[#F8FAFC] rounded-xl focus:outline-none focus:ring-4 focus:ring-[#F59E0B]/30 focus:border-[#F59E0B] transition-all duration-300 text-base hover:border-[#475569]"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#F59E0B]/0 via-[#F59E0B]/5 to-[#F59E0B]/0 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              </div>
            </div>
          </div>

          {/* Error Message with Slide Animation */}
          {error && (
            <div className="bg-red-900/30 border-2 border-red-900/50 text-red-300 p-4 rounded-xl text-sm text-center backdrop-blur-sm animate-shake">
              <span className="font-handwriting text-base">{error}</span>
            </div>
          )}

          {/* Submit Button with Gradient and Hover Effects */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-4 px-6 border-2 border-transparent text-base font-bold rounded-xl text-[#0F172A] bg-gradient-to-r from-[#F59E0B] to-[#EC4899] hover:from-[#EC4899] hover:to-[#F59E0B] focus:outline-none focus:ring-4 focus:ring-[#F59E0B]/50 transition-all duration-500 shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:shadow-[0_0_40px_rgba(236,72,153,0.5)] disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {/* Button Shine Effect */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>

              <span className="relative z-10 flex items-center gap-2">
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-3 border-[#0F172A]/30 border-t-[#0F172A] rounded-full animate-spin"></div>
                    opening the door...
                  </>
                ) : (
                  <>{isLogin ? '✨ Enter Your Home' : '🏠 Create Your Space'}</>
                )}
              </span>
            </button>
          </div>
        </form>

        {/* Toggle Link with Smooth Transition */}
        <div className="text-center animate-fade-in-delay-3">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm font-medium text-[#F59E0B] hover:text-[#EC4899] transition-all duration-300 hover:scale-105 inline-block font-handwriting text-base"
          >
            {isLogin
              ? "don't have a home yet? build one together →"
              : 'already have a home? welcome back →'}
          </button>
        </div>

        {/* Decorative Bottom Border */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#F59E0B] to-transparent opacity-50"></div>
      </div>
    </div>
  );
}
