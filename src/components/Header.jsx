import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

export function Header() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useContext(ThemeContext);

  const handleToggle = () => {
    console.log('Toggle clicked'); // Debug log
    toggleTheme();
  };

  return (
    <header className="bg-purple-700 dark:bg-purple-dark p-4 flex items-center justify-between transition-colors duration-200">
      <button onClick={() => navigate(-1)} className="text-white text-xl">← Back</button>
      {/* Small Toggle Switcher in Top Right */}
      <label className="relative inline-flex items-center cursor-pointer" aria-label="Toggle theme" onClick={handleToggle}>
        <input
          type="checkbox"
          checked={theme === 'dark'}
          onChange={handleToggle} // Explicit handler
          className="sr-only peer"
        />
        <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:bg-purple-600 transition-colors duration-200">
          <div className="w-5 h-5 bg-white rounded-full shadow-md transform peer-checked:translate-x-5 transition-transform duration-200"></div>
        </div>
        <span className="ml-2 text-white">{theme === 'light' ? '🌞' : '🌙'}</span>
      </label>
    </header>
  );
}