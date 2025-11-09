import React, { useState } from 'react';
import {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from './services/firebase';
import { GramGptLogo } from './components/IconComponents';
import { FirebaseError } from 'firebase/app';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
        setError('অনুগ্রহ করে ইমেল এবং পাসওয়ার্ড দিন।');
        return;
    }
    setLoading(true);
    setError(null);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case 'auth/invalid-email':
            setError('অনুগ্রহ করে একটি সঠিক ইমেল ঠিকানা লিখুন।');
            break;
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            setError('ইমেল অথবা পাসওয়ার্ড ভুল হয়েছে।');
            break;
          case 'auth/email-already-in-use':
            setError('এই ইমেল ঠিকানাটি ইতিমধ্যেই ব্যবহার করা হয়েছে।');
            break;
          case 'auth/weak-password':
            setError('পাসওয়ার্ডটি কমপক্ষে ৬ অক্ষরের হতে হবে।');
            break;
          default:
            setError('একটি সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
        }
      } else {
        setError('একটি অপ্রত্যাশিত সমস্যা হয়েছে।');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <GramGptLogo />
        <h2 className="auth-title">গ্রামজিপিটি-তে স্বাগতম</h2>
        <p className="auth-subtitle">
          {isLogin ? 'আপনার একাউন্টে লগইন করুন।' : 'শুরু করতে একটি একাউন্ট তৈরি করুন।'}
        </p>
        <form onSubmit={handleAuthAction} className="auth-form">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ইমেল"
            className="auth-input"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="পাসওয়ার্ড"
            className="auth-input"
            required
          />
          {error && <div className="error-message" style={{ margin: 0, width: '100%' }}>{error}</div>}
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'প্রসেস হচ্ছে...' : (isLogin ? 'লগইন করুন' : 'একাউন্ট বানান')}
          </button>
        </form>
        <p className="auth-toggle">
          {isLogin ? 'আপনার কোনো একাউন্ট নেই?' : 'ইতিমধ্যেই একাউন্ট আছে?'}
          <a href="#" onClick={(e) => { e.preventDefault(); setIsLogin(!isLogin); setError(null); }} className="auth-toggle-link">
            {isLogin ? ' এখানে বানান' : ' এখানে লগইন করুন'}
          </a>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
