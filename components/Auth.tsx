
import React, { useState } from 'react';
import { db } from '../services/supabaseService';
import { useLanguage } from './LanguageContext';

interface AuthProps {
  onSuccess: () => void;
}

type AuthStep = 'login' | 'initial-email' | 'details' | 'account' | 'emotional-loading' | 'success';

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
    "Securing your campus session...",
    "Gathering local favorites...",
    "Assembling your personalized feed...",
    "Connecting you to the community...",
    "Almost there, Savvy Student..."
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
    }, 1100);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await db.login(formData.email, formData.password);
      runEmotionalLoading(onSuccess);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
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
        alert("Registration complete! Welcome to Savvy Market. Please check your email for a verification link.");
        setStep('login');
      });
    } catch (err: any) {
      console.error("Registration Error:", err);
      setError(err.message || 'Registration failed. Please try again.');
    }
  };

  const handleInitialEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setStep('details');
  };

  if (step === 'emotional-loading') {
    return (
      <div className="fixed inset-0 z-[200] bg-white dark:bg-black flex flex-col items-center justify-center p-12 text-center animate-in fade-in duration-1000">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="relative z-10 space-y-12">
          <div className="relative inline-block">
            <div className="w-32 h-32 border-4 border-savvy-pink/20 border-t-savvy-pink rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center font-black text-4xl dark:text-white">ሳ</div>
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl sm:text-6xl font-black text-black dark:text-white tracking-tighter transition-all duration-700">
              {loadingMessage}
            </h2>
            <p className="text-savvy-amber font-black uppercase tracking-[0.4em] text-xs animate-pulse">Building your future market</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[90vh] flex items-center justify-center p-6 bg-transparent">
      <div className="w-full max-w-xl bg-white/80 dark:bg-[#0c0c0e]/80 backdrop-blur-3xl rounded-[3.5rem] p-10 sm:p-16 shadow-[0_40px_120px_-20px_rgba(99,102,241,0.3)] border border-indigo-500/10 transition-all">
        <div className="text-center mb-14">
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 via-pink-500 to-amber-500 rounded-[2rem] flex items-center justify-center text-white font-black text-5xl mx-auto mb-10 shadow-2xl animate-subtle">ሳ</div>
          <h2 className="text-5xl font-black text-black dark:text-white tracking-tighter mb-4">
            {step === 'login' ? 'Welcome Back' : 'Join Savvy Market'}
          </h2>
          <p className="text-gray-400 font-medium text-lg tracking-tight">Optimizing your campus commerce experience.</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-500/10 text-red-500 p-6 rounded-[1.5rem] mb-10 text-sm font-bold border border-red-100 dark:border-red-500/20 animate-in slide-in-from-top-4 duration-300">
            <span className="mr-2">⚠️</span> {error}
          </div>
        )}

        {step === 'login' && (
          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-3">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-2">{t('email')}</label>
              <input 
                type="email" 
                required 
                className="w-full bg-gray-50/50 dark:bg-white/5 border-2 border-transparent focus:border-savvy-pink rounded-[1.5rem] px-8 py-6 outline-none dark:text-white font-bold text-lg transition-all" 
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})} 
                placeholder="you@email.com"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-2">{t('password')}</label>
              <input 
                type="password" 
                required 
                className="w-full bg-gray-50/50 dark:bg-white/5 border-2 border-transparent focus:border-savvy-pink rounded-[1.5rem] px-8 py-6 outline-none dark:text-white font-bold text-lg transition-all" 
                value={formData.password} 
                onChange={e => setFormData({...formData, password: e.target.value})} 
                placeholder="••••••••"
              />
            </div>
            <button type="submit" className="w-full py-7 rounded-[2rem] btn-hope font-black text-sm uppercase tracking-[0.25em] shadow-2xl mt-4">
              {t('login')}
            </button>
            <button type="button" onClick={() => setStep('initial-email')} className="w-full text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] hover:text-savvy-pink transition-colors py-4">
              Don't have an account? <span className="underline decoration-indigo-500/30 underline-offset-4">Create one</span>
            </button>
          </form>
        )}

        {step === 'initial-email' && (
          <form onSubmit={handleInitialEmail} className="space-y-10 animate-in fade-in slide-in-from-right-4">
            <div className="space-y-4">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-2">{t('email')}</label>
              <input 
                type="email" 
                required 
                className="w-full bg-gray-50/50 dark:bg-white/5 border-2 border-transparent focus:border-savvy-primary rounded-[1.5rem] px-8 py-6 outline-none dark:text-white font-bold text-lg transition-all" 
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})} 
                placeholder="Enter your email address"
              />
              <p className="text-[10px] text-gray-400 font-medium px-2 italic">( {t('emailHint')} )</p>
            </div>
            <button type="submit" className="w-full py-7 rounded-[2.5rem] bg-black dark:bg-white text-white dark:text-black font-black text-sm uppercase tracking-[0.25em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
              {t('continue')} <span className="ml-2">→</span>
            </button>
            <button type="button" onClick={() => setStep('login')} className="w-full text-[11px] font-black text-gray-400 uppercase tracking-widest hover:text-black dark:hover:text-white py-2">Return to Login</button>
          </form>
        )}

        {step === 'details' && (
          <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
            <div>
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest block mb-10 px-2">{t('pickInterests')}</label>
              <div className="grid grid-cols-2 gap-5">
                {['goods', 'course', 'academic_materials', 'food'].map(id => (
                  <button 
                    key={id}
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      preferences: prev.preferences.includes(id) ? prev.preferences.filter(p => p !== id) : [...prev.preferences, id]
                    }))}
                    className={`p-10 rounded-[2.5rem] border-2 transition-all duration-300 text-left ${formData.preferences.includes(id) ? 'border-savvy-pink bg-savvy-pink/5 scale-95 shadow-inner' : 'border-gray-100 dark:border-white/5 bg-gray-50/30 dark:bg-white/2 hover:border-indigo-500/20'}`}
                  >
                    <p className="font-black text-xs uppercase tracking-widest dark:text-white">{t(id)}</p>
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => setStep('account')} className="w-full py-7 rounded-[2.5rem] bg-indigo-600 text-white font-black text-sm uppercase tracking-[0.25em] shadow-xl hover:scale-[1.02] transition-all">
              {t('nextStep')} <span className="ml-2">→</span>
            </button>
          </div>
        )}

        {step === 'account' && (
          <form onSubmit={handleRegister} className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="space-y-4">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-2">{t('fullName')}</label>
              <input 
                required 
                className="w-full bg-gray-50/50 dark:bg-white/5 border-2 border-transparent focus:border-savvy-amber rounded-[1.5rem] px-8 py-6 outline-none dark:text-white font-bold text-lg transition-all" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                placeholder="Full Name"
              />
            </div>
            <div className="space-y-4">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-2">{t('password')}</label>
              <input 
                type="password" 
                required 
                className="w-full bg-gray-50/50 dark:bg-white/5 border-2 border-transparent focus:border-savvy-amber rounded-[1.5rem] px-8 py-6 outline-none dark:text-white font-bold text-lg transition-all" 
                value={formData.password} 
                onChange={e => setFormData({...formData, password: e.target.value})} 
                placeholder="••••••••"
              />
              <p className="text-[10px] text-gray-400 font-medium px-2">{t('min6Chars')}</p>
            </div>
            <button type="submit" className="w-full py-7 rounded-[2.5rem] btn-hope font-black text-sm uppercase tracking-[0.25em] shadow-2xl">
              {t('finalize')}
            </button>
            <button type="button" onClick={() => setStep('details')} className="w-full text-[11px] font-black text-gray-400 uppercase tracking-widest py-2">Go Back</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Auth;
