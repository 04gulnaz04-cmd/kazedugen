import React, { useState } from 'react';
import { QuizQuestion, Language } from '../types';
import { translations } from '../constants/translations';
import { CheckCircle, XCircle } from 'lucide-react';

interface QuizViewProps {
  questions: QuizQuestion[];
  lang: Language;
}

const QuizView: React.FC<QuizViewProps> = ({ questions, lang }) => {
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

  return (
    <div className="space-y-8 max-w-3xl mx-auto p-4">
      <h2 className="text-2xl font-bold text-slate-800 border-b pb-4">{t.quiz_title}</h2>
      
      {questions.map((q, index) => {
        const isCorrect = selectedAnswers[q.id] === q.correctAnswer;
        
        return (
          <div key={q.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              {index + 1}. {q.question}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(q.options).map(([key, value]) => {
                let btnClass = "p-4 text-left rounded-lg border transition-all ";
                
                if (showResults) {
                  if (key === q.correctAnswer) {
                    btnClass += "bg-green-100 border-green-500 text-green-900 font-medium";
                  } else if (selectedAnswers[q.id] === key) {
                    btnClass += "bg-red-100 border-red-500 text-red-900";
                  } else {
                    btnClass += "bg-slate-50 border-slate-200 text-slate-400";
                  }
                } else {
                  if (selectedAnswers[q.id] === key) {
                    btnClass += "bg-green-50 border-green-500 text-green-900 shadow-md ring-1 ring-green-500";
                  } else {
                    btnClass += "bg-white border-slate-200 hover:bg-slate-50 hover:border-green-300";
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

      <div className="sticky bottom-4 bg-white/90 backdrop-blur p-4 rounded-xl shadow-lg border border-slate-200 flex justify-between items-center">
        {!showResults ? (
          <button
            onClick={() => setShowResults(true)}
            disabled={Object.keys(selectedAnswers).length < questions.length}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t.check_result}
          </button>
        ) : (
          <div className="w-full text-center">
            <span className="text-xl font-bold text-slate-800">
              {t.result_score} {calculateScore()} / {questions.length}
            </span>
            <button 
              onClick={() => { setShowResults(false); setSelectedAnswers({}); }}
              className="ml-4 text-green-600 hover:text-green-800 underline"
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