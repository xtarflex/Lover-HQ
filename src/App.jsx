/**
 * @file App.jsx
 * @description Root application component. Configures client-side routing, applies
 * the active theme, handles the pairing-code URL parameter, and wires together
 * the MainLayout shell with protected routes.
 *
 * Auth state management is delegated to {@link useAuthSync}.
 * Speculative route pre-loading is delegated to {@link useSpeculativePreload}.
 */

import React, { Suspense, lazy, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { TopBar } from './components/TopBar';
import { BottomNav } from './components/BottomNav';
import { LoadingSpinner } from './components/LoadingSpinner';
import { InstallPrompt } from './components/InstallPrompt';
import { OfflineIndicator } from './components/OfflineIndicator';
import { useAppContext, useAppDispatch } from './contexts/AppContext';
import { usePresence } from './hooks/usePresence';
import { usePreferences } from './hooks/usePreferences';
import { useAuthSync } from './hooks/useAuthSync';
import { useSpeculativePreload } from './hooks/useSpeculativePreload';
import { useSyncPreferencesToStorage } from './hooks/useSyncPreferencesToStorage';
import GameInviteModal from './components/GameInviteModal';
import { Notification } from './components/Notification';
import { MusicProvider } from './contexts/MusicContext';
import { MiniPlayer } from './components/MiniPlayer';

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
const Chat = lazy(() => import('./features/chat/Chat'));

/**
 * Inner layout shell rendered for every authenticated route. Renders the
 * TopBar, BottomNav, and the active page via `<Outlet>`.
 *
 * Also tracks route changes to sync the user's presence room name, handles
 * the auto-join redirect for pending game invites, and renders global overlays
 * (GameInviteModal, Notification).
 *
 * @returns {React.ReactElement}
 */
function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { globalNotification, autoJoinGameId, activeGameId } = useAppContext();
  const dispatch = useAppDispatch();

  // Redirect to games page if auto-join game ID is active and user is not in games room
  useEffect(() => {
    if (autoJoinGameId && location.pathname !== '/games') {
      navigate('/games');
    }
  }, [autoJoinGameId, location.pathname, navigate]);

  /**
   * Maps a URL pathname to a human-readable presence room label.
   *
   * @param {string} pathname - The current `location.pathname`.
   * @returns {string} A friendly room name for presence tracking.
   */
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
      case 'chat':
        return 'Chat Room';
      default:
        return 'Lover-HQ';
    }
  };

  const friendlyRoomName = getFriendlyRoomName(location.pathname);
  usePresence(friendlyRoomName);

  const isFridgeRoute = location.pathname === '/fridge';
  const isGamesRoute = location.pathname === '/games';
  const isChatRoute = location.pathname === '/chat';
  const isFullHeight = isFridgeRoute || isGamesRoute || isChatRoute;

  // Hide global navigation and mini player inside active games or on the chat screen
  const showGlobalNav = !activeGameId && !isChatRoute;

  let containerClass = 'flex flex-col min-h-screen bg-background pb-24';
  if (isFullHeight) {
    containerClass =
      activeGameId || isChatRoute
        ? 'flex flex-col h-[100dvh] overflow-hidden bg-background'
        : 'flex flex-col h-[100dvh] overflow-hidden bg-background pb-20';
  } else if (activeGameId) {
    containerClass = 'flex flex-col min-h-screen bg-background';
  }

  return (
    <div className={containerClass}>
      {showGlobalNav && <TopBar />}
      <main
        className={
          isFullHeight
            ? 'flex-grow overflow-hidden flex flex-col relative'
            : 'flex-grow container mx-auto px-4 overflow-y-auto custom-scrollbar pt-4'
        }
      >
        <Suspense fallback={<LoadingSpinner className="h-full mt-20" />}>
          <Outlet />
        </Suspense>
      </main>
      {showGlobalNav && <MiniPlayer />}
      {showGlobalNav && <BottomNav />}
      <GameInviteModal />
      {globalNotification && (
        <Notification
          message={globalNotification.message}
          type={globalNotification.type || 'info'}
          onClose={() => dispatch({ type: 'SET_GLOBAL_NOTIFICATION', payload: null })}
        />
      )}
    </div>
  );
}

/**
 * Route wrapper that redirects unauthenticated or un-onboarded users to the
 * appropriate screen before rendering protected content.
 *
 * @param {object} props - Component props.
 * @param {React.ReactNode} props.children - The protected content to render.
 * @returns {React.ReactElement}
 */
function ProtectedRoute({ children }) {
  const { user } = useAppContext();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If user is logged in but has not completed profile onboarding, redirect to onboarding screen
  if (!user.onboarding_completed) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}

/**
 * @description Root application component. Sets up the Router, applies the active theme class
 * to `document.documentElement`, captures the pairing code from the URL search
 * params, and delegates auth sync + speculative preloading to dedicated hooks.
 *
 * @returns {React.ReactElement} The rendered root App element.
 */
export default function App() {
  const { user, preferences } = useAppContext();
  const dispatch = useAppDispatch();

  // Dynamic Netlify -> Cloudflare redirect check
  useEffect(() => {
    const isNetlify = window.location.hostname.includes('netlify.app');
    if (isNetlify) {
      fetch('https://lover-hq.pages.dev/redirect-config.json')
        .then((res) => {
          if (!res.ok) throw new Error('Failed to load redirect config');
          return res.json();
        })
        .then((data) => {
          if (data && data.redirect === true) {
            window.location.replace(
              'https://lover-hq.pages.dev' +
                window.location.pathname +
                window.location.search +
                window.location.hash
            );
          }
        })
        .catch((err) => {
          console.warn('Redirect check failed:', err);
        });
    }
  }, []);

  // Auth lifecycle: hydrate cache → fetch profile → realtime listener
  useAuthSync();

  // Background speculative preloading of lazy route chunks for instant navigation
  useSpeculativePreload();

  // Load and sync preferences from DB
  const { prefs } = usePreferences(user?.id);

  // Sync DB preferences → AppContext store + localStorage mirrors
  useSyncPreferencesToStorage(prefs, dispatch);

  // Apply theme class (dark or light) dynamically to documentElement
  useEffect(() => {
    if (preferences?.theme) {
      if (preferences.theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      }
    }
  }, [preferences?.theme]);

  // Capture pairing code from URL if present, store in sessionStorage, then clean the URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pairCode = params.get('pair');
    if (pairCode) {
      sessionStorage.setItem('lover_hq_pairing_code', pairCode);
      const newUrl =
        window.location.protocol + '//' + window.location.host + window.location.pathname;
      window.history.replaceState({ path: newUrl }, '', newUrl);
    }
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-background">
        <OfflineIndicator />
        <Routes>
          <Route
            path="/auth"
            element={
              user ? (
                user.onboarding_completed ? (
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
              user ? (
                <Suspense fallback={<LoadingSpinner fullScreen />}>
                  <Onboarding />
                </Suspense>
              ) : (
                <Navigate to="/auth" replace />
              )
            }
          />
          <Route
            element={
              <ProtectedRoute>
                <MusicProvider>
                  <MainLayout />
                </MusicProvider>
              </ProtectedRoute>
            }
          >
            <Route path="/home" element={<Home />} />
            <Route path="/fridge" element={<Fridge />} />
            <Route path="/music" element={<Music />} />
            <Route path="/games" element={<Games />} />
            <Route path="/reveal" element={<Reveal />} />
            <Route path="/board" element={<Board />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Route>
        </Routes>
        <InstallPrompt />
      </div>
    </Router>
  );
}
