import React from 'react';
import { HistoryRecord, Language, VideoTheme } from '../types';
import { translations } from '../constants/translations';
import { Clock, ChevronRight, FileText } from 'lucide-react';

interface HistoryListProps {
  isOpen: boolean;
  history: HistoryRecord[];
  onSelect: (record: HistoryRecord) => void;
  onClose: () => void;
  lang: Language;
  theme?: VideoTheme;
}

const HistoryList: React.FC<HistoryListProps> = ({ isOpen, history, onSelect, onClose, lang, theme = 'modern' }) => {
  const t = translations[lang];

  const getThemeStyles = () => {
    switch (theme) {
      case 'dark': return {
        bg: 'bg-slate-900',
        text: 'text-white',
        border: 'border-slate-800',
        itemBg: 'bg-slate-800',
        itemHover: 'hover:bg-slate-700 hover:border-indigo-500',
        muted: 'text-slate-400',
        icon: 'text-indigo-400'
      };
      case 'classic': return {
        bg: 'bg-[#f0ece2]',
        text: 'text-[#3e3b3b]',
        border: 'border-[#d1cebd]',
        itemBg: 'bg-[#fdfbf7]',
        itemHover: 'hover:bg-[#e6e2d3] hover:border-[#8b5e3c]',
        muted: 'text-[#6e6b6b]',
        icon: 'text-[#8b5e3c]'
      };
      case 'playful': return {
        bg: 'bg-yellow-50',
        text: 'text-slate-900',
        border: 'border-yellow-200',
        itemBg: 'bg-white',
        itemHover: 'hover:bg-pink-50 hover:border-pink-300',
        muted: 'text-slate-500',
        icon: 'text-pink-500'
      };
      default: return {
        bg: 'bg-white',
        text: 'text-slate-800',
        border: 'border-slate-200',
        itemBg: 'bg-slate-50',
        itemHover: 'hover:bg-green-50 hover:border-green-200',
        muted: 'text-slate-500',
        icon: 'text-green-600'
      };
    }
  };

  const s = getThemeStyles();

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 right-0 w-80 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} ${s.bg} ${s.text}`}>
        <div className="p-6 h-full flex flex-col">
          <div className={`flex justify-between items-center mb-6 border-b pb-4 ${s.border}`}>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Clock className={`w-5 h-5 ${s.icon}`} />
              {t.history_title}
            </h2>
            <button onClick={onClose} className={`${s.muted} hover:opacity-70`}>
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
            {history.length === 0 ? (
              <div className={`text-center py-10 ${s.muted}`}>
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>{t.history_empty}</p>
                <p className="text-sm">{t.history_empty_desc}</p>
              </div>
            ) : (
              history.map((record) => (
                <button
                  key={record.id}
                  onClick={() => { onSelect(record); onClose(); }}
                  className={`w-full text-left p-4 border rounded-xl transition group ${s.itemBg} ${s.border} ${s.itemHover}`}
                >
                  <h4 className={`font-semibold mb-1 line-clamp-2 group-hover:opacity-100 ${s.text}`}>
                    {record.topic}
                  </h4>
                  <div className={`flex justify-between items-center text-xs ${s.muted}`}>
                     <span>{new Date(record.createdAt).toLocaleDateString('kk-KZ')}</span>
                     <span className="uppercase text-[10px] bg-black/5 px-1 rounded">{record.data.language || 'kk'}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default HistoryList;