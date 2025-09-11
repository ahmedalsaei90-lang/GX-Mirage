import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

export function Header() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <header className="bg-purple-700 dark:bg-purple-dark p-4 flex items-center justify-between">
      <button onClick={() => navigate(-1)} className="text-white text-xl">← Back</button>
      {/* Small Toggle Switcher in Top Right */}
      <label className="relative inline-flex items-center cursor-pointer" aria-label="Toggle theme">
        <input type="checkbox" checked={theme === 'dark'} onChange={toggleTheme} className="sr-only" />
        <div className="w-10 h-5 bg-gray-200 rounded-full peer dark:bg-gray-700">
          <div className="w-5 h-5 bg-white rounded-full peer-checked:translate-x-5 transition-all peer-checked:bg-purple-300"></div>
        </div>
        <span className="ml-2 text-white">{theme === 'light' ? '🌞' : '🌙'}</span>
      </label>
    </header>
  );
}