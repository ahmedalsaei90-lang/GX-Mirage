import React from 'react';
import { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { useAuth } from '../hooks/useAuth';
import { generateQuestions } from '../services/openai';
import { Link } from 'react-router-dom';

export function Home() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold text-purple-700 dark:text-purple-300 text-center">Welcome to GX-Mirage! 🎮</h1>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center purple-gradient text-white dark:text-gray-200">
        <p className="text-lg">Your Trivia Adventure Starts Here!</p>
        {user ? (
          <div>
            <p>Rank: #{user.rank || 1} | Coins: {user.coins || 100} 💰</p>
            <p>Score: {user.score || 0} pts</p>
          </div>
        ) : (
          <p>Login to see your stats!</p>
        )}
      </div>
      <div className="bg-purple-100 dark:bg-gray-700 p-4 rounded-lg">
        <h2 className="text-purple-700 dark:text-purple-300 font-semibold">Daily Challenge</h2>
        <p className="text-black dark:text-white">Play today for +100 coins!</p>
        <Link to="/daily-quiz" className="block mt-2 bg-green-600 text-white py-2 rounded hover:bg-green-700">Start Daily Quiz</Link>
      </div>
      <div className="bg-purple-100 dark:bg-gray-700 p-4 rounded-lg">
        <h2 className="text-purple-700 dark:text-purple-300 font-semibold">Quick Battles</h2>
        <p className="text-black dark:text-white">Join random matches for coins! Entry: 5 coins</p>
      </div>
      <div className="text-center">
        <button 
          onClick={async () => {
            try {
              const questions = await generateQuestions('Sports', 'en', 3);
              console.log('Generated Questions:', questions);
              alert('Success! Check console for Qs.');
              const pre = document.createElement('pre');
              pre.innerHTML = JSON.stringify(questions, null, 2);
              document.body.appendChild(pre);
            } catch (error) {
              alert('Error: ' + error.message);
            }
          }} 
          className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700"
        >
          Test Generate 3 Sports Questions
        </button>
      </div>
    </div>
  );
}