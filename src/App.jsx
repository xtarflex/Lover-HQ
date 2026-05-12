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
    <div className="flex flex-col min-h-screen bg-brand-slate pb-16">
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
  const { user } = useAppContext();
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

  // Listen for Supabase Auth changes
  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        dispatch({ type: 'SET_USER', payload: session.user });
      }
    });

    // Auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        dispatch({ type: 'SET_USER', payload: session.user });
      } else {
        dispatch({ type: 'RESET_STATE' });
      }
    });

    return () => subscription.unsubscribe();
  }, [dispatch]);

  return (
    <Router>
      <div className="min-h-screen bg-brand-slate">
        <OfflineIndicator />
        <Routes>
          <Route
            path="/auth"
            element={
              user ? (
                <Navigate to="/onboarding" replace />
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
