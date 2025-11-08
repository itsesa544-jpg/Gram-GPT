
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";
import { GramGptLogo, DownloadIcon, SendIcon, PaperclipIcon, CloseIcon } from './components/IconComponents';

// --- Types ---
type InlineData = { data: string; mimeType: string; };
type MessagePart = { text?: string; inlineData?: InlineData; };
type Message = {
  role: 'user' | 'model';
  parts: MessagePart[];
};

// --- Helper Functions ---
const fileToGenerativePart = async (file: File): Promise<InlineData> => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    data: await base64EncodedDataPromise,
    mimeType: file.type,
  };
};

// --- Constants ---
const suggestions = [
  'আজকের আবহাওয়া কেমন?',
  'গ্রামের একটি সুন্দর গল্প বলো',
  'ধানক্ষেতের একটি ছবি আঁকো',
  'ফসলের রোগ নির্ণয় করতে সাহায্য করো',
];

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState('');
  const [attachedImage, setAttachedImage] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSuggestionClick = (suggestionText: string) => {
    setPrompt(suggestionText);
    // Use a timeout to ensure the state update is processed before submitting
    setTimeout(() => {
      (document.getElementById('chat-form') as HTMLFormElement)?.requestSubmit();
    }, 0);
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedImage(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt && !attachedImage) return;

    setLoading(true);
    setError(null);

    const userParts: MessagePart[] = [];
    if (attachedImage) {
      const imagePart = await fileToGenerativePart(attachedImage);
      userParts.push({ inlineData: imagePart });
    }
    if (prompt) {
      userParts.push({ text: prompt });
    }

    const newUserMessage: Message = { role: 'user', parts: userParts };
    setMessages(prev => [...prev, newUserMessage]);

    // Clear inputs after capturing their values
    const currentPrompt = prompt;
    setPrompt('');
    setAttachedImage(null);
    if(fileInputRef.current) fileInputRef.current.value = '';

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // Keywords for image generation in Bengali: আঁকো (draw), ছবি (picture).
        const isImageGenerationRequest = /আঁকো|ছবি/.test(currentPrompt);
        
        let model: string;
        const config: any = {};
        let contents: any;
        
        const mappedParts = userParts.map(part => {
            if (part.inlineData) {
                return { inlineData: part.inlineData };
            }
            return { text: part.text || '' };
        });

        if (isImageGenerationRequest) {
            model = 'gemini-2.5-flash-image';
            config.responseModalities = [Modality.IMAGE];
            contents = { parts: mappedParts };
        } else {
            model = 'gemini-2.5-flash';
            config.systemInstruction = 'তুমি গ্রাম জিপিটি, গ্রামের মানুষের একজন বন্ধু ও সহায়ক। তোমার কাজ হলো কৃষি, আবহাওয়া, গ্রামের গল্প, গান এবং দৈনন্দিন জীবনের নানা বিষয়ে সহজ ভাষায় তথ্য ও পরামর্শ দেওয়া। প্রয়োজনে ছবি তৈরি করে বা বিশ্লেষণ করে সাহায্য করা।';
            contents = { parts: mappedParts };
        }

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: model,
            contents: contents,
            config: config,
        });

        if (response.candidates && response.candidates.length > 0 && response.candidates[0].content.parts.length > 0) {
            const newModelMessage: Message = { role: 'model', parts: response.candidates[0].content.parts };
            setMessages(prev => [...prev, newModelMessage]);
        } else if (response.text) {
            const newModelMessage: Message = { role: 'model', parts: [{ text: response.text }] };
            setMessages(prev => [...prev, newModelMessage]);
        } else {
            throw new Error("কোনো উত্তর পাওয়া যায়নি।");
        }
    } catch (err) {
      console.error(err);
      setError('দুঃখিত, একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDownload = (part: MessagePart) => {
    if(!part.inlineData) return;
    const { data, mimeType } = part.inlineData;
    const a = document.createElement('a');
    a.href = `data:${mimeType};base64,${data}`;
    const extension = mimeType.split('/')[1] || 'png';
    a.download = `gram-gpt-image.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  // --- Styles ---
  const appContainerStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f8fafc' };
  const headerStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', padding: '1rem', borderBottom: '1px solid #e5e7eb', backgroundColor: 'white', flexShrink: 0 };
  const titleStyle: React.CSSProperties = { marginLeft: '0.75rem', fontSize: '1.25rem', fontWeight: 600, color: '#1e293b' };
  const mainContentStyle: React.CSSProperties = { flexGrow: 1, overflowY: 'auto', padding: '1.5rem' };
  
  const welcomeContainerStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', textAlign: 'center' };
  const welcomeTitleStyle: React.CSSProperties = { color: '#1e293b', fontWeight: 700, fontSize: '2rem', marginBottom: '0.5rem' };
  const welcomeSubtitleStyle: React.CSSProperties = { color: '#475569', maxWidth: '450px', marginBottom: '2.5rem', lineHeight: '1.6' };
  const suggestionGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '1rem', width: '100%', maxWidth: '600px' };
  const suggestionButtonStyle: React.CSSProperties = { padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '12px', backgroundColor: 'white', cursor: 'pointer', textAlign: 'left', color: '#334155', fontWeight: 500, transition: 'background-color 0.2s, box-shadow 0.2s', fontSize: '0.9rem', lineHeight: '1.4' };
  
  const chatContainerStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '1rem' };
  const messageBubbleStyle = (role: 'user' | 'model'): React.CSSProperties => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    maxWidth: '80%',
    padding: '0.75rem 1rem',
    borderRadius: '1.25rem',
    alignSelf: role === 'user' ? 'flex-end' : 'flex-start',
    backgroundColor: role === 'user' ? '#22c55e' : '#e2e8f0',
    color: role === 'user' ? 'white' : '#1e293b',
  });
  const imageInChatStyle: React.CSSProperties = { maxWidth: '100%', height: 'auto', borderRadius: '1rem', marginTop: '0.5rem', position: 'relative' };
  const downloadButtonStyle: React.CSSProperties = { position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'rgba(0, 0, 0, 0.6)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
  
  const loadingIndicatorStyle: React.CSSProperties = { textAlign: 'center', color: '#475569', fontSize: '0.875rem' };
  const errorStyle: React.CSSProperties = { padding: '0.75rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '8px', textAlign: 'center' };
  
  const footerStyle: React.CSSProperties = { padding: '1rem 1.5rem', borderTop: '1px solid #e5e7eb', backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(8px)', flexShrink: 0 };
  const formStyle: React.CSSProperties = { display: 'flex', gap: '0.75rem', maxWidth: '800px', margin: '0 auto', alignItems: 'center' };
  const textareaContainerStyle: React.CSSProperties = { flexGrow: 1, position: 'relative' };
  const textareaStyle: React.CSSProperties = { width: '100%', padding: '0.75rem 2.5rem 0.75rem 1rem', border: '1px solid #cbd5e1', borderRadius: '24px', resize: 'none', fontFamily: 'inherit', fontSize: '1rem', minHeight: '48px', boxSizing: 'border-box' };
  const attachButtonStyle: React.CSSProperties = { position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' };
  const submitButtonStyle: React.CSSProperties = { height: '48px', width: '48px', border: 'none', borderRadius: '50%', backgroundColor: '#22c55e', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };
  
  const imagePreviewStyle: React.CSSProperties = { position: 'relative', display: 'inline-block', marginBottom: '0.5rem' };
  const previewImageStyle: React.CSSProperties = { maxHeight: '80px', borderRadius: '8px' };
  const removeImageButtonStyle: React.CSSProperties = { position: 'absolute', top: '-8px', right: '-8px', background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 };

  return (
    <div style={appContainerStyle}>
      <header style={headerStyle}>
        <GramGptLogo />
        <h1 style={titleStyle}>গ্রামজিপিটি</h1>
      </header>

      <main style={mainContentStyle}>
        {messages.length === 0 && !loading ? (
          <div style={welcomeContainerStyle}>
            <h2 style={welcomeTitleStyle}>গ্রামজিপিটি</h2>
            <p style={welcomeSubtitleStyle}>আপনার গ্রামীণ বন্ধু।</p>
            <div style={suggestionGridStyle}>
              {suggestions.map((text, index) => (
                <button key={index} style={suggestionButtonStyle} onClick={() => handleSuggestionClick(text)}>{text}</button>
              ))}
            </div>
          </div>
        ) : (
          <div style={chatContainerStyle}>
            {messages.map((msg, index) => (
              <div key={index} style={messageBubbleStyle(msg.role)}>
                {msg.parts.map((part, partIndex) => {
                  if (part.inlineData) {
                    return (
                      <div key={partIndex} style={{position: 'relative'}}>
                        <img src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`} alt="Generated content" style={imageInChatStyle} />
                        {msg.role === 'model' && (
                           <button onClick={() => handleDownload(part)} style={downloadButtonStyle} aria-label="Download Image">
                           <DownloadIcon />
                         </button>
                        )}
                      </div>
                    );
                  }
                  return <p key={partIndex} style={{ margin: 0 }}>{part.text}</p>;
                })}
              </div>
            ))}
             <div ref={chatEndRef} />
          </div>
        )}
        {loading && <div style={loadingIndicatorStyle}>ভাবছি...</div>}
        {error && <div style={errorStyle}>{error}</div>}
      </main>

      <footer style={footerStyle}>
        <form id="chat-form" onSubmit={handleSubmit} style={formStyle}>
          <div style={textareaContainerStyle}>
             {attachedImage && (
                <div style={imagePreviewStyle}>
                    <img src={URL.createObjectURL(attachedImage)} alt="Preview" style={previewImageStyle} />
                    <button type="button" onClick={() => { setAttachedImage(null); if(fileInputRef.current) fileInputRef.current.value = ''; }} style={removeImageButtonStyle}>
                        <CloseIcon />
                    </button>
                </div>
            )}
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              style={textareaStyle}
              placeholder="এখানে আপনার প্রশ্ন লিখুন বা ছবি যোগ করুন..."
              rows={1}
              disabled={loading}
            />
            <button type="button" onClick={() => fileInputRef.current?.click()} style={attachButtonStyle} disabled={loading} aria-label="Attach image">
              <PaperclipIcon />
            </button>
            <input type="file" ref={fileInputRef} onChange={handleImageChange} style={{ display: 'none' }} accept="image/*" />
          </div>
          <button type="submit" style={submitButtonStyle} disabled={loading || (!prompt && !attachedImage)} aria-label="Send message">
            <SendIcon />
          </button>
        </form>
      </footer>
    </div>
  );
};

export default App;
