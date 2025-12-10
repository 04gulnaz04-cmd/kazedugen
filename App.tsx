import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Video, 
  Music, 
  FileText, 
  PlayCircle,
  BrainCircuit,
  Presentation,
  AlertCircle,
  LogIn,
  History,
  User as UserIcon,
  LogOut,
  RefreshCw,
  Palette,
  Globe
} from 'lucide-react';
import { GeneratedContent, GenerationStatus, GenerationStep, SlideContent, User, HistoryRecord, VideoTheme, Language } from './types';
import * as GeminiService from './services/geminiService';
import * as StorageService from './services/storageService';
import { downloadPDF, downloadPPTX } from './services/pdfService';
import { translations } from './constants/translations';
import ProgressBar from './components/ProgressBar';
import QuizView from './components/QuizView';
import VideoPlayer from './components/VideoPlayer';
import AuthModal from './components/AuthModal';
import OnboardingModal from './components/OnboardingModal';
import HistoryList from './components/HistoryList';

const App: React.FC = () => {
  // Core State
  const [topic, setTopic] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<VideoTheme>('modern');
  const [language, setLanguage] = useState<Language>('kk');
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [status, setStatus] = useState<GenerationStatus>({
    step: GenerationStep.IDLE,
    message: '',
    progress: 0
  });
  const [activeTab, setActiveTab] = useState<'text' | 'video' | 'quiz'>('text');

  // Auth & User State
  const [user, setUser] = useState<User | null>(null);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  
  // UI Modal State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Translation Helper
  const t = translations[language];

  // Initial Load
  useEffect(() => {
    const currentUser = StorageService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      if (currentUser.isFirstLogin) {
        setShowOnboarding(true);
      }
      loadHistory(currentUser.id);
    }
  }, []);

  const loadHistory = async (userId: string) => {
    try {
      const records = await StorageService.getHistory(userId);
      setHistory(records);
    } catch (e) {
      console.error("Failed to load history", e);
    }
  };

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    loadHistory(loggedInUser.id);
    if (loggedInUser.isFirstLogin) {
      setShowOnboarding(true);
    }
  };

  const handleLogout = () => {
    StorageService.logout();
    setUser(null);
    setHistory([]);
    setContent(null);
    setTopic('');
    setStatus({ step: GenerationStep.IDLE, message: '', progress: 0 });
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    if (user) {
      StorageService.markOnboardingSeen(user.id);
      // Update local user state to reflect change
      setUser(prev => prev ? { ...prev, isFirstLogin: false } : null);
    }
  };

  const handleHistorySelect = (record: HistoryRecord) => {
    setTopic(record.topic);
    const loadedContent = record.data;
    setContent(loadedContent);
    // Determine theme from history or default to modern/dark depending on old data
    if (loadedContent.theme) setSelectedTheme(loadedContent.theme);
    else setSelectedTheme('dark');
    
    // Set language from history if available, otherwise keep current or default to KK
    if (loadedContent.language) setLanguage(loadedContent.language);

    setStatus({ 
      step: GenerationStep.COMPLETED, 
      message: t.history_saved, 
      progress: 100 
    });
    setActiveTab('video');
  };

  const handleGenerate = async () => {
    if (!topic.trim()) return;

    setStatus({ step: GenerationStep.TEXT, message: t.status_text, progress: 10 });
    setContent(null);

    try {
      // 1. Text Generation
      const explanation = await GeminiService.generateExplanation(topic, language);
      setStatus({ step: GenerationStep.QUIZ, message: t.status_quiz, progress: 30 });

      // 2. Quiz Generation
      const quiz = await GeminiService.generateQuiz(explanation, language);
      setStatus({ step: GenerationStep.SLIDES_TEXT, message: t.status_slides, progress: 50 });

      // 3. Slides Text
      const slideTexts = await GeminiService.generateSlideContent(explanation, language);
      
      // 4. Slide Images (Parallel) - Pass theme here
      setStatus({ step: GenerationStep.IMAGES, message: t.status_images, progress: 65 });
      const slidesWithImages: SlideContent[] = await Promise.all(
        slideTexts.map(async (slide) => {
          const imageUrl = await GeminiService.generateSlideImage(slide.imagePrompt, selectedTheme);
          return { ...slide, imageUrl: imageUrl || undefined };
        })
      );

      // 5. Audio Generation
      setStatus({ step: GenerationStep.AUDIO, message: t.status_audio, progress: 85 });
      const audioBase64 = await GeminiService.generateAudio(explanation, language);

      // Finalize
      const newContent: GeneratedContent = {
        topic,
        explanation,
        quiz,
        slides: slidesWithImages,
        audioBase64,
        theme: selectedTheme,
        language: language,
        createdAt: new Date()
      };

      setContent(newContent);
      setStatus({ step: GenerationStep.COMPLETED, message: t.status_complete, progress: 100 });
      setActiveTab('video');

      // Save to History if Logged In
      if (user) {
        try {
          await StorageService.saveHistory(user.id, newContent);
          await loadHistory(user.id); // Refresh history list
        } catch (e) {
          console.error("Failed to save history:", e);
        }
      } 

    } catch (error) {
      console.error(error);
      setStatus({ step: GenerationStep.ERROR, message: t.status_error, progress: 0 });
    }
  };

  const regenerateAudio = async () => {
    if (!content) return;
    
    const originalStatus = status;
    setStatus({ step: GenerationStep.AUDIO, message: t.status_audio, progress: 90 });
    
    try {
      const audioBase64 = await GeminiService.generateAudio(content.explanation, language);
      if (audioBase64) {
        const updatedContent = { ...content, audioBase64 };
        setContent(updatedContent);
        setStatus({ step: GenerationStep.COMPLETED, message: t.status_complete, progress: 100 });
        
        // Update history if logged in
        if (user) {
            await StorageService.saveHistory(user.id, updatedContent);
            await loadHistory(user.id);
        }
      } else {
        setStatus({ ...originalStatus, message: t.status_error });
      }
    } catch (error) {
      console.error(error);
      setStatus({ ...originalStatus, message: t.status_error });
    }
  };

  const downloadAudio = () => {
    if (!content?.audioBase64) {
      alert("Audio not available.");
      return;
    }
    const link = document.createElement("a");
    link.href = `data:audio/mp3;base64,${content.audioBase64}`;
    link.download = `${content.topic}_audio.mp3`;
    link.click();
  };

  const tabs = [
    { id: 'text', label: t.tab_text, icon: BookOpen },
    { id: 'video', label: t.tab_video, icon: Video },
    { id: 'quiz', label: t.tab_quiz, icon: BrainCircuit },
  ];

  const themeOptions: { id: VideoTheme; label: string; colorClass: string }[] = [
    { id: 'modern', label: 'Modern', colorClass: 'bg-white border-slate-200 text-slate-800' },
    { id: 'dark', label: 'Dark', colorClass: 'bg-slate-900 border-slate-700 text-white' },
    { id: 'playful', label: 'Playful', colorClass: 'bg-yellow-100 border-yellow-300 text-indigo-900' },
    { id: 'classic', label: 'Classic', colorClass: 'bg-[#f5f5dc] border-[#d4d0b4] text-[#5c4033]' },
  ];

  const languages: { id: Language; label: string; flag: string }[] = [
    { id: 'kk', label: 'Қазақша', flag: '🇰🇿' },
    { id: 'ru', label: 'Русский', flag: '🇷🇺' },
    { id: 'en', label: 'English', flag: '🇬🇧' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20 font-sans">
      
      {/* Modals & Overlays */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        onLogin={handleLogin} 
        lang={language}
      />
      <OnboardingModal 
        isOpen={showOnboarding} 
        onClose={handleOnboardingComplete} 
        lang={language}
      />
      <HistoryList 
        isOpen={showHistory} 
        history={history} 
        onClose={() => setShowHistory(false)} 
        onSelect={handleHistorySelect}
        lang={language}
      />

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center text-white shadow-green-200 shadow-lg">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none">{t.app_title}</h1>
              <p className="text-xs text-slate-500 font-medium">{t.app_subtitle}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Language Switcher */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
               {languages.map((lang) => (
                 <button
                   key={lang.id}
                   onClick={() => setLanguage(lang.id)}
                   className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${language === lang.id ? 'bg-white shadow text-green-700' : 'text-slate-500 hover:text-slate-700'}`}
                   title={lang.label}
                 >
                   {lang.flag} <span className="hidden md:inline">{lang.id.toUpperCase()}</span>
                 </button>
               ))}
            </div>

            {user ? (
              <>
                <button 
                  onClick={() => setShowHistory(true)}
                  className="hidden md:flex items-center gap-2 text-slate-600 hover:text-green-600 font-medium transition"
                >
                  <History className="w-5 h-5" />
                  {t.my_history}
                </button>
                <div className="flex items-center gap-3 border-l pl-4 ml-2">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-slate-800">{user.name}</p>
                    <button onClick={handleLogout} className="text-xs text-red-500 hover:underline">{t.logout}</button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center gap-2 px-4 py-2 text-green-600 font-bold hover:bg-green-50 rounded-lg transition"
                >
                  <LogIn className="w-4 h-4" />
                  {t.login}
                </button>
                <button 
                  onClick={() => setShowAuthModal(true)}
                  className="hidden sm:flex px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition shadow-lg shadow-green-500/20"
                >
                  {t.signup}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Input Section */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8 text-center max-w-3xl mx-auto relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500"></div>
          
          <h2 className="text-2xl font-bold mb-2 text-slate-900">{t.input_title}</h2>
          <p className="text-slate-500 mb-6">{t.input_desc}</p>
          
          <div className="flex flex-col gap-4 relative z-10">
            {/* Topic Input */}
            <div className="flex gap-2">
              <input 
                type="text" 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={t.topic_placeholder}
                className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-lg transition shadow-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              />
              <button 
                onClick={handleGenerate}
                disabled={status.step !== GenerationStep.IDLE && status.step !== GenerationStep.COMPLETED && status.step !== GenerationStep.ERROR}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg hover:shadow-green-500/30 flex items-center gap-2 whitespace-nowrap"
              >
                {status.step !== GenerationStep.IDLE && status.step !== GenerationStep.COMPLETED && status.step !== GenerationStep.ERROR ? (
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"/>
                ) : (
                  <PlayCircle className="w-5 h-5" />
                )}
                {t.generate_btn}
              </button>
            </div>

            {/* Theme Selector */}
            <div className="flex flex-col items-start gap-2 mt-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Palette className="w-3 h-3" />
                {t.theme_label}
              </label>
              <div className="flex flex-wrap gap-2 w-full">
                {themeOptions.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedTheme(theme.id)}
                    disabled={status.step !== GenerationStep.IDLE && status.step !== GenerationStep.COMPLETED && status.step !== GenerationStep.ERROR}
                    className={`flex-1 min-w-[80px] py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                      selectedTheme === theme.id 
                        ? `${theme.colorClass} ring-2 ring-green-500 ring-offset-1 shadow-md transform scale-105` 
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {theme.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {!user && (
            <p className="mt-4 text-xs text-slate-400 flex items-center justify-center gap-1">
              <AlertCircle className="w-3 h-3"/> {t.save_warning}
            </p>
          )}

          {status.step !== GenerationStep.IDLE && status.step !== GenerationStep.COMPLETED && status.step !== GenerationStep.ERROR && (
             <ProgressBar status={status} lang={language} />
          )}

          {status.step === GenerationStep.ERROR && (
             <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg flex items-center justify-center gap-2 border border-red-100">
               <AlertCircle className="w-5 h-5"/> {status.message}
             </div>
          )}
        </section>

        {/* Results Section */}
        {content && status.step === GenerationStep.COMPLETED && (
          <div className="animate-fade-in-up">
            
            {/* Action Bar (Downloads) */}
            <div className="flex flex-wrap gap-3 mb-6 justify-end">
               {user && (
                 <span className={`mr-auto flex items-center text-sm font-medium px-3 py-1 rounded-full bg-green-50 text-green-600`}>
                    <UserIcon className="w-3 h-3 mr-1"/> 
                    {t.history_saved}
                 </span>
               )}

               {!content.audioBase64 && (
                 <button 
                    onClick={regenerateAudio}
                    className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 text-sm font-medium transition shadow-sm"
                 >
                   <RefreshCw className="w-4 h-4"/> {t.regenerate_audio}
                 </button>
               )}

               <button 
                  onClick={downloadAudio} 
                  disabled={!content.audioBase64}
                  className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition shadow-sm ${!content.audioBase64 ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'}`}
               >
                 <Music className={`w-4 h-4 ${content.audioBase64 ? 'text-purple-500' : ''}`}/> {t.download_audio}
               </button>
               <button onClick={() => downloadPDF(content)} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 text-sm font-medium transition shadow-sm">
                 <FileText className="w-4 h-4 text-red-500"/> {t.download_pdf}
               </button>
               <button onClick={() => downloadPPTX(content)} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 text-sm font-medium transition shadow-sm">
                 <Presentation className="w-4 h-4 text-orange-500"/> {t.download_pptx}
               </button>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white rounded-t-2xl border-b border-slate-200 px-2 flex">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all border-b-2 ${
                    activeTab === tab.id 
                      ? 'border-green-600 text-green-600' 
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content Display */}
            <div className="bg-white rounded-b-2xl shadow-sm border border-slate-200 border-t-0 p-6 md:p-8 min-h-[500px]">
              
              {/* Text View */}
              {activeTab === 'text' && (
                <div className="max-w-4xl mx-auto prose prose-green prose-lg text-slate-700">
                  <h1 className="text-3xl font-bold mb-6">{content.topic}</h1>
                  <div dangerouslySetInnerHTML={{ __html: content.explanation.replace(/\n/g, '<br/>') }} />
                </div>
              )}

              {/* Video View */}
              {activeTab === 'video' && (
                <div className="space-y-6">
                   <div className="text-center mb-6">
                      <h2 className="text-xl font-bold text-slate-800">{t.video_title}</h2>
                      <p className="text-slate-500 mb-2">
                        {content.audioBase64 ? t.video_desc : t.video_no_audio}
                      </p>
                      <span className="inline-block px-3 py-1 bg-slate-100 rounded-full text-xs font-medium text-slate-500 uppercase">
                        {themeOptions.find(opt => opt.id === content.theme)?.label || 'Standard'}
                      </span>
                   </div>
                   <VideoPlayer 
                      slides={content.slides} 
                      audioBase64={content.audioBase64} 
                      textExplanation={content.explanation} 
                      theme={content.theme}
                      lang={language}
                      onRegenerateAudio={regenerateAudio}
                   />
                </div>
              )}

              {/* Quiz View */}
              {activeTab === 'quiz' && (
                <QuizView questions={content.quiz} lang={language} />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;