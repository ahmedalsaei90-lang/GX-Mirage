import React from 'react';
import { Link } from 'react-router-dom';

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-purple-800 text-white flex justify-around py-2 shadow-lg">
      <Link to="/" className="flex flex-col items-center hover:bg-purple-700 p-2">
        <span>🏠</span>
        <span>Home</span>
      </Link>
      <Link to="/profile" className="flex flex-col items-center hover:bg-purple-700 p-2">
        <span>👤</span>
        <span>Profile</span>
      </Link>
      <Link to="/leaderboard" className="flex flex-col items-center hover:bg-purple-700 p-2">
        <span>🏆</span>
        <span>Leaderboard</span>
      </Link>
      <Link to="/store" className="flex flex-col items-center hover:bg-purple-700 p-2">
        <span>🛒</span>
        <span>Store</span>
      </Link>
      <Link to="/quiz-zone" className="flex flex-col items-center hover:bg-purple-700 p-2">
        <span>❓</span>
        <span>Quiz</span>
      </Link>
      <Link to="/play-zone" className="flex flex-col items-center hover:bg-purple-700 p-2">  // -- Added for Multiplayer
        <span>⚔️</span>
        <span>Battles</span>
      </Link>
    </nav>
  );
}