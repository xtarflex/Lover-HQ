import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { TopBar } from './components/TopBar';
import { BottomNav } from './components/BottomNav';
import { LoadingSpinner } from './components/LoadingSpinner';
import { InstallPrompt } from './components/InstallPrompt';
import { OfflineIndicator } from './components/OfflineIndicator';
import { useAppContext, useAppDispatch } from './contexts/AppContext';
import { supabase } from './lib/supabase';

// Lazy-loaded feature components
const Auth = lazy(() => import('./features/auth/Auth'));
const Onboarding = lazy(() => import('./features/auth/Onboarding'));
const Home = lazy(() => import('./features/home/Home'));
const Fridge = lazy(() => import('./features/fridge/Fridge'));
const Music = lazy(() => import('./features/music/Music'));
const Games = lazy(() => import('./features/games/Games'));
const Reveal = lazy(() => import('./features/reveal/Reveal'));
const Board = lazy(() => import('./features/board/Board'));
const Profile = lazy(() => import('./features/profile/Profile'));

/**
 * Layout component that includes the TopBar and BottomNav
 */
function MainLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-background pb-16">
      <TopBar />
      <main className="flex-grow container mx-auto px-4 overflow-y-auto pt-16">
        <Suspense fallback={<LoadingSpinner className="h-full mt-20" />}>
          <Outlet />
        </Suspense>
      </main>
      <BottomNav />
    </div>
  );
}

/**
 * Protected route wrapper
 */
function ProtectedRoute({ children }) {
  const { user, pairingStatus } = useAppContext();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If user is logged in but not paired, redirect to onboarding
  if (pairingStatus !== 'paired') {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}

export default function App() {
  const { user, pairingStatus } = useAppContext();
  const dispatch = useAppDispatch();

  // Capture pairing code from URL if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pairCode = params.get('pair');
    if (pairCode) {
      sessionStorage.setItem('lover_hq_pairing_code', pairCode);
      // Clean up URL without triggering a reload
      const newUrl =
        window.location.protocol + '//' + window.location.host + window.location.pathname;
      window.history.replaceState({ path: newUrl }, '', newUrl);
    }
  }, []);

  // Listen for Supabase Auth changes and Fetch Profile
  useEffect(() => {
    const fetchProfile = async (authUser) => {
      try {
        const { data: profile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error);
        }

        const mergedUser = { ...authUser, ...(profile || {}) };
        dispatch({ type: 'SET_USER', payload: mergedUser });

        if (profile?.partner_id) {
          dispatch({ type: 'SET_PAIRING_STATUS', payload: 'paired' });
          // Fetch partner data
          const { data: partner } = await supabase
            .from('users')
            .select('*')
            .eq('id', profile.partner_id)
            .single();
          if (partner) dispatch({ type: 'SET_PARTNER', payload: partner });
        } else if (profile?.pairing_code) {
          dispatch({ type: 'SET_PAIRING_STATUS', payload: 'pending' });
        } else {
          dispatch({ type: 'SET_PAIRING_STATUS', payload: 'unpaired' });
        }
      } catch (err) {
        console.error('Profile sync failed:', err);
      }
    };

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user);
      }
    });

    // Auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user);
      } else {
        dispatch({ type: 'RESET_STATE' });
      }
    });

    return () => subscription.unsubscribe();
  }, [dispatch]);

  return (
    <Router>
      <div className="min-h-screen bg-background">
        <OfflineIndicator />
        <Routes>
          <Route
            path="/auth"
            element={
              user ? (
                pairingStatus === 'paired' ? (
                  <Navigate to="/home" replace />
                ) : (
                  <Navigate to="/onboarding" replace />
                )
              ) : (
                <Suspense fallback={<LoadingSpinner />}>
                  <Auth />
                </Suspense>
              )
            }
          />

          <Route
            path="/onboarding"
            element={
              !user ? (
                <Navigate to="/auth" replace />
              ) : pairingStatus === 'paired' ? (
                <Navigate to="/home" replace />
              ) : (
                <Suspense fallback={<LoadingSpinner />}>
                  <Onboarding />
                </Suspense>
              )
            }
          />

          {/* Main application routes wrapped in layout and protection */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/home" replace />} />
            <Route path="home" element={<Home />} />
            <Route path="fridge" element={<Fridge />} />
            <Route path="music" element={<Music />} />
            <Route path="games" element={<Games />} />
            <Route path="reveal" element={<Reveal />} />
            <Route path="board" element={<Board />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <InstallPrompt />
      </div>
    </Router>
  );
}
