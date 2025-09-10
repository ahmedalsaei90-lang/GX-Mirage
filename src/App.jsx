import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { Layout } from './Layout';
import { Home } from './pages/Home';
import { Profile } from './pages/Profile';
import { Quiz } from './pages/Quiz';
import { Leaderboard } from './pages/Leaderboard';
import { Store } from './pages/Store';
import { QuizZone } from './pages/QuizZone';
import { PlayZone } from './pages/PlayZone';  // <-- Added

export function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/quiz/:category" element={<Quiz />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/store" element={<Store />} />
            <Route path="/quiz-zone" element={<QuizZone />} />
            <Route path="/play-zone" element={<PlayZone />} />  // -- Added
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}