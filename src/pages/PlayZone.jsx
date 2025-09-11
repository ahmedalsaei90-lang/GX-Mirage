import React from 'react';
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../supabase';
import { generateQuestions } from '../services/openai';
import { Quiz } from './Quiz';

export function PlayZone() {
  const { user } = useAuth();
  const [pin, setPin] = useState('');
  const [room, setRoom] = useState(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const createRoom = async (category = 'Sports') => {
    if (user.coins < 5) {
      setError('Not enough coins! Need 5 for entry.');
      return;
    }
    setCreating(true);
    setError('');
    const { data: userData } = await supabase.from('users').update({ coins: user.coins - 5 }).eq('id', user.id).select();
    const newPin = Math.floor(1000 + Math.random() * 9000).toString();
    const questions = await generateQuestions(category, 'en', 10, 'medium', { includeImage: true });
    const { data: roomData, error } = await supabase.from('battle_rooms').insert({
      pin: newPin,
      category,
      entry_fee: 5,
      players: [{ user_id: user.id, score: 0, name: user.email.split('@')[0] || 'Player' }],
      status: 'waiting',
      questions
    }).select().single();
    if (error) {
      setError(error.message);
    } else {
      setRoom(roomData);
      subscribeToRoom(newPin);
    }
    setCreating(false);
  };

  const joinRoom = async () => {
    if (user.coins < 5) {
      setError('Not enough coins! Need 5 for entry.');
      return;
    }
    setError('');
    const { data: roomData, error } = await supabase.from('battle_rooms').select('*').eq('pin', pin).eq('status', 'waiting').single();
    if (error || !roomData) {
      setError('Invalid PIN or room full/started.');
      return;
    }
    const { data: userData } = await supabase.from('users').update({ coins: user.coins - 5 }).eq('id', user.id).select();
    const updatedPlayers = [...roomData.players, { user_id: user.id, score: 0, name: user.email.split('@')[0] || 'Player' }];
    let newStatus = 'waiting';
    if (updatedPlayers.length >= 2) {
      newStatus = 'playing';
    }
    const { error: updateError } = await supabase.from('battle_rooms').update({
      players: updatedPlayers,
      status: newStatus
    }).eq('id', roomData.id);
    if (updateError) {
      setError(updateError.message);
    } else {
      const newRoom = { ...roomData, players: updatedPlayers, status: newStatus };
      setRoom(newRoom);
      subscribeToRoom(pin);
    }
  };

  const subscribeToRoom = (roomPin) => {
    const channel = supabase.channel(`room-${roomPin}`);
    channel
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'battle_rooms', filter: `pin=eq.${roomPin}` }, (payload) => {
        setRoom(payload.new);
      })
      .subscribe();
    window.currentChannel = channel;
  };

  const leaveRoom = async () => {
    if (room && room.players.length > 1) {
      const updatedPlayers = room.players.filter(p => p.user_id !== user.id);
      await supabase.from('battle_rooms').update({ players: updatedPlayers }).eq('id', room.id);
    }
    if (window.currentChannel) {
      supabase.removeChannel(window.currentChannel);
    }
    setRoom(null);
    setPin('');
    setError('');
  };

  if (!user) return <div className="p-4 text-purple-700 dark:text-white">Login to play battles!</div>;

  if (room) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold text-purple-700 dark:text-purple-300">Battle Room {room.pin}</h1>
        <p className="text-black dark:text-white">Category: {room.category} | Players: {room.players.length}/8 | Status: {room.status}</p>
        <ul className="space-y-2">
          {room.players.map((p, i) => (
            <li key={i} className="bg-white dark:bg-gray-800 p-2 rounded text-black dark:text-white">Player {i+1}: {p.name} - Score: {p.score}</li>
          ))}
        </ul>
        {room.status === 'waiting' && room.players.length < 8 && (
          <button onClick={leaveRoom} className="w-full bg-red-600 text-white py-2 rounded mt-2">Leave Room</button>
        )}
        {room.status === 'playing' && <Quiz isBattle={true} roomId={room.id} questions={room.questions} />}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold text-purple-700 dark:text-purple-300">Play Zone</h1>
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
        <h2 className="text-purple-600 dark:text-purple-300">Create Random Battle</h2>
        <select className="w-full p-2 border rounded mb-2 dark:bg-gray-700 dark:text-white">
          <option>Sports</option>
          <option>General Knowledge</option>
        </select>
        <p className="text-black dark:text-white">Entry Fee: 5 Coins</p>
        <button onClick={() => createRoom()} disabled={creating} className="w-full bg-purple-600 text-white py-2 rounded disabled:opacity-50">
          {creating ? 'Creating...' : 'Create & Play'}
        </button>
      </div>
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
        <h2 className="text-purple-600 dark:text-purple-300">Join with PIN</h2>
        <input type="text" placeholder="Enter 4-digit PIN" value={pin} onChange={(e) => setPin(e.target.value)} className="w-full p-2 border rounded mb-2 dark:bg-gray-700 dark:text-white" />
        <button onClick={joinRoom} className="w-full bg-green-600 text-white py-2 rounded">Join Room</button>
        {error && <p className="text-red-600 dark:text-red-300 mt-2">{error}</p>}
      </div>
    </div>
  );
}