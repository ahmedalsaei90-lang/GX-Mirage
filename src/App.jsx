import React, { Component } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { Layout } from './Layout';
import { Home } from './pages/Home';
import { Profile } from './pages/Profile';
import { Quiz } from './pages/Quiz';
import { Leaderboard } from './pages/Leaderboard';
import { Store } from './pages/Store';
import { QuizZone } from './pages/QuizZone';
import { PlayZone } from './pages/PlayZone';

class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-center text-red-600">
          <h1 className="text-2xl font-bold">Oops! Something Went Wrong</h1>
          <p>Error: {this.state.error.message} (Code: 404)</p>
          <p>Try refreshing or check back later.</p>
          <button onClick={() => window.location.href = '/'} className="bg-purple-600 text-white py-2 px-4 rounded mt-4 hover:bg-purple-700">
            Return to Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function App() {
  return (
    <AuthProvider>
      <Router>
        <ErrorBoundary>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/quiz/:category" element={<Quiz />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/store" element={<Store />} />
              <Route path="/quiz-zone" element={<QuizZone />} />
              <Route path="/play-zone" element={<PlayZone />} />
            </Route>
          </Routes>
        </ErrorBoundary>
      </Router>
    </AuthProvider>
  );
}