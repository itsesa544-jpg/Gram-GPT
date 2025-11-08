import React from 'react';
import { GramGptLogo, HistoryIcon, ImageIcon } from './components/IconComponents';

const App: React.FC = () => {
  const chatWindowStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    maxWidth: '800px',
    margin: '0 auto',
    backgroundColor: '#ffffff',
    boxShadow: '0 0 15px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    padding: '1rem 1.5rem',
    borderBottom: '1px solid #e0e0e0',
  };
  
  const titleContainerStyle: React.CSSProperties = {
    marginLeft: '1rem',
  };

  const mainTitleStyle: React.CSSProperties = {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: '#1e293b',
    margin: 0,
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    color: '#475569',
    margin: 0,
  };

  const historyButtonStyle: React.CSSProperties = {
    marginLeft: 'auto',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0.5rem',
    borderRadius: '50%',
  };
  
  const chatBodyStyle: React.CSSProperties = {
    flexGrow: 1,
    padding: '1.5rem',
    overflowY: 'auto',
  };
  
  const inputAreaContainerStyle: React.CSSProperties = {
    padding: '1.5rem',
    borderTop: '1px solid #e0e0e0',
    backgroundColor: '#f8fafc',
  };

  const inputWrapperStyle: React.CSSProperties = {
    position: 'relative',
    backgroundColor: 'white',
    padding: '0.75rem',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
  };

  const textareaStyle: React.CSSProperties = {
    width: '100%',
    border: 'none',
    outline: 'none',
    resize: 'none',
    fontSize: '1rem',
    fontFamily: "'Hind Siliguri', sans-serif",
    minHeight: '50px',
    backgroundColor: 'transparent',
  };
  
  const exampleTextStyle: React.CSSProperties = {
    fontSize: '0.8rem',
    color: '#64748b',
    margin: '0.5rem 0 0 0.25rem',
  };
  
  const buttonContainerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '1rem',
  };
  
  const addImageButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.6rem 1rem',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    backgroundColor: 'white',
    color: '#334155',
    fontSize: '0.9rem',
    fontWeight: 500,
    cursor: 'pointer',
  };

  const submitButtonStyle: React.CSSProperties = {
    padding: '0.7rem 1.5rem',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: '#10b981',
    color: 'white',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
  };

  return (
    <div style={chatWindowStyle}>
      <header style={headerStyle}>
        <GramGptLogo />
        <div style={titleContainerStyle}>
          <h1 style={mainTitleStyle}>Gram GPT</h1>
          <p style={subtitleStyle}>গ্রাম জিপিটি - আপনার গ্রামীণ বন্ধু</p>
        </div>
        <button style={historyButtonStyle} aria-label="View History">
          <HistoryIcon />
        </button>
      </header>

      <main style={chatBodyStyle}>
        {/* Chat messages will appear here */}
      </main>

      <footer style={inputAreaContainerStyle}>
        <div style={inputWrapperStyle}>
          <textarea
            style={textareaStyle}
            placeholder="গ্রামের গল্প, আবহাওয়ার খবর জানতে চান, বা কোনো ছবি আঁকতে বলুন..."
            rows={3}
          />
           <p style={exampleTextStyle}>উদাহরণ: 'ধান গাছে বাদামী দাগ পড়েছে, কী করব?' অথবা 'বর্ষার বিকেলে একটি গ্রামের দৃশ্য আঁকো।'</p>
        </div>
        <div style={buttonContainerStyle}>
           <button style={addImageButtonStyle}>
              <ImageIcon />
              <span>ছবি যোগ করুন</span>
           </button>
           <button style={submitButtonStyle}>
              উত্তর খুঁজুন
           </button>
        </div>
      </footer>
    </div>
  );
};

export default App;