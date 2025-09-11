import React from 'react';
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../supabase';
import { Link } from 'react-router-dom';

export function Profile() { // Named export
  const { user, loading, signUp, signIn, signOut } = useAuth();
  const [profile, setProfile] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [language, setLanguage] = useState('en');
  const [showLogin, setShowLogin] = useState(false);
  const [referralCode, setReferralCode] = useState(''); // For signup referral
  const [dailyStatus, setDailyStatus] = useState({ completed: false, score: 0 });

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        const { data: userData } = await supabase.from('users').select('*').eq('id', user.id).single();
        setProfile(userData || {
          email: user.email,
          coins: 100,
          rank: 1,
          score: 0,
          referral_code: 'GX-' + Math.floor(10000 + Math.random() * 90000).toString()
        });

        // Check daily quiz status
        const { data: dailyData } = await supabase.from('daily_quizzes').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).single();
        const now = new Date();
        const today = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()).toISOString();
        if (dailyData && dailyData.completed_at && new Date(dailyData.completed_at).toISOString().split('T')[0] === today.split('T')[0]) {
          setDailyStatus({ completed: true, score: dailyData.score });
        } else {
          setDailyStatus({ completed: false, score: 0 });
        }
      };
      fetchProfile();

      const channel = supabase.channel('user-profile');
      channel
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${user.id}` }, (payload) => {
          setProfile(payload.new);
        })
        .subscribe();

      return () => channel.unsubscribe();
    }
  }, [user]);

  const updateLang = async (newLang) => {
    setLanguage(newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    if (user) {
      await supabase.from('users').update({ lang: newLang }).eq('id', user.id);
    }
  };

  const handleSignIn = async () => {
    try {
      await signIn(email, password);
      setShowLogin(false);
    } catch (error) {
      alert('Login error: ' + error.message);
    }
  };

  const handleSignUp = async () => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { referral_code: referralCode } } });
      if (error) throw error;
      alert('Signed up! Check email to verify.');
    } catch (error) {
      alert('Signup error: ' + error.message);
    }
  };

  if (loading) return <div className="p-4 text-purple-700 dark:text-white">Loading...</div>;

  if (!user) {
    return (
      <div className="p-4 max-w-md mx-auto space-y-4">
        <h1 className="text-2xl font-bold text-purple-700 dark:text-purple-300 text-center">Login to GX-Mirage</h1>
        <button onClick={() => setShowLogin(!showLogin)} className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700">
          {showLogin ? 'Cancel' : 'Show Login Form'}
        </button>
        {showLogin && (
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md space-y-2">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded focus:border-purple-500"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded focus:border-purple-500"
            />
            <input
              type="text"
              placeholder="Referral Code (Optional)"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              className="w-full p-2 border rounded focus:border-purple-500 mb-2"
            />
            <button onClick={handleSignIn} className="w-full bg-green-600 text-white py-2 rounded">
              Login
            </button>
            <button onClick={handleSignUp} className="w-full bg-blue-600 text-white py-2 rounded">
              Sign Up
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-purple-700 dark:text-purple-300">Your Profile</h1>
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md space-y-2">
        <p className="text-black dark:text-white"><strong>Email:</strong> {profile?.email || user.email}</p>
        <p className="text-black dark:text-white"><strong>Coins:</strong> {profile?.coins || user.coins || 100} 💰</p>
        <p className="text-black dark:text-white"><strong>Rank:</strong> #{profile?.rank || user.rank || 1} | <strong>Total Score:</strong> {profile?.score || user.score || 0}</p>
        <p className="text-black dark:text-white"><strong>Referral Code:</strong> {profile?.referral_code || 'GX-DEFAULT'} (Share for 50 coins!)</p>
        <p className="text-black dark:text-white">
          Daily Quiz: {dailyStatus.completed ? `Completed today! Score: ${dailyStatus.score}` : 
            <Link to="/daily-quiz" className="text-blue-600 dark:text-blue-300">Play now for +100 coins!</Link>}
        </p>
      </div>
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
        <h2 className="text-purple-700 dark:text-purple-300 font-semibold mb-2">Language</h2>
        <label className="block mb-1">
          <input type="radio" name="lang" checked={language === 'en'} onChange={() => updateLang('en')} className="mr-2" />
          English
        </label>
        <label className="block mb-1">
          <input type="radio" name="lang" checked={language === 'ar'} onChange={() => updateLang('ar')} className="mr-2" />
          Arabic (RTL)
        </label>
      </div>
      <button onClick={signOut} className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700">
        Logout
      </button>
    </div>
  );
}