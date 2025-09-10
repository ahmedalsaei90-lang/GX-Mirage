import React from 'react';
import { Link } from 'react-router-dom';

export function QuizZone() {
  const categories = ['Sports', 'History', 'Science', 'Movies', 'Geography', 'Music'];  // Add more as needed

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-3xl font-bold text-purple-700 text-center">Choose Quiz Category</h1>
      <div className="grid grid-cols-2 gap-4">
        {categories.map((cat) => (
          <Link key={cat} to={`/quiz/${cat}`} className="bg-purple-600 text-white p-4 rounded-lg text-center hover:bg-purple-700">
            {cat}
          </Link>
        ))}
      </div>
    </div>
  );
}