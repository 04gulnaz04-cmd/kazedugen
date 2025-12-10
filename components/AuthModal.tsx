import React, { useState } from 'react';
import { User, Language } from '../types';
import { translations } from '../constants/translations';
import * as StorageService from '../services/storageService';
import { X, Lock, Mail, User as UserIcon } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: User) => void;
  lang: Language;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin, lang }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const t = translations[lang];

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        const user = StorageService.login(email);
        if (user) {
          onLogin(user);
          onClose();
        } else {
          setError(lang === 'kk' ? 'Пайдаланушы табылмады немесе email қате.' : lang === 'ru' ? 'Пользователь не найден или ошибка email.' : 'User not found or email incorrect.');
        }
      } else {
        if (!name.trim()) {
           setError(lang === 'kk' ? 'Атыңызды енгізіңіз' : lang === 'ru' ? 'Введите имя' : 'Enter your name');
           return;
        }
        const user = StorageService.signup(name, email);
        onLogin(user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative animate-fade-in-up">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-8">
          <h2 className="text-2xl font-bold text-center mb-2">
            {isLogin ? t.auth_login_title : t.auth_signup_title}
          </h2>
          <p className="text-center text-slate-500 mb-8">
            {isLogin ? t.auth_login_desc : t.auth_signup_desc}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="relative">
                <UserIcon className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder={t.auth_name}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
            )}
            
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
              <input
                type="email"
                required
                placeholder={t.auth_email}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
              <input
                type="password"
                required
                placeholder={t.auth_password}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-green-500/30"
            >
              {isLogin ? t.login : t.signup}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-600">
            {isLogin ? t.auth_no_account : t.auth_have_account}
            <button 
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="ml-1 text-green-600 font-semibold hover:underline"
            >
              {isLogin ? t.signup : t.login}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;