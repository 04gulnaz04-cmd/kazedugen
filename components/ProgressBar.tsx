import React from 'react';
import { GenerationStatus, Language, VideoTheme } from '../types';
import { translations } from '../constants/translations';

interface ProgressBarProps {
  status: GenerationStatus;
  lang: Language;
  theme?: VideoTheme;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ status, lang, theme = 'modern' }) => {
  const t = translations[lang];

  // Dynamic colors based on theme
  const getThemeColors = () => {
    switch (theme) {
      case 'dark': return { bar: 'bg-indigo-600', text: 'text-indigo-400', bg: 'bg-slate-700' };
      case 'playful': return { bar: 'bg-pink-500', text: 'text-pink-600', bg: 'bg-yellow-200' };
      case 'classic': return { bar: 'bg-[#8b5e3c]', text: 'text-[#8b5e3c]', bg: 'bg-[#d1cebd]' };
      default: return { bar: 'bg-green-600', text: 'text-green-600', bg: 'bg-slate-200' };
    }
  };

  const colors = getThemeColors();

  return (
    <div className="w-full max-w-2xl mx-auto my-8">
      <div className="flex justify-between mb-2">
        <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-700'}`}>
          {status.message}
        </span>
        <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-700'}`}>
          {Math.round(status.progress)}%
        </span>
      </div>
      <div className={`w-full rounded-full h-2.5 overflow-hidden ${colors.bg}`}>
        <div 
          className={`h-2.5 rounded-full transition-all duration-500 ease-out ${colors.bar}`} 
          style={{ width: `${status.progress}%` }}
        ></div>
      </div>
      <div className="flex justify-between mt-2 text-xs text-slate-500">
        <span className={status.progress >= 20 ? `${colors.text} font-bold` : ""}>
          {lang === 'kk' ? 'Мәтін' : lang === 'ru' ? 'Текст' : 'Text'}
        </span>
        <span className={status.progress >= 40 ? `${colors.text} font-bold` : ""}>
          {lang === 'kk' ? 'Тест' : lang === 'ru' ? 'Тест' : 'Quiz'}
        </span>
        <span className={status.progress >= 60 ? `${colors.text} font-bold` : ""}>
          {lang === 'kk' ? 'Слайдтар' : lang === 'ru' ? 'Слайды' : 'Slides'}
        </span>
        <span className={status.progress >= 80 ? `${colors.text} font-bold` : ""}>
          {lang === 'kk' ? 'Суреттер' : lang === 'ru' ? 'Изображения' : 'Images'}
        </span>
        <span className={status.progress >= 100 ? `${colors.text} font-bold` : ""}>
          {lang === 'kk' ? 'Аудио' : lang === 'ru' ? 'Аудио' : 'Audio'}
        </span>
      </div>
    </div>
  );
};

export default ProgressBar;