import React, { useState } from 'react';
import { QuizQuestion, Language, VideoTheme } from '../types';
import { translations } from '../constants/translations';
import { CheckCircle, XCircle } from 'lucide-react';

interface QuizViewProps {
  questions: QuizQuestion[];
  lang: Language;
  theme?: VideoTheme;
}

const QuizView: React.FC<QuizViewProps> = ({ questions, lang, theme = 'modern' }) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const t = translations[lang];

  const handleSelect = (qId: number, option: string) => {
    if (showResults) return;
    setSelectedAnswers(prev => ({ ...prev, [qId]: option }));
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach(q => {
      if (selectedAnswers[q.id] === q.correctAnswer) score++;
    });
    return score;
  };

  // Theme-based Styles
  const getThemeStyles = () => {
    switch(theme) {
      case 'dark': return {
        cardBg: 'bg-slate-800 border-slate-700',
        text: 'text-white',
        btnDefault: 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-indigo-500',
        btnSelected: 'bg-indigo-900/50 border-indigo-500 text-indigo-300 ring-1 ring-indigo-500',
        btnCorrect: 'bg-green-900/50 border-green-500 text-green-400',
        btnWrong: 'bg-red-900/50 border-red-500 text-red-400',
        actionBtn: 'bg-indigo-600 hover:bg-indigo-700'
      };
      case 'playful': return {
        cardBg: 'bg-white border-yellow-200 shadow-yellow-100',
        text: 'text-slate-900',
        btnDefault: 'bg-white border-slate-200 text-slate-500 hover:bg-pink-50 hover:border-pink-300',
        btnSelected: 'bg-pink-50 border-pink-500 text-pink-700 ring-1 ring-pink-500',
        btnCorrect: 'bg-green-100 border-green-500 text-green-900',
        btnWrong: 'bg-red-100 border-red-500 text-red-900',
        actionBtn: 'bg-pink-500 hover:bg-pink-600'
      };
      case 'classic': return {
        cardBg: 'bg-[#faf0e6] border-[#d1cebd]',
        text: 'text-[#3e3b3b]',
        btnDefault: 'bg-[#fffefb] border-[#d1cebd] text-[#6e6b6b] hover:bg-[#e6e2d3]',
        btnSelected: 'bg-[#e6e2d3] border-[#8b5e3c] text-[#8b5e3c] ring-1 ring-[#8b5e3c]',
        btnCorrect: 'bg-[#d1e7dd] border-[#0f5132] text-[#0f5132]',
        btnWrong: 'bg-[#f8d7da] border-[#842029] text-[#842029]',
        actionBtn: 'bg-[#8b5e3c] hover:bg-[#6f4b30]'
      };
      default: return {
        cardBg: 'bg-white border-slate-200',
        text: 'text-slate-900',
        btnDefault: 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50 hover:border-green-300',
        btnSelected: 'bg-green-50 border-green-500 text-green-900 ring-1 ring-green-500',
        btnCorrect: 'bg-green-100 border-green-500 text-green-900',
        btnWrong: 'bg-red-100 border-red-500 text-red-900',
        actionBtn: 'bg-green-600 hover:bg-green-700'
      };
    }
  };

  const s = getThemeStyles();

  return (
    <div className="space-y-8 max-w-3xl mx-auto p-4">
      <h2 className={`text-2xl font-bold border-b pb-4 ${s.text} border-opacity-20 border-current`}>{t.quiz_title}</h2>
      
      {questions.map((q, index) => {
        const isCorrect = selectedAnswers[q.id] === q.correctAnswer;
        
        return (
          <div key={q.id} className={`p-6 rounded-xl shadow-sm border ${s.cardBg}`}>
            <h3 className={`text-lg font-semibold mb-4 ${s.text}`}>
              {index + 1}. {q.question}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(q.options).map(([key, value]) => {
                let btnClass = `p-4 text-left rounded-lg border transition-all ${s.btnDefault}`;
                
                if (showResults) {
                  if (key === q.correctAnswer) {
                    btnClass = `p-4 text-left rounded-lg border transition-all font-medium ${s.btnCorrect}`;
                  } else if (selectedAnswers[q.id] === key) {
                    btnClass = `p-4 text-left rounded-lg border transition-all ${s.btnWrong}`;
                  }
                } else {
                  if (selectedAnswers[q.id] === key) {
                    btnClass = `p-4 text-left rounded-lg border transition-all shadow-md ${s.btnSelected}`;
                  }
                }

                return (
                  <button
                    key={key}
                    onClick={() => handleSelect(q.id, key)}
                    className={btnClass}
                    disabled={showResults}
                  >
                    <span className="font-bold mr-2">{key})</span> {value}
                  </button>
                );
              })}
            </div>
            {showResults && (
               <div className="mt-4 flex items-center gap-2">
                 {isCorrect ? (
                    <p className="text-green-600 flex items-center font-medium"><CheckCircle className="w-5 h-5 mr-1"/> {t.correct}</p>
                 ) : (
                    <p className="text-red-600 flex items-center font-medium"><XCircle className="w-5 h-5 mr-1"/> {t.incorrect} {q.correctAnswer}</p>
                 )}
               </div>
            )}
          </div>
        );
      })}

      <div className={`sticky bottom-4 ${theme === 'dark' ? 'bg-slate-900/90' : 'bg-white/90'} backdrop-blur p-4 rounded-xl shadow-lg border ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'} flex justify-between items-center`}>
        {!showResults ? (
          <button
            onClick={() => setShowResults(true)}
            disabled={Object.keys(selectedAnswers).length < questions.length}
            className={`w-full text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${s.actionBtn}`}
          >
            {t.check_result}
          </button>
        ) : (
          <div className="w-full text-center">
            <span className={`text-xl font-bold ${s.text}`}>
              {t.result_score} {calculateScore()} / {questions.length}
            </span>
            <button 
              onClick={() => { setShowResults(false); setSelectedAnswers({}); }}
              className={`ml-4 underline ${theme === 'dark' ? 'text-indigo-400 hover:text-indigo-300' : 'text-green-600 hover:text-green-800'}`}
            >
              {t.retake}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizView;