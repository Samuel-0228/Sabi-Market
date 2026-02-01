
import React, { useState } from 'react';
import { db } from '../services/supabaseService';
import { useLanguage } from './LanguageContext';

interface AuthProps {
  onSuccess: () => void;
  initialEmail?: string;
}

type AuthStep = 'initial' | 'details' | 'account' | 'verify' | 'login';

const Auth: React.FC<AuthProps> = ({ onSuccess, initialEmail = '' }) => {
  const { t } = useLanguage();
  const [step, setStep] = useState<AuthStep>(initialEmail ? 'details' : 'initial');
  const [formData, setFormData] = useState({ 
    email: initialEmail, 
    password: '', 
    name: '',
    preferences: [] as string[]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const PREFERENCE_OPTIONS = [
    { id: 'goods', label: t('goods'), icon: '⚡' },
    { id: 'tutoring', label: t('tutoring'), icon: '🧠' },
    { id: 'digital', label: t('digital'), icon: '🎨' },
    { id: 'services', label: t('services'), icon: '🤝' },
  ];

  const validateEmail = (email: string) => {
    return String(email).toLowerCase().match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
  };

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(formData.email)) {
      setError('Enter a valid university email');
      return;
    }
    setError('');
    setStep('details');
  };

  const handleTogglePreference = (id: string) => {
    setFormData(prev => ({
      ...prev,
      preferences: prev.preferences.includes(id) 
        ? prev.preferences.filter(p => p !== id)
        : [...prev.preferences, id]
    }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await db.register(formData.email, formData.password, formData.name, formData.preferences);
      setStep('verify');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await db.login(formData.email, formData.password);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'verify') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6 reveal">
        <div className="bg-white dark:bg-[#141414] w-full max-w-lg rounded-[2.5rem] shadow-2xl p-12 text-center border border-gray-50 dark:border-white/5">
          <div className="w-20 h-20 bg-black dark:bg-white rounded-3xl flex items-center justify-center mx-auto mb-10 rotate-3 shadow-xl">
            <span className="text-white dark:text-black text-4xl">📧</span>
          </div>
          <h2 className="text-3xl font-black text-black dark:text-white mb-4">{t('checkInbox')}</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">{t('verificationText')} <span className="text-black dark:text-white font-bold">{formData.email}</span>.</p>
          <button 
            onClick={() => setStep('login')}
            className="w-full bg-black dark:bg-white text-white dark:text-black py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl transition-all active:scale-95"
          >
            {t('login')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="bg-white dark:bg-[#141414] w-full max-w-lg rounded-[2.5rem] shadow-2xl p-8 sm:p-12 border border-gray-100 dark:border-white/5 animate-in fade-in zoom-in-95 duration-700">
        <div className="mb-10 text-center">
          <div className="w-16 h-16 bg-black dark:bg-white rounded-2xl flex items-center justify-center text-white dark:text-black font-bold text-3xl mx-auto mb-6 shadow-xl">ሳ</div>
          <h2 className="text-4xl font-black text-black dark:text-white tracking-tighter">{t('welcome')}</h2>
          <p className="text-gray-400 dark:text-gray-500 font-medium mt-2">{t('exclusiveMarket')}</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-500/10 text-red-500 p-4 rounded-xl mb-6 text-sm font-bold border border-red-100 dark:border-red-500/20 animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}

        {step === 'initial' && (
          <form onSubmit={handleStart} className="space-y-6">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">{t('universityEmail')}</label>
              <input 
                type="email"
                required
                className="w-full bg-gray-50 dark:bg-black/50 border-none rounded-2xl px-6 py-5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                placeholder="id@aau.edu.et"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <button className="w-full bg-black dark:bg-white text-white dark:text-black py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-all flex items-center justify-center gap-3 active:scale-95">
              {t('continue')} <span className="text-lg">→</span>
            </button>
            <p className="text-center text-gray-400 text-[10px] font-bold uppercase tracking-widest pt-4">
              {t('alreadyHaveAccount')} <button type="button" onClick={() => setStep('login')} className="text-black dark:text-white underline">{t('login')}</button>
            </p>
          </form>
        )}

        {step === 'details' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-6 px-1">{t('pickInterests')}</label>
              <div className="grid grid-cols-2 gap-4">
                {PREFERENCE_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleTogglePreference(opt.id)}
                    className={`p-6 rounded-3xl border-2 text-left transition-all ${
                      formData.preferences.includes(opt.id) 
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 scale-95 shadow-inner' 
                      : 'border-gray-50 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10'
                    }`}
                  >
                    <span className="text-2xl mb-4 block">{opt.icon}</span>
                    <p className="font-bold text-sm text-black dark:text-white">{opt.label}</p>
                  </button>
                ))}
              </div>
            </div>
            <button 
              onClick={() => setStep('account')}
              className="w-full bg-black dark:bg-white text-white dark:text-black py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-all"
            >
              {t('nextStep')}
            </button>
          </div>
        )}

        {step === 'account' && (
          <form onSubmit={handleRegister} className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">{t('fullName')}</label>
              <input 
                required
                className="w-full bg-gray-50 dark:bg-black/50 border-none rounded-2xl px-6 py-5 focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                placeholder="Abebe Bikila"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">{t('createPassword')}</label>
              <input 
                type="password"
                required
                className="w-full bg-gray-50 dark:bg-black/50 border-none rounded-2xl px-6 py-5 focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                placeholder={t('min6Chars')}
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
            <button 
              disabled={loading}
              className="w-full bg-black dark:bg-white text-white dark:text-black py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-all"
            >
              {loading ? t('publishing') : t('finalize')}
            </button>
            <button type="button" onClick={() => setStep('details')} className="w-full text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('back')}</button>
          </form>
        )}

        {step === 'login' && (
          <form onSubmit={handleLogin} className="space-y-6 animate-in fade-in slide-in-from-top-4">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">{t('email')}</label>
              <input 
                type="email"
                required
                className="w-full bg-gray-50 dark:bg-black/50 border-none rounded-2xl px-6 py-5 focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">{t('password')}</label>
              <input 
                type="password"
                required
                className="w-full bg-gray-50 dark:bg-black/50 border-none rounded-2xl px-6 py-5 focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
            <button 
              disabled={loading}
              className="w-full bg-black dark:bg-white text-white dark:text-black py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-all active:scale-95"
            >
              {loading ? t('publishing') : t('login')}
            </button>
            <p className="text-center text-gray-400 text-[10px] font-bold uppercase tracking-widest pt-4">
              {t('needAccount')} <button type="button" onClick={() => setStep('initial')} className="text-black dark:text-white underline">{t('register')}</button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default Auth;
