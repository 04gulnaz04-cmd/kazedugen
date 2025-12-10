import React, { useState, useRef, useEffect } from 'react';
import { SlideContent, VideoTheme, Language } from '../types';
import { translations } from '../constants/translations';
import { Play, Pause, Volume2, VolumeX, RefreshCw } from 'lucide-react';

interface VideoPlayerProps {
  slides: SlideContent[];
  audioBase64: string | null;
  textExplanation: string;
  theme?: VideoTheme;
  lang: Language;
  onRegenerateAudio?: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ slides, audioBase64, theme = 'dark', lang, onRegenerateAudio }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const t = translations[lang];
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Audio
  useEffect(() => {
    if (audioBase64) {
      const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
      audioRef.current = audio;

      audio.addEventListener('timeupdate', updateProgress);
      audio.addEventListener('ended', () => setIsPlaying(false));
      
      return () => {
        audio.pause();
        audio.removeEventListener('timeupdate', updateProgress);
      };
    } else {
      audioRef.current = null;
      setIsPlaying(false);
      setProgress(0);
    }
  }, [audioBase64]);

  // Sync slides with audio progress
  const updateProgress = () => {
    if (audioRef.current) {
      const duration = audioRef.current.duration || 1;
      const current = audioRef.current.currentTime;
      const p = (current / duration) * 100;
      setProgress(p);

      // Determine slide based on progress
      const slideDuration = duration / slides.length;
      const index = Math.min(Math.floor(current / slideDuration), slides.length - 1);
      setCurrentSlideIndex(index);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const currentSlide = slides[currentSlideIndex];

  if (!slides.length) return <div>No slides generated.</div>;

  // Theme Styles Definition
  const themeStyles = {
    modern: {
      wrapper: "bg-white",
      textOverlay: "text-slate-900 bg-white/90 shadow-sm border border-slate-100",
      title: "text-slate-800 font-sans tracking-tight",
      bullet: "text-slate-700 font-sans",
      progressBg: "bg-slate-200",
      progressFill: "bg-blue-600",
      controlsBg: "bg-slate-50 border-t border-slate-200",
      controlsText: "text-slate-700"
    },
    dark: {
      wrapper: "bg-slate-900",
      textOverlay: "text-white bg-black/40 backdrop-blur-md border border-white/10",
      title: "text-white font-bold drop-shadow-lg",
      bullet: "text-white font-medium",
      progressBg: "bg-slate-700",
      progressFill: "bg-green-500",
      controlsBg: "bg-slate-900",
      controlsText: "text-white"
    },
    playful: {
      wrapper: "bg-yellow-50",
      textOverlay: "text-indigo-900 bg-white/90 border-2 border-indigo-200 shadow-[4px_4px_0px_0px_rgba(79,70,229,1)] rounded-xl",
      title: "text-indigo-600 font-extrabold tracking-wide",
      bullet: "text-slate-700 font-semibold",
      progressBg: "bg-yellow-200",
      progressFill: "bg-indigo-500",
      controlsBg: "bg-yellow-100 border-t-2 border-yellow-200",
      controlsText: "text-indigo-900"
    },
    classic: {
      wrapper: "bg-[#f5f5dc]", // Beige
      textOverlay: "text-slate-900 bg-[#e8e4c9]/95 border border-[#d4d0b4] shadow-inner",
      title: "text-black font-serif italic",
      bullet: "text-slate-800 font-serif",
      progressBg: "bg-[#d4d0b4]",
      progressFill: "bg-[#8b4513]", // SaddleBrown
      controlsBg: "bg-[#e8e4c9] border-t border-[#d4d0b4]",
      controlsText: "text-[#5c4033]"
    }
  };

  const activeTheme = themeStyles[theme] || themeStyles.dark;

  return (
    <div className={`max-w-4xl mx-auto rounded-xl overflow-hidden shadow-2xl flex flex-col ${activeTheme.wrapper}`}>
      {/* Video Display Area */}
      <div className="relative aspect-video flex items-center justify-center overflow-hidden group">
        {currentSlide && (
          <>
            {/* Background Image */}
            {currentSlide.imageUrl ? (
              <div className="absolute inset-0">
                <img 
                  src={currentSlide.imageUrl} 
                  alt={currentSlide.title}
                  className={`w-full h-full object-cover transition-transform duration-[20s] ease-linear transform scale-100 ${isPlaying ? 'scale-110' : ''}`}
                />
                 {/* Theme-specific Overlay tint to blend images even if style doesn't match perfectly */}
                <div className={`absolute inset-0 ${
                  theme === 'modern' ? 'bg-white/30' : 
                  theme === 'classic' ? 'bg-[#5c4033]/20 mix-blend-sepia' : 
                  theme === 'playful' ? 'bg-yellow-400/10 mix-blend-overlay' :
                  'bg-black/40'
                }`}></div>
              </div>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-green-900 to-slate-900" />
            )}
            
            {/* Slide Content Overlay */}
            <div className="relative z-10 w-full h-full flex flex-col justify-center items-center p-8 md:p-16">
              <div className={`p-6 md:p-8 rounded-2xl max-w-2xl w-full text-center transition-all duration-500 ${activeTheme.textOverlay}`}>
                <h3 className={`text-2xl md:text-4xl mb-6 ${activeTheme.title}`}>
                  {currentSlide.title}
                </h3>
                <div className="space-y-3 text-left inline-block">
                  {currentSlide.bulletPoints.map((point, i) => (
                     <p key={i} className={`text-lg md:text-xl ${activeTheme.bullet}`}>
                       • {point}
                     </p>
                  ))}
                </div>
              </div>
            </div>

            {/* Missing Audio Overlay */}
            {!audioBase64 && (
              <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white p-6">
                <VolumeX className="w-16 h-16 mb-4 text-slate-400" />
                <h3 className="text-2xl font-bold mb-2">{t.no_audio_overlay_title}</h3>
                <p className="text-slate-300 text-center max-w-md mb-6">
                  {t.no_audio_overlay_desc}
                </p>
                {onRegenerateAudio && (
                  <button 
                    onClick={onRegenerateAudio}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition"
                  >
                    <RefreshCw className="w-5 h-5" />
                    {t.regenerate_audio}
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Controls */}
      <div className={`p-4 ${activeTheme.controlsBg}`}>
        {/* Progress Bar */}
        <div className={`w-full h-1.5 rounded-full mb-4 cursor-pointer ${activeTheme.progressBg}`} onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const clickedValue = (x / rect.width);
            if(audioRef.current) {
                audioRef.current.currentTime = clickedValue * audioRef.current.duration;
            }
        }}>
           <div 
             className={`h-1.5 rounded-full transition-all duration-100 ${activeTheme.progressFill}`} 
             style={{ width: `${progress}%` }}
           ></div>
        </div>

        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-4 ${activeTheme.controlsText}`}>
            <button 
              onClick={togglePlay} 
              disabled={!audioBase64}
              className={`p-2 rounded-full transition hover:bg-black/5 ${audioBase64 ? '' : 'opacity-50 cursor-not-allowed'}`}
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>
            <div className="flex items-center gap-2">
                {audioBase64 ? (
                  <>
                    <Volume2 className="w-5 h-5 opacity-70" />
                    <span className="text-xs opacity-70">AI Voice</span>
                  </>
                ) : (
                  <span className="text-xs text-red-500 font-medium">Silent</span>
                )}
            </div>
          </div>
          <div className={`text-sm font-mono opacity-70 ${activeTheme.controlsText}`}>
             {lang === 'kk' ? 'Слайд' : lang === 'ru' ? 'Слайд' : 'Slide'} {currentSlideIndex + 1} / {slides.length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;