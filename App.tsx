import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { auth, onAuthStateChanged } from './services/firebase';
import AuthPage from './AuthPage';
import ChatPage from './ChatPage';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  if (loading) {
    // A simple loading indicator
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>লোড হচ্ছে...</div>;
  }

  return user ? <ChatPage user={user} /> : <AuthPage />;
};

export default App;
