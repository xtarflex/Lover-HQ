import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { TopBar } from './components/TopBar';
import { BottomNav } from './components/BottomNav';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useAppContext } from './contexts/AppContext';

// Lazy-loaded feature components
const Auth = lazy(() => import('./features/auth/Auth'));
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
    <div className="flex flex-col min-h-screen bg-gray-50 pb-16">
      <TopBar />
      <main className="flex-grow container mx-auto px-4 overflow-y-auto">
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
  // We'll bring back user destructuring when actual auth is implemented
  useAppContext();

  // Example simple auth check. Replace with actual logic.
  // if (!user) {
  //   return <Navigate to="/auth" replace />;
  // }

  return children;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/auth"
          element={
            <Suspense fallback={<LoadingSpinner className="h-screen" />}>
              <Auth />
            </Suspense>
          }
        />

        {/* Main application routes wrapped in layout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/fridge" replace />} />
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
    </Router>
  );
}
