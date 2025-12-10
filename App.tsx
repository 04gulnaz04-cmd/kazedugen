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

  // Global Theme Styles Configuration
  const themeConfig = {
    modern: {
      appBg: 'bg-slate-50',
      text: 'text-slate-800',
      mutedText: 'text-slate-500',
      headerBg: 'bg-white',
      headerBorder: 'border-slate-200',
      cardBg: 'bg-white',
      cardBorder: 'border-slate-200',
      primaryBtn: 'bg-green-600 hover:bg-green-700 text-white shadow-green-500/30',
      secondaryBtn: 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200',
      accentColor: 'text-green-600',
      iconBg: 'bg-green-600',
      tabActive: 'border-green-600 text-green-600',
      inputRing: 'focus:ring-green-500',
      font: 'font-sans'
    },
    dark: {
      appBg: 'bg-slate-950',
      text: 'text-slate-100',
      mutedText: 'text-slate-400',
      headerBg: 'bg-slate-900',
      headerBorder: 'border-slate-800',
      cardBg: 'bg-slate-900',
      cardBorder: 'border-slate-800',
      primaryBtn: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/30',
      secondaryBtn: 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700',
      accentColor: 'text-indigo-400',
      iconBg: 'bg-indigo-600',
      tabActive: 'border-indigo-500 text-indigo-400',
      inputRing: 'focus:ring-indigo-500',
      font: 'font-sans'
    },
    playful: {
      appBg: 'bg-yellow-50',
      text: 'text-slate-900',
      mutedText: 'text-slate-600',
      headerBg: 'bg-white',
      headerBorder: 'border-yellow-200',
      cardBg: 'bg-white',
      cardBorder: 'border-yellow-300',
      primaryBtn: 'bg-pink-500 hover:bg-pink-600 text-white shadow-pink-500/30',
      secondaryBtn: 'bg-white hover:bg-yellow-100 text-slate-700 border-yellow-300',
      accentColor: 'text-pink-500',
      iconBg: 'bg-pink-500',
      tabActive: 'border-pink-500 text-pink-600',
      inputRing: 'focus:ring-pink-400',
      font: 'font-sans' // Could use a rounded font class if available
    },
    classic: {
      appBg: 'bg-[#f0ece2]',
      text: 'text-[#3e3b3b]',
      mutedText: 'text-[#6e6b6b]',
      headerBg: 'bg-[#e6e2d3]',
      headerBorder: 'border-[#d1cebd]',
      cardBg: 'bg-[#fdfbf7]',
      cardBorder: 'border-[#d1cebd]',
      primaryBtn: 'bg-[#8b5e3c] hover:bg-[#6f4b30] text-white shadow-[#8b5e3c]/30',
      secondaryBtn: 'bg-[#fdfbf7] hover:bg-[#e6e2d3] text-[#3e3b3b] border-[#d1cebd]',
      accentColor: 'text-[#8b5e3c]',
      iconBg: 'bg-[#8b5e3c]',
      tabActive: 'border-[#8b5e3c] text-[#8b5e3c]',
      inputRing: 'focus:ring-[#8b5e3c]',
      font: 'font-serif'
    }
  };

  const currentStyle = themeConfig[selectedTheme];

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
      setUser(prev => prev ? { ...prev, isFirstLogin: false } : null);
    }
  };

  const handleHistorySelect = (record: HistoryRecord) => {
    setTopic(record.topic);
    const loadedContent = record.data;
    setContent(loadedContent);
    
    if (loadedContent.theme) setSelectedTheme(loadedContent.theme);
    else setSelectedTheme('dark'); // Fallback
    
    if (loadedContent.language) setLanguage(loadedContent.language);

    setStatus({ 
      step: GenerationStep.COMPLETED, 
      message: t.history_saved, 
      progress: 100 
    });
    setActiveTab('video');
  };

  const handleThemeChange = (newTheme: VideoTheme) => {
    setSelectedTheme(newTheme);
    if (content) {
      setContent({ ...content, theme: newTheme });
    }
  };

  const handleGenerate = async () => {
    if (!topic.trim()) return;

    setStatus({ step: GenerationStep.TEXT, message: t.status_text, progress: 10 });
    setContent(null);

    try {
      const explanation = await GeminiService.generateExplanation(topic, language);
      setStatus({ step: GenerationStep.QUIZ, message: t.status_quiz, progress: 30 });

      const quiz = await GeminiService.generateQuiz(explanation, language);
      setStatus({ step: GenerationStep.SLIDES_TEXT, message: t.status_slides, progress: 50 });

      const slideTexts = await GeminiService.generateSlideContent(explanation, language);
      
      setStatus({ step: GenerationStep.IMAGES, message: t.status_images, progress: 65 });
      const slidesWithImages: SlideContent[] = await Promise.all(
        slideTexts.map(async (slide) => {
          const imageUrl = await GeminiService.generateSlideImage(slide.imagePrompt, selectedTheme);
          return { ...slide, imageUrl: imageUrl || undefined };
        })
      );

      setStatus({ step: GenerationStep.AUDIO, message: t.status_audio, progress: 85 });
      const audioBase64 = await GeminiService.generateAudio(explanation, language);

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

      if (user) {
        try {
          await StorageService.saveHistory(user.id, newContent);
          await loadHistory(user.id);
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

  const themeOptions: { id: VideoTheme; label: string }[] = [
    { id: 'modern', label: 'Modern' },
    { id: 'dark', label: 'Dark' },
    { id: 'playful', label: 'Playful' },
    { id: 'classic', label: 'Classic' },
  ];

  const languages: { id: Language; label: string; flag: string }[] = [
    { id: 'kk', label: 'Қазақша', flag: '🇰🇿' },
    { id: 'ru', label: 'Русский', flag: '🇷🇺' },
    { id: 'en', label: 'English', flag: '🇬🇧' },
  ];

  return (
    <div className={`min-h-screen pb-20 transition-colors duration-500 ease-in-out ${currentStyle.appBg} ${currentStyle.text} ${currentStyle.font}`}>
      
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
        theme={selectedTheme}
      />

      {/* Header */}
      <header className={`${currentStyle.headerBg} border-b ${currentStyle.headerBorder} sticky top-0 z-30 transition-colors duration-500`}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 ${currentStyle.iconBg} rounded-lg flex items-center justify-center text-white shadow-lg`}>
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight leading-none">{t.app_title}</h1>
              <p className={`text-xs ${currentStyle.mutedText} font-medium`}>{t.app_subtitle}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Language Switcher */}
            <div className={`flex items-center gap-1 ${selectedTheme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'} p-1 rounded-lg`}>
               {languages.map((lang) => (
                 <button
                   key={lang.id}
                   onClick={() => setLanguage(lang.id)}
                   className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
                     language === lang.id 
                       ? `${currentStyle.cardBg} shadow ${currentStyle.accentColor}` 
                       : `${currentStyle.mutedText} hover:opacity-80`
                   }`}
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
                  className={`hidden md:flex items-center gap-2 font-medium transition ${currentStyle.mutedText} hover:${currentStyle.accentColor.split(' ')[0]}`}
                >
                  <History className="w-5 h-5" />
                  {t.my_history}
                </button>
                <div className={`flex items-center gap-3 border-l ${currentStyle.headerBorder} pl-4 ml-2`}>
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold">{user.name}</p>
                    <button onClick={handleLogout} className="text-xs text-red-500 hover:underline">{t.logout}</button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowAuthModal(true)}
                  className={`flex items-center gap-2 px-4 py-2 font-bold rounded-lg transition hover:bg-opacity-80 ${currentStyle.accentColor}`}
                >
                  <LogIn className="w-4 h-4" />
                  {t.login}
                </button>
                <button 
                  onClick={() => setShowAuthModal(true)}
                  className={`hidden sm:flex px-4 py-2 font-bold rounded-lg transition shadow-lg ${currentStyle.primaryBtn}`}
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
        <section className={`${currentStyle.cardBg} rounded-2xl shadow-sm border ${currentStyle.cardBorder} p-8 mb-8 text-center max-w-3xl mx-auto relative overflow-hidden transition-colors duration-500`}>
          <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${
            selectedTheme === 'dark' ? 'from-indigo-500 via-purple-500 to-pink-500' :
            selectedTheme === 'playful' ? 'from-pink-400 via-yellow-400 to-blue-400' :
            selectedTheme === 'classic' ? 'from-[#8b5e3c] to-[#d4d0b4]' :
            'from-green-500 via-emerald-500 to-teal-500'
          }`}></div>
          
          <h2 className="text-2xl font-bold mb-2">{t.input_title}</h2>
          <p className={`${currentStyle.mutedText} mb-6`}>{t.input_desc}</p>
          
          <div className="flex flex-col gap-4 relative z-10">
            {/* Topic Input */}
            <div className="flex gap-2">
              <input 
                type="text" 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={t.topic_placeholder}
                className={`flex-1 px-4 py-3 border ${selectedTheme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'border-slate-300'} rounded-xl outline-none text-lg transition shadow-sm ${currentStyle.inputRing}`}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              />
              <button 
                onClick={handleGenerate}
                disabled={status.step !== GenerationStep.IDLE && status.step !== GenerationStep.COMPLETED && status.step !== GenerationStep.ERROR}
                className={`font-bold py-3 px-8 rounded-xl transition-all shadow-lg flex items-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed ${currentStyle.primaryBtn}`}
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
              <label className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-1 ${currentStyle.mutedText}`}>
                <Palette className="w-3 h-3" />
                {t.theme_label}
              </label>
              <div className="flex flex-wrap gap-2 w-full">
                {themeOptions.map((theme) => {
                  const isActive = selectedTheme === theme.id;
                  let btnClass = `flex-1 min-w-[80px] py-2 px-3 rounded-lg border text-sm font-medium transition-all `;
                  
                  // Dynamic styles for theme buttons
                  if (isActive) {
                    btnClass += `${currentStyle.cardBg} ${currentStyle.accentColor} ${currentStyle.tabActive.split(' ')[0]} border-2 shadow-md transform scale-105`;
                  } else {
                     if (selectedTheme === 'dark') btnClass += `bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700`;
                     else btnClass += `bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100`;
                  }

                  return (
                    <button
                      key={theme.id}
                      onClick={() => handleThemeChange(theme.id)}
                      className={btnClass}
                    >
                      {theme.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          
          {!user && (
            <p className={`mt-4 text-xs flex items-center justify-center gap-1 ${currentStyle.mutedText}`}>
              <AlertCircle className="w-3 h-3"/> {t.save_warning}
            </p>
          )}

          {status.step !== GenerationStep.IDLE && status.step !== GenerationStep.COMPLETED && status.step !== GenerationStep.ERROR && (
             <ProgressBar status={status} lang={language} theme={selectedTheme} />
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
                 <span className={`mr-auto flex items-center text-sm font-medium px-3 py-1 rounded-full ${selectedTheme === 'dark' ? 'bg-slate-800 text-green-400' : 'bg-green-50 text-green-600'}`}>
                    <UserIcon className="w-3 h-3 mr-1"/> 
                    {t.history_saved}
                 </span>
               )}

               {!content.audioBase64 && (
                 <button 
                    onClick={regenerateAudio}
                    className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition shadow-sm ${currentStyle.secondaryBtn}`}
                 >
                   <RefreshCw className="w-4 h-4"/> {t.regenerate_audio}
                 </button>
               )}

               <button 
                  onClick={downloadAudio} 
                  disabled={!content.audioBase64}
                  className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition shadow-sm ${!content.audioBase64 ? 'opacity-50 cursor-not-allowed' : ''} ${currentStyle.secondaryBtn}`}
               >
                 <Music className={`w-4 h-4 ${content.audioBase64 ? 'text-purple-500' : ''}`}/> {t.download_audio}
               </button>
               <button onClick={() => downloadPDF(content)} className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition shadow-sm ${currentStyle.secondaryBtn}`}>
                 <FileText className="w-4 h-4 text-red-500"/> {t.download_pdf}
               </button>
               <button onClick={() => downloadPPTX(content)} className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition shadow-sm ${currentStyle.secondaryBtn}`}>
                 <Presentation className="w-4 h-4 text-orange-500"/> {t.download_pptx}
               </button>
            </div>

            {/* Navigation Tabs */}
            <div className={`${currentStyle.cardBg} rounded-t-2xl border-b ${currentStyle.cardBorder} px-2 flex transition-colors duration-500`}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all border-b-2 ${
                    activeTab === tab.id 
                      ? currentStyle.tabActive
                      : `border-transparent ${currentStyle.mutedText} hover:opacity-80`
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content Display */}
            <div className={`${currentStyle.cardBg} rounded-b-2xl shadow-sm border ${currentStyle.cardBorder} border-t-0 p-6 md:p-8 min-h-[500px] transition-colors duration-500`}>
              
              {/* Text View */}
              {activeTab === 'text' && (
                <div className={`max-w-4xl mx-auto prose prose-lg ${selectedTheme === 'dark' ? 'prose-invert' : ''}`}>
                  <h1 className="text-3xl font-bold mb-6">{content.topic}</h1>
                  <div dangerouslySetInnerHTML={{ __html: content.explanation.replace(/\n/g, '<br/>') }} />
                </div>
              )}

              {/* Video View */}
              {activeTab === 'video' && (
                <div className="space-y-6">
                   <div className="text-center mb-6">
                      <h2 className="text-xl font-bold">{t.video_title}</h2>
                      <p className={`${currentStyle.mutedText} mb-2`}>
                        {content.audioBase64 ? t.video_desc : t.video_no_audio}
                      </p>
                   </div>
                   <VideoPlayer 
                      slides={content.slides} 
                      audioBase64={content.audioBase64} 
                      textExplanation={content.explanation} 
                      theme={selectedTheme}
                      lang={language}
                      onRegenerateAudio={regenerateAudio}
                   />
                </div>
              )}

              {/* Quiz View */}
              {activeTab === 'quiz' && (
                <QuizView questions={content.quiz} lang={language} theme={selectedTheme} />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;