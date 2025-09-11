import React from 'react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { generateQuestions } from '../services/openai';
import { supabase } from '../supabase';
import { useAuth } from '../hooks/useAuth';

export function Quiz({ isBattle = false, roomId, questions: propQuestions }) {
  const { category } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [questions, setQuestions] = useState(propQuestions || []);
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(30);
  const [lifelines, setLifelines] = useState(3);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(!propQuestions);
  const [gameEnded, setGameEnded] = useState(false);
  const [room, setRoom] = useState(null);
  const [imageSrc, setImageSrc] = useState('');
  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    if (isBattle && roomId) {
      const channel = supabase.channel(`room-battle-${roomId}`);
      channel
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'battle_rooms', filter: `id=eq.${roomId}` }, (payload) => {
          setRoom(payload.new);
          if (payload.new.questions) setQuestions(payload.new.questions);
          if (typeof payload.new.current_q === 'number') setCurrentQ(payload.new.current_q);
          if (typeof payload.new.timer === 'number') setTimer(payload.new.timer);
          if (payload.new.game_ended) setGameEnded(true);
        })
        .subscribe();
      supabase.from('battle_rooms').select('*').eq('id', roomId).single().then(({ data }) => {
        if (data) setRoom(data);
      });
      return () => channel.unsubscribe();
    }
  }, [isBattle, roomId]);

  useEffect(() => {
    if (!isBattle && category && user) {
      supabase.from('users').update({ coins: (user.coins || 100) - 5 }).eq('id', user.id).then(({ error }) => {
        if (error) console.error('Coin deduction error:', error);
      });
      generateQuestions(category, 'en', 10, 'medium').then(setQuestions).finally(() => setLoading(false));
    } else if (isBattle && propQuestions) {
      setLoading(false);
    }
  }, [category, user, isBattle, propQuestions]);

  useEffect(() => {
    if (timer > 0 && !gameEnded) {
      const id = setTimeout(() => {
        const newTimer = timer - 1;
        setTimer(newTimer);
        if (isBattle && room) {
          supabase.from('battle_rooms').update({ timer: newTimer }).eq('id', roomId);
        }
      }, 1000);
      return () => clearTimeout(id);
    } else if (timer === 0 && selected === null) {
      nextQuestion(false);
    }
  }, [timer, gameEnded, isBattle, roomId, room]);

  useEffect(() => {
    const q = questions[currentQ];
    if (q && q.image_desc) {
      setImageLoading(true);
      setImageSrc(`https://source.unsplash.com/300/200/?${q.image_desc}`);
    } else {
      setImageSrc('');
      setImageLoading(false);
    }
  }, [currentQ, questions]);

  const handleImageError = async (e) => {
    const q = questions[currentQ];
    if (q && q.image_desc) {
      try {
        const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(q.image_desc)}&per_page=1`, {
          headers: { Authorization: import.meta.env.VITE_PEXELS_API_KEY }
        });
        const data = await response.json();
        if (data.photos && data.photos.length > 0) {
          setImageSrc(data.photos[0].src.medium);
        } else {
          setImageSrc(`https://picsum.photos/300/200?random&blur=0.5?${q.image_desc || category}`);
        }
      } catch (err) {
        console.error('Pexels error:', err);
        setImageSrc(`https://picsum.photos/300/200?random&blur=0.5?${q.image_desc || category}`);
      }
    }
    setImageLoading(false);
  };

  const nextQuestion = (correct = false) => {
    if (correct) {
      const newScore = score + 100 + (timer * 2);
      setScore(newScore);
      if (isBattle && room) {
        const updatedPlayers = room.players.map(p => p.user_id === user.id ? { ...p, score: newScore } : p);
        supabase.from('battle_rooms').update({ players: updatedPlayers }).eq('id', roomId);
      }
    }
    const newCurrentQ = currentQ + 1;
    setCurrentQ(newCurrentQ);
    setTimer(30);
    setSelected(null);
    setImageLoading(true);
    if (isBattle && room) {
      supabase.from('battle_rooms').update({ current_q: newCurrentQ, timer: 30 }).eq('id', roomId);
    }
    if (newCurrentQ === questions.length) {
      endGame();
    }
  };

  const endGame = async () => {
    setGameEnded(true);
    if (user) {
      const { data: userData } = await supabase.from('users').select('score').eq('id', user.id).single();
      const newTotalScore = (userData.score || 0) + score;
      await supabase.from('users').update({ score: newTotalScore, coins: (user.coins || 100) + 50 }).eq('id', user.id);

      if (isBattle) {
        const winner = room.players.reduce((prev, curr) => prev.score > curr.score ? prev : curr);
        await supabase.from('users').update({ coins: (winner.coins || 100) + 50 }).eq('id', winner.user_id);
        await supabase.from('battle_rooms').update({ winner_id: winner.user_id, status: 'ended' }).eq('id', roomId);
      } else {
        await supabase.from('leaderboards').upsert(
          { user_id: user.id, category, score },
          { onConflict: 'user_id,category' }
        );
        const { data: lbData } = await supabase.from('leaderboards').select('score').eq('user_id', user.id).eq('category', category).single();
        if (lbData && lbData.score < score) {
          await supabase.from('leaderboards').update({ score }).eq('user_id', user.id).eq('category', category);
        }
      }
    }
    alert(`Game Over! Final Score: ${score} pts | Coins Earned: +50`);
    navigate('/');
  };

  const useLifeline = () => {
    if (lifelines > 0) {
      setLifelines(l => l - 1);
      const q = questions[currentQ];
      const wrongIndices = [0, 1, 2, 3].filter(i => i !== q.correct);
      const remove1 = wrongIndices[Math.floor(Math.random() * wrongIndices.length)];
      const remove2 = wrongIndices.find(i => i !== remove1);
      const newOptions = q.options.filter((_, i) => i !== remove1 && i !== remove2);
      setQuestions(prev => prev.map((qq, ii) => ii === currentQ ? { ...qq, options: newOptions } : qq));
    }
  };

  const submitAnswer = (index) => {
    setSelected(index);
  };

  const confirmAnswer = () => {
    if (selected !== null) {
      const correct = selected === questions[currentQ]?.correct;
      nextQuestion(correct);
    }
  };

  if (loading) return <div className="p-4 text-purple-700 dark:text-white text-center">Generating Questions...</div>;
  if (!questions.length) return <div className="p-4 text-red-600 dark:text-red-300">No questions – try again!</div>;

  const q = questions[currentQ];

  if (gameEnded) return <div className="p-4 text-purple-700 dark:text-white">Game Ended – Check Profile!</div>;

  return (
    <div className="p-4 max-w-md mx-auto space-y-4 bg-white dark:bg-gray-800 min-h-screen transition-colors duration-200">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-purple-700 dark:text-purple-300">{isBattle ? 'Battle' : category} Quiz</h1>
        <p className="text-purple-600 dark:text-purple-300">Q {currentQ + 1}/{questions.length} | Score: {score} | Time: {timer}s | Lifelines: {lifelines}</p>
      </div>
      {q.image_desc && (
        <div className="relative">
          {imageLoading && <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded">Loading Image...</div>}
          <img
            src={`https://source.unsplash.com/300/200/?${q.image_desc}`}
            alt="Quiz Image"
            className="w-full rounded shadow-md"
            onLoad={() => setImageLoading(false)}
            onError={handleImageError}
          />
        </div>
      )}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md transition-colors duration-200">
        <p className="text-lg font-medium mb-4 text-black dark:text-white">{q.question}</p>
        <div className="space-y-2">
          {q.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => submitAnswer(i)}
              className={`w-full p-3 rounded text-left ${
                selected === i ? 'border-2 border-purple-500' : 'bg-purple-100 dark:bg-gray-700 hover:bg-purple-200 dark:hover:bg-gray-600'
              } text-black dark:text-white transition-colors duration-200`}
            >
              {opt}
            </button>
          ))}
        </div>
        {selected !== null && (
          <button
            onClick={confirmAnswer}
            className="w-full mt-4 bg-green-600 text-white py-2 rounded hover:bg-green-700"
          >
            Confirm Answer
          </button>
        )}
      </div>
      <div className="flex justify-between">
        <button onClick={useLifeline} disabled={lifelines === 0} className="bg-yellow-500 text-white px-4 py-2 rounded disabled:opacity-50">
          Hint (50/50)
        </button>
        <button onClick={() => nextQuestion(false)} className="bg-gray-300 dark:bg-gray-600 px-4 py-2 rounded text-black dark:text-white">
          Skip
        </button>
      </div>
    </div>
  );
}