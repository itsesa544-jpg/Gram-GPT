import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, GenerateContentResponse, Part, Modality } from "@google/genai";
import { GramGptLogo, HistoryIcon, ImageIcon, DownloadIcon, SendIcon } from './components/IconComponents';

type MessagePart = {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
};

type Message = {
  role: 'user' | 'model';
  parts: MessagePart[];
};

const App: React.FC = () => {
  const [history, setHistory] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [history, loading]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setImageBase64(base64String);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleDownload = (part: MessagePart) => {
    if (part.text) {
        const blob = new Blob([part.text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'response.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } else if (part.inlineData) {
        const a = document.createElement('a');
        const mimeType = part.inlineData.mimeType;
        const extension = mimeType.split('/')[1] || 'png';
        a.href = `data:${mimeType};base64,${part.inlineData.data}`;
        a.download = `generated-image.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt && !selectedImage) return;

    setLoading(true);
    setError(null);

    const userMessage: Message = { role: 'user', parts: [] };
    if (prompt) userMessage.parts.push({ text: prompt });
    if (imageBase64 && selectedImage) {
        userMessage.parts.push({ inlineData: { mimeType: selectedImage.type, data: imageBase64 } });
    }
    
    setHistory(prev => [...prev, userMessage]);
    
    // Clear inputs after adding to history
    const currentPrompt = prompt;
    const currentSelectedImage = selectedImage;
    const currentImageBase64 = imageBase64;
    setPrompt('');
    setSelectedImage(null);
    setImageBase64(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const isImageGenerationRequest = /আঁকো|আঁকুন|তৈরি কর|ছবি দাও|generate|draw|create an image/i.test(currentPrompt);

      let response: GenerateContentResponse;

      if (isImageGenerationRequest && !currentSelectedImage) {
        response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts: [{ text: currentPrompt }] },
          config: { responseModalities: [Modality.IMAGE] },
        });
      } else {
        const contents: { parts: Part[] } = { parts: [] };
        contents.parts.push({ text: currentPrompt });
        if (currentSelectedImage && currentImageBase64) {
          contents.parts.push({
            inlineData: { data: currentImageBase64, mimeType: currentSelectedImage.type },
          });
        }
        response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents,
        });
      }

      const modelResponse: Message = { role: 'model', parts: [] };
      if (response.candidates && response.candidates.length > 0) {
        const candidate = response.candidates[0];
        if(candidate.content.parts) {
            candidate.content.parts.forEach(part => {
                if (part.text) {
                    modelResponse.parts.push({ text: part.text });
                } else if (part.inlineData) {
                    modelResponse.parts.push({
                        inlineData: {
                            data: part.inlineData.data,
                            mimeType: part.inlineData.mimeType,
                        }
                    });
                }
            });
        }
      } else {
         const text = response.text;
         if (text) {
             modelResponse.parts.push({ text });
         } else {
            throw new Error("No content in response");
         }
      }

      setHistory(prev => [...prev, modelResponse]);
    } catch (err) {
      console.error(err);
      setError('দুঃখিত, একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।');
       // Restore user message on error
      setHistory(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };
  
  // Styles
  const appContainerStyle: React.CSSProperties = { height: '100%', boxSizing: 'border-box' };
  const chatContainerStyle: React.CSSProperties = { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'white', overflow: 'hidden' };
  const headerStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', padding: '1rem', borderBottom: '1px solid #e5e7eb', flexShrink: 0 };
  const titleStyle: React.CSSProperties = { marginLeft: '0.75rem', fontSize: '1.25rem', fontWeight: 600, color: '#1e293b' };
  const historyButtonStyle: React.CSSProperties = { marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#475569' };
  const chatAreaStyle: React.CSSProperties = { flexGrow: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' };
  const placeholderContainerStyle: React.CSSProperties = { flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center'};
  const placeholderTextStyle: React.CSSProperties = { color: '#64748b', textAlign: 'center', maxWidth: '400px' };
  const messageBubbleStyle = (role: 'user' | 'model'): React.CSSProperties => ({
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '85%',
    alignSelf: role === 'user' ? 'flex-end' : 'flex-start',
  });
  const messageContentStyle = (role: 'user' | 'model'): React.CSSProperties => ({
    padding: '0.75rem 1rem',
    borderRadius: '12px',
    backgroundColor: role === 'user' ? '#22c55e' : '#f1f5f9',
    color: role === 'user' ? 'white' : '#1e293b',
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
  });
  const formStyle: React.CSSProperties = { padding: '1rem', borderTop: '1px solid #e5e7eb', backgroundColor: '#f8fafc', flexShrink: 0 };
  const inputContainerStyle: React.CSSProperties = { display: 'flex', alignItems: 'flex-start', gap: '0.75rem' };
  const textareaStyle: React.CSSProperties = { flexGrow: 1, padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', resize: 'none', minHeight: '44px', maxHeight: '200px', fontFamily: 'inherit', fontSize: '1rem' };
  const submitButtonStyle: React.CSSProperties = { height: '44px', width: '44px', border: 'none', borderRadius: '8px', backgroundColor: '#22c55e', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
  const imageButtonStyle: React.CSSProperties = { height: '44px', width: '44px', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: 'white', cursor: 'pointer', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' };
  const selectedImagePreviewStyle: React.CSSProperties = { fontSize: '0.875rem', color: '#475569', padding: '0.5rem', backgroundColor: '#e2e8f0', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' };
  const removeImageButtonStyle: React.CSSProperties = { background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' };

  return (
    <div style={appContainerStyle}>
      <div style={chatContainerStyle}>
        <header style={headerStyle}>
          <GramGptLogo />
          <h1 style={titleStyle}>গ্রাম জিপিটি - আপনার গ্রামীামীণ বন্ধু</h1>
          <button style={historyButtonStyle} aria-label="History"><HistoryIcon /></button>
        </header>

        <main ref={chatAreaRef} style={chatAreaStyle}>
          {history.length === 0 && !loading && (
            <div style={placeholderContainerStyle}>
                <p style={placeholderTextStyle}>গ্রামের গল্প, আবহাওয়ার খবর জানতে চান, বা কোনো ছবি আঁকতে বলুন...</p>
            </div>
          )}
          {history.map((msg, index) => (
            <div key={index} style={messageBubbleStyle(msg.role)}>
              <div style={messageContentStyle(msg.role)}>
                {msg.parts.map((part, partIndex) => (
                  <div key={partIndex}>
                    {part.text && <p style={{margin: 0}}>{part.text}</p>}
                    {part.inlineData && <img src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`} alt="Generated content" style={{ maxWidth: '100%', borderRadius: '8px', marginTop: '0.5rem' }} />}
                  </div>
                ))}
              </div>
              {msg.role === 'model' && (
                <button onClick={() => handleDownload(msg.parts[0])} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', marginTop: '0.25rem' }} aria-label="Download">
                    <DownloadIcon />
                </button>
              )}
            </div>
          ))}
          {loading && <div style={{...messageBubbleStyle('model'), alignSelf: 'flex-start'}}><div style={messageContentStyle('model')}>লোড হচ্ছে...</div></div>}
          {error && <div style={{...messageBubbleStyle('model'), alignSelf: 'flex-start'}}><div style={{...messageContentStyle('model'), backgroundColor: '#fee2e2', color: '#b91c1c'}}>{error}</div></div>}
        </main>

        <footer style={formStyle}>
          <form onSubmit={handleSubmit}>
            <div style={inputContainerStyle}>
              <button type="button" onClick={() => fileInputRef.current?.click()} style={imageButtonStyle} aria-label="Add Image"><ImageIcon /></button>
              <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" style={{ display: 'none' }} />
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
                placeholder="এখানে আপনার প্রশ্ন লিখুন..."
                rows={1}
                disabled={loading}
              />
              <button type="submit" style={submitButtonStyle} disabled={loading || (!prompt && !selectedImage)} aria-label="Send Message"><SendIcon/></button>
            </div>
             {selectedImage && (
                <div style={selectedImagePreviewStyle}>
                  <span>{selectedImage.name}</span>
                  <button onClick={() => { setSelectedImage(null); setImageBase64(null); }} style={removeImageButtonStyle}>&times;</button>
                </div>
              )}
          </form>
        </footer>
      </div>
    </div>
  );
};

export default App;