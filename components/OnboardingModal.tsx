import React, { useState } from 'react';
import { X, ArrowRight, BrainCircuit, PlayCircle, Video, FileText } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../constants/translations';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose, lang }) => {
  const [step, setStep] = useState(0);
  const t = translations[lang];

  if (!isOpen) return null;

  const steps = [
    {
      title: t.onboarding_title,
      desc: t.onboarding_desc,
      icon: <BrainCircuit className="w-16 h-16 text-green-600" />
    },
    {
      title: t.step_1_title,
      desc: t.step_1_desc,
      icon: <FileText className="w-16 h-16 text-purple-600" />
    },
    {
      title: t.step_2_title,
      desc: t.step_2_desc,
      icon: <PlayCircle className="w-16 h-16 text-green-600" />
    },
    {
      title: t.step_3_title,
      desc: t.step_3_desc,
      icon: <Video className="w-16 h-16 text-orange-600" />
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-bounce-in">
        
        {/* Step Content */}
        <div className="p-8 text-center">
          <div className="mb-6 flex justify-center p-4 bg-slate-50 rounded-full w-24 h-24 mx-auto items-center shadow-inner">
            {steps[step].icon}
          </div>
          
          <h3 className="text-2xl font-bold text-slate-800 mb-3">
            {steps[step].title}
          </h3>
          <p className="text-slate-600 text-lg leading-relaxed">
            {steps[step].desc}
          </p>
        </div>

        {/* Footer Navigation */}
        <div className="bg-slate-50 p-6 flex items-center justify-between border-t border-slate-100">
          <div className="flex gap-2">
            {steps.map((_, i) => (
              <div 
                key={i} 
                className={`w-2.5 h-2.5 rounded-full transition-all ${i === step ? 'bg-green-600 w-8' : 'bg-slate-300'}`}
              />
            ))}
          </div>
          
          <button 
            onClick={handleNext}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition shadow-md"
          >
            {step === steps.length - 1 ? t.btn_start : t.btn_next}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;