import React, { Suspense, lazy, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from 'react-router-dom';
import { TopBar } from './components/TopBar';
import { BottomNav } from './components/BottomNav';
import { LoadingSpinner } from './components/LoadingSpinner';
import { InstallPrompt } from './components/InstallPrompt';
import { OfflineIndicator } from './components/OfflineIndicator';
import { useAppContext, useAppDispatch } from './contexts/AppContext';
import { supabase } from './lib/supabase';
import { usePresence } from './hooks/usePresence';

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
const Settings = lazy(() => import('./features/settings/Settings'));

/**
 * Layout component that includes the TopBar and BottomNav.
 * Tracks user route changes and syncs presence status dynamically.
 *
 * @returns {React.ReactElement} The MainLayout component.
 */
function MainLayout() {
  const location = useLocation();

  // Map route path to friendly room name
  const getFriendlyRoomName = (pathname) => {
    const path = pathname.replace(/^\//, '').toLowerCase();
    switch (path) {
      case 'home':
        return 'Home';
      case 'fridge':
        return 'Fridge';
      case 'music':
        return 'Music Room';
      case 'games':
        return 'Game Room';
      case 'reveal':
        return 'Reveal Room';
      case 'board':
        return 'Board Room';
      case 'profile':
        return 'Partner Profile';
      case 'settings':
        return 'Settings';
      default:
        return 'Lover-HQ';
    }
  };

  const friendlyRoomName = getFriendlyRoomName(location.pathname);
  usePresence(friendlyRoomName);

  const isFridgeRoute = location.pathname === '/fridge';

  return (
    <div
      className={
        isFridgeRoute
          ? 'flex flex-col h-[100dvh] overflow-hidden bg-background pb-20'
          : 'flex flex-col min-h-screen bg-background pb-24'
      }
    >
      <TopBar />
      <main
        className={
          isFridgeRoute
            ? 'flex-grow overflow-hidden flex flex-col relative'
            : 'flex-grow container mx-auto px-4 overflow-y-auto pt-4'
        }
      >
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

        if (error) {
          if (error.code !== 'PGRST116') {
            console.error('Error fetching profile:', error);
          }
          // If query fails due to offline/network error, keep the cached values and exit
          return;
        }

        const mergedUser = { ...authUser, ...(profile || {}) };
        dispatch({ type: 'SET_USER', payload: mergedUser });
        localStorage.setItem('lover_hq_user', JSON.stringify(mergedUser));

        // Determine pairing status
        if (profile?.partner_id) {
          dispatch({ type: 'SET_PAIRING_STATUS', payload: 'paired' });
          localStorage.setItem('lover_hq_pairing_status', 'paired');

          // Fetch partner data
          const { data: partner } = await supabase
            .from('users')
            .select('*')
            .eq('id', profile.partner_id)
            .single();
          if (partner) {
            dispatch({ type: 'SET_PARTNER', payload: partner });
            localStorage.setItem('lover_hq_partner', JSON.stringify(partner));
          }
        } else if (profile?.pairing_code) {
          dispatch({ type: 'SET_PAIRING_STATUS', payload: 'pending' });
          localStorage.setItem('lover_hq_pairing_status', 'pending');
        } else {
          dispatch({ type: 'SET_PAIRING_STATUS', payload: 'unpaired' });
          localStorage.setItem('lover_hq_pairing_status', 'unpaired');
        }
      } catch (err) {
        console.error('Profile sync failed:', err);
      }
    };

    const hydrateFromCache = () => {
      try {
        const cachedUser = localStorage.getItem('lover_hq_user');
        const cachedPartner = localStorage.getItem('lover_hq_partner');
        const cachedPairingStatus = localStorage.getItem('lover_hq_pairing_status');

        if (cachedUser) {
          dispatch({ type: 'SET_USER', payload: JSON.parse(cachedUser) });
        }
        if (cachedPartner) {
          dispatch({ type: 'SET_PARTNER', payload: JSON.parse(cachedPartner) });
        }
        if (cachedPairingStatus) {
          dispatch({ type: 'SET_PAIRING_STATUS', payload: cachedPairingStatus });
        }
      } catch (e) {
        console.error('Failed to parse cached auth state:', e);
      }
    };

    // 1. Immediately hydrate from cache to support seamless offline initial load
    hydrateFromCache();

    // 2. Initial session check
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (session?.user) {
          fetchProfile(session.user);
        } else {
          // If we are online and there is no active session, clear cached credentials
          if (navigator.onLine) {
            localStorage.removeItem('lover_hq_user');
            localStorage.removeItem('lover_hq_partner');
            localStorage.removeItem('lover_hq_pairing_status');
            dispatch({ type: 'RESET_STATE' });
          }
        }
      })
      .catch((err) => {
        console.error('Session retrieval failed:', err);
      });

    // 3. Auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user);
      } else {
        // If we are offline, do not clear the user state (it is likely a token refresh network failure)
        if (!navigator.onLine && localStorage.getItem('lover_hq_user')) {
          console.warn('Offline: ignoring session expiration auth event');
          hydrateFromCache();
          return;
        }
        localStorage.removeItem('lover_hq_user');
        localStorage.removeItem('lover_hq_partner');
        localStorage.removeItem('lover_hq_pairing_status');
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
                <Suspense fallback={<LoadingSpinner fullScreen />}>
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
                <Suspense fallback={<LoadingSpinner fullScreen />}>
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
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <InstallPrompt />
      </div>
    </Router>
  );
}
