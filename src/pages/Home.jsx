import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { generateQuestions } from '../services/openai';

export function Home() {
  const { user } = useAuth();

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold text-purple-700 text-center">Welcome to GX-Mirage! 🎮</h1>
      <div className="bg-white p-6 rounded-lg shadow-md text-center purple-gradient text-white">
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
      <div className="bg-purple-100 p-4 rounded-lg">
        <h2 className="text-purple-700 font-semibold">Quick Battles</h2>
        <p>Join random matches for coins! Entry: 5 coins</p>
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