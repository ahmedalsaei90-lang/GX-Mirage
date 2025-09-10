import React from 'react';
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../supabase';

export function Profile() {
  const { user, loading, signUp, signIn, signOut } = useAuth();
  const [profile, setProfile] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [language, setLanguage] = useState('en');
  const [showLogin, setShowLogin] = useState(false);
  const [referralCode, setReferralCode] = useState(''); // For signup referral
  const [appliedReferral, setAppliedReferral] = useState(false); // Flag to prevent multiple applies

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        try {
          const { data, error } = await supabase.from('users').select('*').eq('id', user.id).maybeSingle();
          if (error) {
            console.error('Profile fetch error:', error.message);
            alert('Error loading profile—try refreshing.');
            return;
          }
          if (!data) {
            const insertRes = await supabase.from('users').insert({
              id: user.id,
              email: user.email,
              coins: 100,
              rank: 1,
              score: 0,
              lang: 'en'
            });
            if (insertRes.error) console.error('Profile insert error:', insertRes.error.message);
            const { data: newData, error: fetchError } = await supabase.from('users').select('*').eq('id', user.id).maybeSingle();
            if (fetchError) console.error('New profile fetch error:', fetchError.message);
            setProfile(newData);
          } else {
            setProfile(data);
          }
        } catch (err) {
          console.error('Unexpected profile fetch error:', err);
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

  useEffect(() => {
    // Handle referral on signup (only once)
    if (referralCode && user && !appliedReferral) {
      setAppliedReferral(true); // Set flag to true
      const applyReferral = async () => {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('id, coins')
            .eq('referral_code', referralCode)
            .single();
          if (error) {
            console.error('Referral lookup error:', error.message, 'Code:', referralCode);
            alert('Referral error: Invalid code or server issue.');
            return;
          }
          if (data && data.id !== user.id) {
            await supabase.from('users').update({ coins: data.coins + 50 }).eq('id', data.id);
            await supabase.from('users').update({ coins: user.coins + 50 }).eq('id', user.id);
            const { error: txError } = await supabase.from('transactions').insert([
              { user_id: data.id, type: 'referral', amount: 50 },
              { user_id: user.id, type: 'referral', amount: 50 }
            ]);
            if (txError) console.error('Transaction insert error:', txError.message); // Log but don't alert
            setReferralCode(''); // Clear after use
            alert('Referral applied! +50 coins for both!');
          } else {
            alert('Invalid referral code or self-referral.');
          }
        } catch (err) {
          console.error('Unexpected referral error:', err);
          alert('Referral failed—try again later.');
        }
      };
      applyReferral();
    }
  }, [referralCode, user, appliedReferral]);

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

  if (loading) return <div className="p-4 text-purple-600">Loading...</div>;

  if (!user) {
    return (
      <div className="p-4 max-w-md mx-auto space-y-4">
        <h1 className="text-2xl font-bold text-purple-700 text-center">Login to GX-Mirage</h1>
        <button onClick={() => setShowLogin(!showLogin)} className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700">
          {showLogin ? 'Cancel' : 'Show Login Form'}
        </button>
        {showLogin && (
          <div className="bg-white p-4 rounded-lg shadow-md space-y-2">
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
      <h1 className="text-2xl font-bold text-purple-700">Your Profile</h1>
      <div className="bg-white p-4 rounded-lg shadow-md space-y-2">
        <p><strong>Email:</strong> {profile?.email || user.email}</p>
        <p><strong>Coins:</strong> {profile?.coins || 100} 💰</p>
        <p><strong>Rank:</strong> #{profile?.rank || 1} | <strong>Total Score:</strong> {profile?.score || 0}</p>
        <p><strong>Referral Code:</strong> {profile?.referral_code || 'GX-DEFAULT'} (Share for 50 coins!)</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-purple-700 font-semibold mb-2">Language</h2>
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