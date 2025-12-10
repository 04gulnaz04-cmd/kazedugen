import React from 'react';
import { GenerationStatus, Language } from '../types';
import { translations } from '../constants/translations';

interface ProgressBarProps {
  status: GenerationStatus;
  lang: Language;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ status, lang }) => {
  const t = translations[lang];

  return (
    <div className="w-full max-w-2xl mx-auto my-8">
      <div className="flex justify-between mb-2">
        <span className="text-sm font-medium text-slate-700 dark:text-white">
          {status.message}
        </span>
        <span className="text-sm font-medium text-slate-700 dark:text-white">
          {Math.round(status.progress)}%
        </span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-2.5 dark:bg-slate-700 overflow-hidden">
        <div 
          className="bg-green-600 h-2.5 rounded-full transition-all duration-500 ease-out" 
          style={{ width: `${status.progress}%` }}
        ></div>
      </div>
      <div className="flex justify-between mt-2 text-xs text-slate-500">
        <span className={status.progress >= 20 ? "text-green-600 font-bold" : ""}>
          {lang === 'kk' ? 'Мәтін' : lang === 'ru' ? 'Текст' : 'Text'}
        </span>
        <span className={status.progress >= 40 ? "text-green-600 font-bold" : ""}>
          {lang === 'kk' ? 'Тест' : lang === 'ru' ? 'Тест' : 'Quiz'}
        </span>
        <span className={status.progress >= 60 ? "text-green-600 font-bold" : ""}>
          {lang === 'kk' ? 'Слайдтар' : lang === 'ru' ? 'Слайды' : 'Slides'}
        </span>
        <span className={status.progress >= 80 ? "text-green-600 font-bold" : ""}>
          {lang === 'kk' ? 'Суреттер' : lang === 'ru' ? 'Изображения' : 'Images'}
        </span>
        <span className={status.progress >= 100 ? "text-green-600 font-bold" : ""}>
          {lang === 'kk' ? 'Аудио' : lang === 'ru' ? 'Аудио' : 'Audio'}
        </span>
      </div>
    </div>
  );
};

export default ProgressBar;