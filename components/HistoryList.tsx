import React from 'react';
import { HistoryRecord, Language } from '../types';
import { translations } from '../constants/translations';
import { Clock, ChevronRight, FileText } from 'lucide-react';

interface HistoryListProps {
  isOpen: boolean;
  history: HistoryRecord[];
  onSelect: (record: HistoryRecord) => void;
  onClose: () => void;
  lang: Language;
}

const HistoryList: React.FC<HistoryListProps> = ({ isOpen, history, onSelect, onClose, lang }) => {
  const t = translations[lang];

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
      <div className={`fixed inset-y-0 right-0 w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-green-600" />
              {t.history_title}
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
            {history.length === 0 ? (
              <div className="text-center text-slate-500 py-10">
                <FileText className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                <p>{t.history_empty}</p>
                <p className="text-sm">{t.history_empty_desc}</p>
              </div>
            ) : (
              history.map((record) => (
                <button
                  key={record.id}
                  onClick={() => { onSelect(record); onClose(); }}
                  className="w-full text-left p-4 bg-slate-50 hover:bg-green-50 border border-slate-100 hover:border-green-200 rounded-xl transition group"
                >
                  <h4 className="font-semibold text-slate-800 group-hover:text-green-700 mb-1 line-clamp-2">
                    {record.topic}
                  </h4>
                  <div className="flex justify-between items-center text-xs text-slate-500">
                     <span>{new Date(record.createdAt).toLocaleDateString('kk-KZ')}</span>
                     <span className="uppercase text-[10px] bg-slate-200 px-1 rounded">{record.data.language || 'kk'}</span>
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