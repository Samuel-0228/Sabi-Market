
import React, { useState } from 'react';
import { db } from '../services/supabaseService';
import { useLanguage } from './LanguageContext';

interface AuthProps {
  onSuccess: () => void;
}

type AuthStep = 'login' | 'initial-email' | 'details' | 'account' | 'emotional-loading';

const Auth: React.FC<AuthProps> = ({ onSuccess }) => {
  const { t } = useLanguage();
  const [step, setStep] = useState<AuthStep>('login');
  const [loadingMessage, setLoadingMessage] = useState('Verifying your identity...');
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '', 
    name: '', 
    preferences: [] as string[] 
  });
  const [error, setError] = useState('');

  const loadingSequence = [
    "Verifying credentials...",
    "Securing campus session...",
    "Connecting to AAU node...",
    "Syncing with Savvy Market...",
    "Finalizing profile data..."
  ];

  const runEmotionalLoading = (finalAction: () => void) => {
    setStep('emotional-loading');
    let i = 0;
    const interval = setInterval(() => {
      i++;
      if (i < loadingSequence.length) {
        setLoadingMessage(loadingSequence[i]);
      } else {
        clearInterval(interval);
        finalAction();
      }
    }, 800);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await db.login(formData.email, formData.password);
      // Success will be handled by App.tsx onAuthStateChange
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (!formData.name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    
    try {
      await db.register(formData.email, formData.password, formData.name, formData.preferences);
      runEmotionalLoading(() => {
        // App.tsx handles navigation via onAuthStateChange. 
        // We call onSuccess as a fallback/clean-up.
        onSuccess();
      });
    } catch (err: any) {
      console.error("Registration UI error:", err);
      setError(err.message || 'Registration failed. Try again.');
    }
  };

  const handleInitialEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email.includes('@')) {
      setError('Invalid email address.');
      return;
    }
    setError('');
    setStep('details');
  };

  if (step === 'emotional-loading') {
    return (
      <div className="fixed inset-0 z-[200] bg-white dark:bg-black flex flex-col items-center justify-center p-12 text-center animate-in fade-in duration-700">
        <div className="w-20 h-20 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-8"></div>
        <h2 className="text-4xl font-black text-black dark:text-white tracking-tighter mb-4">{loadingMessage}</h2>
        <p className="text-indigo-500 font-black uppercase tracking-[0.4em] text-[10px] animate-pulse">Launching your experience</p>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-white dark:bg-[#0c0c0e] rounded-[3rem] p-10 sm:p-16 shadow-2xl border border-indigo-500/10 transition-all">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white font-black text-4xl mx-auto mb-8 shadow-xl">ሳ</div>
          <h2 className="text-4xl font-black text-black dark:text-white tracking-tighter mb-4">
            {step === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-gray-400 font-medium">Addis Ababa University Marketplace</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-500/10 text-red-500 p-5 rounded-2xl mb-8 text-xs font-bold border border-red-100 dark:border-red-500/20">
            {error}
          </div>
        )}

        {step === 'login' && (
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">{t('email')}</label>
              <input type="email" required className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl px-6 py-5 outline-none dark:text-white font-bold focus:ring-2 focus:ring-indigo-600" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">{t('password')}</label>
              <input type="password" required className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl px-6 py-5 outline-none dark:text-white font-bold focus:ring-2 focus:ring-indigo-600" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
            </div>
            <button type="submit" className="w-full py-6 rounded-[1.5rem] bg-indigo-600 text-white font-black text-sm uppercase tracking-widest shadow-xl hover:scale-[1.02] transition-all">
              {t('login')}
            </button>
            <button type="button" onClick={() => setStep('initial-email')} className="w-full text-[10px] font-black text-gray-400 uppercase tracking-widest py-4">New here? Sign up</button>
          </form>
        )}

        {step === 'initial-email' && (
          <form onSubmit={handleInitialEmail} className="space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">{t('email')}</label>
              <input type="email" required placeholder="yourname@aau.edu.et" className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl px-6 py-5 outline-none dark:text-white font-bold focus:ring-2 focus:ring-indigo-600" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              <p className="text-[9px] text-gray-400 italic px-2">{t('emailHint')}</p>
            </div>
            <button type="submit" className="w-full py-6 rounded-[1.5rem] bg-black dark:bg-white text-white dark:text-black font-black text-sm uppercase tracking-widest shadow-xl">
              {t('continue')}
            </button>
            <button type="button" onClick={() => setStep('login')} className="w-full text-[10px] font-black text-gray-400 uppercase tracking-widest py-2">Back to Login</button>
          </form>
        )}

        {step === 'details' && (
          <div className="space-y-10 animate-in fade-in duration-500">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-8 px-2">{t('pickInterests')}</label>
              <div className="grid grid-cols-2 gap-4">
                {['goods', 'course', 'academic_materials', 'food'].map(id => (
                  <button 
                    key={id}
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      preferences: prev.preferences.includes(id) ? prev.preferences.filter(p => p !== id) : [...prev.preferences, id]
                    }))}
                    className={`p-6 rounded-[1.5rem] border-2 transition-all ${formData.preferences.includes(id) ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/10' : 'border-gray-50 dark:border-white/5 bg-gray-50/50 dark:bg-white/2'}`}
                  >
                    <p className="font-black text-[10px] uppercase tracking-wider dark:text-white">{t(id)}</p>
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => setStep('account')} className="w-full py-6 rounded-[1.5rem] bg-indigo-600 text-white font-black text-sm uppercase tracking-widest shadow-xl">
              {t('nextStep')}
            </button>
          </div>
        )}

        {step === 'account' && (
          <form onSubmit={handleRegister} className="space-y-8 animate-in fade-in duration-500">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">{t('fullName')}</label>
              <input required className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl px-6 py-5 outline-none dark:text-white font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">{t('password')}</label>
              <input type="password" required className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl px-6 py-5 outline-none dark:text-white font-bold" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              <p className="text-[9px] text-gray-400 px-2">{t('min6Chars')}</p>
            </div>
            <button type="submit" className="w-full py-6 rounded-[1.5rem] bg-indigo-600 text-white font-black text-sm uppercase tracking-widest shadow-xl">
              {t('finalize')}
            </button>
            <button type="button" onClick={() => setStep('details')} className="w-full text-[10px] font-black text-gray-400 uppercase tracking-widest py-2">Go Back</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Auth;
