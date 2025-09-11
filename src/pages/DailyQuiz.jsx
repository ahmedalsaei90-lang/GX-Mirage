import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateQuestions } from '../services/openai';
import { supabase } from '../supabase';
import { useAuth } from '../hooks/useAuth';

export function DailyQuiz() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(30);
  const [loading, setLoading] = useState(true);
  const [gameEnded, setGameEnded] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null); // For confirm button

  useEffect(() => {
    if (!user || !user.id) {
      console.log('User not authenticated, redirecting to Home');
      alert('Please log in to play the Daily Quiz.');
      navigate('/');
      return;
    }

    console.log('Starting daily quiz fetch for user:', user.id);
    const fetchDailyQuiz = async () => {
      try {
        const now = new Date();
        const today = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()).toISOString();
        console.log('Checking daily status for:', today);
        const { data: dailyData, error: dailyError } = await supabase
          .from('daily_quizzes')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (dailyError) {
          console.error('Supabase daily quiz error:', dailyError.message);
          alert('Error checking daily status—try again later.');
          navigate('/');
          return;
        }
        if (dailyData && dailyData.completed_at && new Date(dailyData.completed_at).toISOString().split('T')[0] === today.split('T')[0]) {
          console.log('Daily quiz already completed:', dailyData.completed_at);
          alert('Daily quiz already completed today!');
          navigate('/');
          return;
        }
        console.log('Generating new questions...');
        const newQuestions = await generateQuestions('Mixed', 'en', 5, 'medium');
        if (!newQuestions || newQuestions.length === 0) {
          throw new Error('No questions generated from OpenAI');
        }
        console.log('Questions generated with image_desc:', newQuestions.map(q => q.image_desc));
        setQuestions(newQuestions);
      } catch (error) {
        console.error('Daily quiz fetch error:', error.message);
        alert('Failed to load daily quiz—check your internet or API key.');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchDailyQuiz();
  }, [user, navigate]);

  useEffect(() => {
    if (timer > 0 && !gameEnded && questions.length > 0) {
      const id = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(id);
    } else if (timer === 0 && currentQ < questions.length - 1) {
      nextQuestion(false);
    } else if (timer === 0 && currentQ === questions.length - 1) {
      endGame();
    }
  }, [timer, gameEnded, currentQ, questions.length]);

  const nextQuestion = (correct = false) => {
    if (correct) {
      setScore(score + 20);
    }
    setSelectedAnswer(null); // Reset selection
    const newCurrentQ = currentQ + 1;
    setCurrentQ(newCurrentQ);
    setTimer(30);
    if (newCurrentQ === questions.length) {
      endGame();
    }
  };

  const endGame = async () => {
    setGameEnded(true);
    if (user) {
      const totalScore = score;
      await supabase.from('daily_quizzes').insert({
        user_id: user.id,
        completed_at: new Date().toISOString(),
        score: totalScore
      });
      await supabase.from('users').update({ coins: (user.coins || 100) + 100, score: (user.score || 0) + totalScore }).eq('id', user.id);
      await supabase.from('leaderboards').upsert(
        { user_id: user.id, category: 'Daily', score: totalScore },
        { onConflict: 'user_id,category' }
      );
      alert(`Daily Quiz Complete! +100 coins | Score: ${totalScore} pts`);
      navigate('/');
    }
  };

  const handleAnswerSelect = (index) => {
    setSelectedAnswer(index);
  };

  const confirmAnswer = () => {
    if (selectedAnswer !== null) {
      const correct = selectedAnswer === questions[currentQ]?.correct;
      nextQuestion(correct);
    }
  };

  if (loading) return <div className="p-4 text-purple-700 dark:text-white text-center">Loading Daily Quiz...</div>;
  if (gameEnded) return <div className="p-4 text-purple-700 dark:text-white text-center">Quiz Ended – Check Profile!</div>;

  const q = questions[currentQ] || {};

  return (
    <div className="p-4 max-w-md mx-auto space-y-4 bg-white dark:bg-gray-800 min-h-screen transition-colors duration-200">
      <h1 className="text-2xl font-bold text-purple-700 dark:text-purple-300 text-center">Daily Quiz</h1>
      <p className="text-purple-600 dark:text-purple-300 text-center">Q {currentQ + 1}/5 | Score: {score} | Time: {timer}s</p>
      {q.image_desc && (
        <div className="relative">
          <img
            src={`https://source.unsplash.com/300/200/?${q.image_desc}`}
            alt="Daily Quiz"
            className="w-full rounded shadow-md"
            onError={(e) => { e.target.src = 'https://picsum.photos/300/200?random'; }}
          />
        </div>
      )}
      <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-md">
        <p className="text-lg font-medium mb-4 text-black dark:text-white">{q.question || 'No question available'}</p>
        <div className="space-y-2">
          {q.options ? q.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleAnswerSelect(i)}
              className={`w-full p-3 rounded text-left bg-purple-100 dark:bg-gray-600 text-black dark:text-white hover:bg-purple-200 dark:hover:bg-gray-500 transition-colors duration-200 ${selectedAnswer === i ? 'border-2 border-purple-500' : ''}`}
            >
              {opt}
            </button>
          )) : <p className="text-red-600 dark:text-red-300">Options not loaded</p>}
        </div>
        {selectedAnswer !== null && (
          <button
            onClick={confirmAnswer}
            className="w-full mt-4 bg-green-600 text-white py-2 rounded hover:bg-green-700"
          >
            Confirm Answer
          </button>
        )}
      </div>
    </div>
  );
}