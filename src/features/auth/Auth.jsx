import React, { useState, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { useAppDispatch } from '../../contexts/AppContext';
import { LoverHQLogo } from '../../assets/Logo';
import { Heart, Mail, Lock, Eye, EyeOff, Sparkles, Home } from 'lucide-react';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Notification } from '../../components/Notification';

/**
 * Auth component for user authentication (Login and Sign Up).
 * Renders the login/signup form and handles integration with Supabase auth.
 *
 * @returns {React.ReactElement} The rendered Auth component.
 */
export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="fixed inset-0 w-full h-[100dvh] bg-background text-text-main overflow-hidden flex flex-col">
      <div className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col items-center justify-center px-6 py-12">
        {/* Animated Background Elements - Floating Hearts */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
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

        <main className="max-w-md w-full relative z-10 animate-slide-up flex flex-col items-center">
          <div className="text-center space-y-4 mb-10 w-full">
            <div className="inline-block p-4 bg-surface/10 backdrop-blur-md rounded-full mb-2">
              <LoverHQLogo className="w-10 h-10 text-primary" />
            </div>
            <h2 className="font-heading text-4xl font-bold tracking-tight drop-shadow-lg text-text-main">
              {isLogin ? 'Welcome Home' : 'Build Your Space'}
            </h2>
            <p className="text-text-muted text-lg font-light tracking-wide italic">
              {isLogin ? "they've been waiting for you..." : 'create a home for two hearts'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="w-full space-y-6">
            <div className="space-y-4">
              {/* Email */}
              <div className="relative group">
                <span className="absolute inset-y-0 left-4 flex items-center text-text-muted/60 group-focus-within:text-primary transition-colors">
                  <Mail className="w-5 h-5" />
                </span>
                <input
                  type="email"
                  required
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl text-lg bg-surface/10 backdrop-blur-md border border-surface-border/50 text-text-main placeholder-text-muted focus:bg-surface/20 focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition-all duration-300 shadow-sm"
                />
              </div>

              {/* Password */}
              <div className="relative group">
                <span className="absolute inset-y-0 left-4 flex items-center text-text-muted/60 group-focus-within:text-primary transition-colors">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder={isLogin ? 'Enter your password' : 'Create a password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 rounded-2xl text-lg bg-surface/10 backdrop-blur-md border border-surface-border/50 text-text-main placeholder-text-muted focus:bg-surface/20 focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition-all duration-300 shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-4 flex items-center text-text-muted/60 hover:text-text-main transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary hover:bg-primary-hover text-white font-bold text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all active:scale-95 flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <LoadingSpinner className="w-8 h-8 text-white" />
                  <span>Preparing space...</span>
                </div>
              ) : (
                <>
                  {isLogin ? (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>Enter Your Home</span>
                    </>
                  ) : (
                    <>
                      <Home className="w-5 h-5" />
                      <span>Create Your Space</span>
                    </>
                  )}
                </>
              )}
            </button>
          </form>

          <div className="w-full mt-8 space-y-6">
            <div className="flex items-center space-x-4 opacity-70">
              <div className="h-px flex-grow bg-surface-border"></div>
              <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
                Quick Sign In
              </span>
              <div className="h-px flex-grow bg-surface-border"></div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                className="flex-1 py-4 bg-surface/10 backdrop-blur-md rounded-2xl border border-surface-border/50 hover:bg-surface/20 transition-all flex items-center justify-center text-text-main"
              >
                <svg
                  className="w-6 h-6 mr-2"
                  viewBox="-4.8 -4.8 57.60 57.60"
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                    <g transform="translate(-401.000000, -860.000000)">
                      <g transform="translate(401.000000, 860.000000)">
                        <path
                          d="M9.82727273,24 C9.82727273,22.4757333 10.0804318,21.0144 10.5322727,19.6437333 L2.62345455,13.6042667 C1.08206818,16.7338667 0.213636364,20.2602667 0.213636364,24 C0.213636364,27.7365333 1.081,31.2608 2.62025,34.3882667 L10.5247955,28.3370667 C10.0772273,26.9728 9.82727273,25.5168 9.82727273,24"
                          fill="currentColor"
                        ></path>
                        <path
                          d="M23.7136364,10.1333333 C27.025,10.1333333 30.0159091,11.3066667 32.3659091,13.2266667 L39.2022727,6.4 C35.0363636,2.77333333 29.6954545,0.533333333 23.7136364,0.533333333 C14.4268636,0.533333333 6.44540909,5.84426667 2.62345455,13.6042667 L10.5322727,19.6437333 C12.3545909,14.112 17.5491591,10.1333333 23.7136364,10.1333333"
                          fill="currentColor"
                          opacity="0.7"
                        ></path>
                        <path
                          d="M23.7136364,37.8666667 C17.5491591,37.8666667 12.3545909,33.888 10.5322727,28.3562667 L2.62345455,34.3946667 C6.44540909,42.1557333 14.4268636,47.4666667 23.7136364,47.4666667 C29.4455,47.4666667 34.9177955,45.4314667 39.0249545,41.6181333 L31.5177727,35.8144 C29.3995682,37.1488 26.7323182,37.8666667 23.7136364,37.8666667"
                          fill="currentColor"
                          opacity="0.7"
                        ></path>
                        <path
                          d="M46.1454545,24 C46.1454545,22.6133333 45.9318182,21.12 45.6113636,19.7333333 L23.7136364,19.7333333 L23.7136364,28.8 L36.3181818,28.8 C35.6879545,31.8912 33.9724545,34.2677333 31.5177727,35.8144 L39.0249545,41.6181333 C43.3393409,37.6138667 46.1454545,31.6490667 46.1454545,24"
                          fill="currentColor"
                        ></path>
                      </g>
                    </g>
                  </g>
                </svg>
                <span className="font-semibold">Google</span>
              </button>
              <button
                type="button"
                className="flex-1 py-4 bg-surface/10 backdrop-blur-md rounded-2xl border border-surface-border/50 hover:bg-surface/20 transition-all flex items-center justify-center text-text-main"
              >
                <svg
                  className="w-6 h-6 mr-2"
                  viewBox="-3.5 0 48 48"
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                    <g transform="translate(-204.000000, -560.000000)" fill="currentColor">
                      <path d="M231.174735,567.792499 C232.740177,565.771699 233.926883,562.915484 233.497649,560 C230.939077,560.177808 227.948466,561.814769 226.203475,563.948463 C224.612784,565.88177 223.305444,568.757742 223.816036,571.549042 C226.613071,571.636535 229.499881,569.960061 231.174735,567.792499 L231.174735,567.792499 Z M245,595.217241 C243.880625,597.712195 243.341978,598.827022 241.899976,601.03692 C239.888467,604.121745 237.052156,607.962958 233.53412,607.991182 C230.411652,608.02505 229.606488,605.94498 225.367451,605.970382 C221.128414,605.99296 220.244696,608.030695 217.116618,607.999649 C213.601387,607.968603 210.913765,604.502761 208.902256,601.417937 C203.27452,592.79849 202.68257,582.680377 206.152914,577.298162 C208.621711,573.476705 212.515678,571.241407 216.173986,571.241407 C219.89682,571.241407 222.239372,573.296075 225.322563,573.296075 C228.313175,573.296075 230.133913,571.235762 234.440281,571.235762 C237.700215,571.235762 241.153726,573.022307 243.611302,576.10431 C235.554045,580.546683 236.85858,592.121127 245,595.217241 L245,595.217241 Z"></path>
                    </g>
                  </g>
                </svg>
                <span className="font-semibold">Apple</span>
              </button>
            </div>
          </div>

          <p className="mt-10 text-text-muted text-sm">
            {isLogin ? "Don't have a home yet?" : 'Already have a home?'}{' '}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary font-bold hover:text-primary-hover transition-colors"
            >
              {isLogin ? 'Build one together' : 'Welcome back'}
            </button>
          </p>
        </main>
      </div>

      <Notification message={error} onClose={() => setError(null)} />
    </div>
  );
}
