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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);
  
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${scrollHeight}px`;
    }
  }, [prompt]);

  // This effect handles scrolling when the virtual keyboard appears on mobile
  useEffect(() => {
    const handleResize = () => {
      // A brief timeout can help ensure the layout has settled before scrolling
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedImage(file);
    }
  };

  const handleAPISubmit = async (promptToSend: string, imageToSend: File | null) => {
    if (!promptToSend.trim() && !imageToSend) return;

    setLoading(true);
    setError(null);

    if (!process.env.API_KEY) {
      setError('API কী সেট করা নেই। অনুগ্রহ করে আপনার পরিবেশের চলক (environment variable) কনফিগার করুন।');
      setLoading(false);
      return;
    }

    const userParts: MessagePart[] = [];
    if (imageToSend) {
      const imagePart = await fileToGenerativePart(imageToSend);
      userParts.push({ inlineData: imagePart });
    }
    if (promptToSend.trim()) {
      userParts.push({ text: promptToSend.trim() });
    }

    const newUserMessage: Message = { role: 'user', parts: userParts };
    setMessages(prev => [...prev, newUserMessage]);

    // Clear inputs after capturing their values
    setPrompt('');
    setAttachedImage(null);
    if(fileInputRef.current) fileInputRef.current.value = '';

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const isImageGenerationRequest = /আঁকো|ছবি/.test(promptToSend);
        
        let model: string;
        const config: any = {};
        
        const mappedParts = userParts.map(part => {
            if (part.inlineData) {
                return { inlineData: part.inlineData };
            }
            return { text: part.text || '' };
        });

        const contents = { parts: mappedParts };

        if (isImageGenerationRequest) {
            model = 'gemini-2.5-flash-image';
            config.responseModalities = [Modality.IMAGE];
        } else {
            model = 'gemini-2.5-flash';
            config.systemInstruction = 'তুমি গ্রাম জিপিটি, গ্রামের মানুষের একজন বন্ধু ও সহায়ক। তোমার কাজ হলো কৃষি, আবহাওয়া, গ্রামের গল্প, গান এবং দৈনন্দিন জীবনের নানা বিষয়ে সহজ ভাষায় তথ্য ও পরামর্শ দেওয়া। প্রয়োজনে ছবি তৈরি করে বা বিশ্লেষণ করে সাহায্য করা।';
        }

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: model,
            contents: contents,
            config: config,
        });

        if (response.promptFeedback?.blockReason) {
            let reason = 'আপনার অনুরোধটি প্রক্রিয়া করা যায়নি।';
            if (response.promptFeedback.blockReason === 'SAFETY') {
                reason = 'নিরাপত্তার কারণে আপনার অনুরোধটি ব্লক করা হয়েছে।';
            }
            throw new Error(reason);
        }

        if (response.candidates && response.candidates.length > 0 && response.candidates[0].content?.parts?.length > 0) {
            const newModelMessage: Message = { role: 'model', parts: response.candidates[0].content.parts };
            setMessages(prev => [...prev, newModelMessage]);
        } else {
            throw new Error("মডেল থেকে কোনো উত্তর পাওয়া যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।");
        }
    } catch (err) {
      console.error(err);
      let userFriendlyError = 'দুঃখিত, একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।';
      if (err instanceof Error) {
        if (err.message.includes('API key not valid')) {
            userFriendlyError = 'আপনার API কী টি সঠিক নয়। অনুগ্রহ করে সঠিক কী প্রদান করুন।';
        } else if (err.message.includes('block') || err.message.includes('কোনো উত্তর পাওয়া যায়নি') || err.message.includes('প্রক্রিয়া করা যায়নি')) {
            userFriendlyError = err.message;
        }
      }
      setError(userFriendlyError);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSuggestionClick = (suggestionText: string) => {
    handleAPISubmit(suggestionText, null);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAPISubmit(prompt, attachedImage);
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

  return (
    <div className="app-container">
      <header className="header">
        <GramGptLogo />
        <h1 className="header-title">গ্রামজিপিটি</h1>
      </header>

      <main className="main-content">
        {messages.length === 0 && !loading ? (
          <div className="welcome-container">
            <h2 className="welcome-title">গ্রামজিপিটি</h2>
            <p className="welcome-subtitle">আপনার গ্রামীণ বন্ধু।</p>
            <div className="suggestion-grid">
              {suggestions.map((text, index) => (
                <button key={index} className="suggestion-button" onClick={() => handleSuggestionClick(text)}>{text}</button>
              ))}
            </div>
          </div>
        ) : (
          <div className="chat-container">
            {messages.map((msg, index) => (
              <div key={index} className={`message-bubble ${msg.role}`}>
                {msg.parts.map((part, partIndex) => {
                  if (part.inlineData) {
                    return (
                      <div key={partIndex} className="message-part-image-container">
                        <img src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`} alt="Generated content" className="message-part-image" />
                        {msg.role === 'model' && (
                           <button onClick={() => handleDownload(part)} className="download-button" aria-label="Download Image">
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
        {loading && <div className="loading-indicator">ভাবছি...</div>}
        {error && <div className="error-message">{error}</div>}
      </main>

      <footer className="footer">
        <form id="chat-form" onSubmit={handleSubmit} className="chat-form">
          <div className="textarea-container">
             {attachedImage && (
                <div className="image-preview-container">
                    <img src={URL.createObjectURL(attachedImage)} alt="Preview" className="image-preview" />
                    <button type="button" onClick={() => { setAttachedImage(null); if(fileInputRef.current) fileInputRef.current.value = ''; }} className="remove-image-button">
                        <CloseIcon />
                    </button>
                </div>
            )}
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              className="chat-textarea"
              placeholder="এখানে আপনার প্রশ্ন লিখুন বা ছবি যোগ করুন..."
              rows={1}
              disabled={loading}
            />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="attach-button" disabled={loading} aria-label="Attach image">
              <PaperclipIcon />
            </button>
            <input type="file" ref={fileInputRef} onChange={handleImageChange} style={{ display: 'none' }} accept="image/*" />
          </div>
          <button type="submit" className="submit-button" disabled={loading || (!prompt.trim() && !attachedImage)} aria-label="Send message">
            <SendIcon />
          </button>
        </form>
      </footer>
    </div>
  );
};

export default App;