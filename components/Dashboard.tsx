import React, { useState, useRef, useEffect, useMemo } from 'react';
import { GoogleGenAI, Modality, FunctionDeclaration, Type } from '@google/genai';
import { HistoryIcon, GeminiIcon, ImageIcon, XCircleIcon, SunIcon, MoonIcon, DownloadIcon } from './IconComponents';
import HistoryPage from './HistoryPage';

declare const marked: any;

interface HistoryItem {
  prompt: string;
  response: {
    text: string;
    generatedImage?: string;
  };
  image?: string; // User-uploaded image
}

type Theme = 'light' | 'dark';

// Mock function to simulate a weather API call
const getWeather = (location: string) => {
    // In a real application, you would fetch this from a weather API
    const weatherData: { [key: string]: any } = {
        'ঢাকা': { location: 'ঢাকা', temperature: '32°C', condition: 'বজ্রসহ বৃষ্টি', humidity: '80%' },
        'chittagong': { location: 'চট্টগ্রাম', temperature: '29°C', condition: 'মেঘলা আকাশ', humidity: '85%' },
        'rajshahi': { location: 'রাজশাহী', temperature: '35°C', condition: 'রৌদ্রোজ্জ্বল', humidity: '70%' },
    };
    const key = Object.keys(weatherData).find(k => location.toLowerCase().includes(k.toLowerCase()));
    return JSON.stringify(key ? weatherData[key] : { location, temperature: 'unknown', condition: 'ডেটা পাওয়া যায়নি' });
};

const getWeatherFunctionDeclaration: FunctionDeclaration = {
  name: 'getWeather',
  parameters: {
    type: Type.OBJECT,
    description: 'নির্দিষ্ট এলাকার বর্তমান আবহাওয়ার তথ্য প্রদান করে।',
    properties: {
      location: {
        type: Type.STRING,
        description: 'যে এলাকার আবহাওয়ার তথ্য প্রয়োজন, যেমন: ঢাকা, চট্টগ্রাম।',
      },
    },
    required: ['location'],
  },
};

const Dashboard: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState<{ file: File; dataUrl: string } | null>(null);
  const [generatedContent, setGeneratedContent] = useState<{ text: string; generatedImage?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentView, setCurrentView] = useState<'generate' | 'history'>('generate');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [theme, setTheme] = useState<Theme>('light');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (systemPrefersDark) {
      setTheme('dark');
    }
  }, []);

  useEffect(() => {
    const body = document.body;
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      body.classList.add('bg-gray-900');
      body.classList.remove('bg-[#F8FBF8]');
    } else {
      document.documentElement.classList.remove('dark');
      body.classList.add('bg-[#F8FBF8]');
      body.classList.remove('bg-gray-900');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleThemeSwitch = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage({ file, dataUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleDownloadImage = (dataUrl: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    const mimeType = dataUrl.split(';')[0].split(':')[1];
    const extension = mimeType.split('/')[1] || 'png';
    link.download = `gram-gpt-image-${Date.now()}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  const handleGenerate = async () => {
    if (!prompt && !image) {
      setError('দয়া করে আপনার প্রশ্নটি লিখুন অথবা একটি ছবি দিন।');
      return;
    }
    setIsLoading(true);
    setError('');
    setGeneratedContent(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const model = 'gemini-2.5-flash-image';
      
      const parts: any[] = [];
      const shouldGenerateImage = prompt.toLowerCase().includes('আঁকো') || prompt.toLowerCase().includes('ছবি');

      if(image) {
        parts.push({
          inlineData: {
            mimeType: image.file.type,
            data: image.dataUrl.split(',')[1]
          }
        });
      }
      if(prompt) {
        parts.push({ text: prompt });
      }
      
      let response = await ai.models.generateContent({
        model,
        contents: { parts },
        // FIX: Moved `tools` inside the `config` object as per Gemini API guidelines.
        config: {
          tools: [{ functionDeclarations: [getWeatherFunctionDeclaration] }],
          responseModalities: shouldGenerateImage ? [Modality.IMAGE] : [],
          systemInstruction: `You are 'Gram GPT,' a helpful AI assistant for people in the villages of Bangladesh. Your goal is to provide useful information and creative content. Answer all questions in clear, simple Bengali. Your capabilities include:
1. Answering questions on agriculture, weather, local stories, and general knowledge.
2. When a user asks you to draw or create a picture (e.g., 'draw a picture of a sunset over a river', 'আঁকো', 'ছবি'), you MUST generate an image.
3. For complex topics, you can choose to generate an image to help explain your answer.
4. When a user asks about the weather (e.g., 'what is the weather in Dhaka?', 'ঢাকার আবহাওয়া কেমন?'), you MUST use the 'getWeather' function tool to get the data. After you receive the weather data, provide a helpful summary in Bengali AND generate an image that visually represents those weather conditions.

IMPORTANT RULE: If the user asks who created you ('তোমাকে কে বানিয়েছে'), you MUST respond ONLY with the following information, formatted with Markdown.

---

### 🌐 IM Softworks
**বাংলা:**
IM Softworks একটি উদীয়মান সফটওয়্যার কোম্পানি, যা ভবিষ্যতমুখী প্রযুক্তি ও সৃজনশীল সমাধানের মাধ্যমে ক্লায়েন্টদের ব্যবসায়িক সাফল্যে সহায়তা করে।

---

### 👋 About Me
![Mohammad Esa Ali](https://res.cloudinary.com/dlklqihg6/image/upload/v1760308052/kkchmpjdp9izcjfvvo4k.jpg)
Hello, I am Mohammad Esa Ali, a passionate and creative tech enthusiast.

---

### 📜 Source
**Branch:** main
**Last Update:** Refactored components and improved UI responsiveness.

---
**Contact us**
im.softwark.team@gmail.com
Copyright © IM Softwark`,
        },
      });

      if (response.functionCalls) {
        const fc = response.functionCalls[0];
        if (fc.name === 'getWeather') {
            // FIX: Cast `fc.args.location` to string as it is of type `unknown`.
            const weatherResult = getWeather(fc.args.location as string);
            
            response = await ai.models.generateContent({
                model,
                contents: [
                    { parts: [{ text: prompt }] },
                    { 
                        parts: [{
                            functionResponse: {
                                name: 'getWeather',
                                response: { result: weatherResult }
                            }
                        }]
                    }
                ],
                config: {
                    responseModalities: [Modality.IMAGE] // Force image generation for weather
                }
            });
        }
      }

      let responseText = '';
      let generatedImage: string | undefined = undefined;
      
      if (response.candidates && response.candidates.length > 0) {
        const content = response.candidates[0].content;
        if (content && content.parts) {
          for (const part of content.parts) {
            if (part.text) {
              responseText += part.text;
            } else if (part.inlineData) {
              if (!generatedImage) { 
                generatedImage = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
              }
            }
          }
        }
      }

      if (!responseText && !generatedImage) {
        responseText = response.text;
      }

      const newContent = { text: responseText, generatedImage };
      setGeneratedContent(newContent);
      setHistory(prevHistory => [...prevHistory, { prompt, response: newContent, image: image?.dataUrl }]);
    } catch (e: any) {
      setError(e.message || 'An error occurred while generating content.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToGenerator = () => {
    setGeneratedContent(null);
    setError('');
    setPrompt('');
    handleRemoveImage();
    setCurrentView('generate');
  };
  
  const handleDeleteItem = (indexToDelete: number) => {
    setHistory(prevHistory => prevHistory.filter((_, index) => index !== indexToDelete));
  };

  const handleClearAllHistory = () => {
    if (window.confirm('আপনি কি সত্যিই সমস্ত ইতিহাস মুছে ফেলতে চান?')) {
      setHistory([]);
    }
  };

  const renderContentGenerator = () => (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">গ্রাম জিপিটি - আপনার গ্রামীণ বন্ধু</h2>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <textarea
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white dark:placeholder-gray-400 font-bold"
          rows={5}
          placeholder="গ্রামের গল্প, আবহাওয়ার খবর জানতে চান, বা কোনো ছবি আঁকতে বলুন..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isLoading}
          aria-label="Prompt Input"
        />

        <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            className="hidden"
            accept="image/png, image/jpeg, image/webp"
        />

        {image && (
            <div className="mt-4 relative w-full max-w-xs h-auto">
                <img src={image.dataUrl} alt="Preview" className="rounded-lg object-cover w-full h-full"/>
                <button
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 bg-white dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400"
                    aria-label="Remove image"
                    disabled={isLoading}
                >
                    <XCircleIcon />
                </button>
            </div>
        )}

        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          উদাহরণ: 'ধান গাছে বাদামী দাগ পড়েছে, কী করব?' অথবা 'বর্ষার বিকেলে একটি গ্রামের দৃশ্য আঁকো।'
        </p>
        <div className="mt-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 flex items-center justify-center space-x-2"
            disabled={isLoading}
            aria-label="Upload an image"
          >
            <ImageIcon/>
            <span>ছবি যোগ করুন</span>
          </button>
          
          <button
            onClick={handleGenerate}
            className="w-full sm:w-auto px-6 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 disabled:bg-green-300"
            disabled={isLoading}
          >
            {isLoading ? 'অনুসন্ধান চলছে...' : 'উত্তর খুঁজুন'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-6 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-500/50 text-red-700 dark:text-red-300 px-4 py-3 rounded-md" role="alert">
          <p>{error}</p>
        </div>
      )}

      {generatedContent && (
        <div className="mt-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">ফলাফল</h3>
           {generatedContent.generatedImage && (
            <div className="relative mb-4">
              <img src={generatedContent.generatedImage} alt="Generated content" className="rounded-lg w-full max-w-md shadow-lg" />
              <button
                onClick={() => handleDownloadImage(generatedContent.generatedImage!)}
                className="absolute top-2 right-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 shadow"
                aria-label="Download image"
                title="ছবিটি ডাউনলোড করুন"
              >
                <DownloadIcon />
              </button>
            </div>
          )}
          <div 
            className="prose dark:prose-invert max-w-none whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: marked.parse(generatedContent.text) }}
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-screen text-gray-800 dark:text-gray-200">
      <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div 
          className="flex items-center space-x-4 cursor-pointer" 
          onClick={navigateToGenerator}
          role="button"
          aria-label="Go to content generator"
        >
          <GeminiIcon />
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Gram GPT</h1>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" 
            aria-label="History"
            onClick={() => setCurrentView('history')}
          >
            <HistoryIcon />
          </button>
          <button
            onClick={handleThemeSwitch}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Switch theme"
          >
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
          </button>
        </div>
      </header>
      
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {currentView === 'generate' ? renderContentGenerator() : <HistoryPage history={history} onBack={navigateToGenerator} onDeleteItem={handleDeleteItem} onClearAll={handleClearAllHistory} />}
      </main>
    </div>
  );
};

export default Dashboard;