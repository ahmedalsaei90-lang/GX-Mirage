import React from 'react';
import { useState } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../hooks/useAuth';

export function Store() {  // Named export (no default)
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const packs = [
    { coins: 5, usd: 1.00, id: '5coins' },
    { coins: 100, usd: 10.00, id: '100coins' },
    { coins: 500, usd: 40.00, id: '500coins' },
    { coins: 0, usd: 5.00, id: 'adfree' }  // Ad-free
  ];

  const buyPack = async (pack) => {
    if (!user) {
      setError('Login to buy!');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('create-checkout-session', {
        body: JSON.stringify({ packId: pack.id, userId: user.id })
      });
      console.error('Invoke full error:', invokeError);
      if (invokeError) {
        setError(invokeError.message);
        throw invokeError;
      }
      if (data && data.sessionId) {
        window.location.href = `https://checkout.stripe.com/pay/${data.sessionId}`;
      } else {
        setError('No session ID returned – try again.');
      }
    } catch (error) {
      setError(error.message || 'Buy failed – check console.');
      console.error('Buy error:', error);
    }
    setLoading(false);
  };

  if (!user) return <div className="p-4 text-purple-600">Login to buy coins!</div>;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-3xl font-bold text-purple-700">Coin Store (USD)</h1>
      <p className="text-purple-600">Current Coins: {user.coins} 💰</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {packs.map((pack) => (
          <div key={pack.id} className="bg-white p-4 rounded-lg shadow-md text-center">
            <p>{pack.coins ? `${pack.coins} Coins Pack` : 'Remove Ads (Lifetime)'}</p>
            <p className="text-3xl">${pack.usd}</p>
            <button onClick={() => buyPack(pack)} disabled={loading} className="bg-purple-600 text-white px-4 py-2 rounded mt-2 disabled:opacity-50">
              {loading ? 'Processing...' : 'Buy Now'}
            </button>
          </div>
        ))}
      </div>
      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
}