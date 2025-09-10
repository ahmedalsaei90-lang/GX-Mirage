import React from 'react';
import { useNavigate } from 'react-router-dom';

export function Header() {
  const navigate = useNavigate();

  return (
    <header className="bg-purple-700 p-4 flex items-center">
      <button onClick={() => navigate(-1)} className="text-white text-xl">← Back</button>
    </header>
  );
}