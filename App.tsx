import React from 'react';

const App: React.FC = () => {
  const appStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#282c34',
    color: 'white',
    textAlign: 'center',
    fontFamily: 'Arial, sans-serif',
  };

  const headingStyle: React.CSSProperties = {
    fontSize: '5rem',
    fontWeight: 'bold',
  };

  return (
    <div style={appStyle}>
      <h1 style={headingStyle}>Welcome to Gram GPT!</h1>
    </div>
  );
};

export default App;
