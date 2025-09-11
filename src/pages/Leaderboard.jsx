import React from 'react';
import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export function Leaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeaders = async () => {
      const { data, error: fetchError } = await supabase
        .from('leaderboards')
        .select('*, users(email)')
        .order('score', { ascending: false })
        .limit(50);
      if (fetchError) {
        setError(fetchError.message);
        console.error('Leaderboard fetch error:', fetchError);
      } else {
        const rankedData = data.map((item, index) => ({ ...item, rank: index + 1 }));
        setLeaders(rankedData || []);
      }
      setLoading(false);
    };
    fetchLeaders();

    const channel = supabase.channel('leaderboard');
    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leaderboards' }, fetchLeaders)
      .subscribe();

    return () => channel.unsubscribe();
  }, []);

  if (loading) return <div className="p-4 text-purple-700 dark:text-white">Loading Leaderboard...</div>;
  if (error) return <div className="p-4 text-red-600 dark:text-red-300">Error: {error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold text-purple-700 dark:text-purple-300">Global Leaderboard</h1>
      <ul className="space-y-2 mt-4">
        {leaders.map((l, i) => (
          <li key={l.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg flex justify-between shadow-md transition-colors duration-200">
            <span className="text-black dark:text-white">#{i+1} {l.users?.email || 'Anonymous'}</span>
            <span className="text-purple-600 dark:text-purple-300 font-bold">{l.score} pts</span>
          </li>
        ))}
        {leaders.length === 0 && <p className="text-purple-600 dark:text-purple-300">No scores yet – play a quiz!</p>}
      </ul>
    </div>
  );
}