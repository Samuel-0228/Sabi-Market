
import React, { useState, useEffect } from 'react';
import { authApi } from '../features/auth/auth.api';
import { useLanguage } from './LanguageContext';

interface AuthProps {
  onSuccess: () => void;
  initialStep?: 'login' | 'initial-email';
}

type AuthStep = 'login' | 'initial-email' | 'details' | 'account' | 'confirmation' | 'emotional-loading';

const Auth: React.FC<AuthProps> = ({ onSuccess, initialStep = 'login' }) => {
  const { t } = useLanguage();
  const [step, setStep] = useState<AuthStep>(initialStep);
  const [loadingMessage, setLoadingMessage] = useState('Verifying your identity...');
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '', 
    name: '', 
    preferences: [] as string[] 
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setStep(initialStep);
  }, [initialStep]);

  const runEmotionalLoading = (finalAction: () => void) => {
    setStep('emotional-loading');
    const sequence = ["Securing session...", "AAU Node Sync...", "Finalizing profile...", "Welcome to Savvy!"];
    let i = 0;
    const interval = setInterval(() => {
      if (i < sequence.length) {
        setLoadingMessage(sequence[i++]);
      } else {
        clearInterval(interval);
        // We let the App.tsx listener handle the actual redirection
        // but calling onSuccess for safety/immediate feedback
        finalAction();
      }
    }, 450);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.login(formData.email, formData.password);
      // App.tsx onAuthStateChange will take it from here,
      // but we show the emotional loader for UX polish.
      runEmotionalLoading(() => {
        onSuccess();
      });
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const result = await authApi.register(formData.email, formData.password, formData.name, formData.preferences);
      if (result.needsConfirmation) {
        setStep('confirmation');
      } else {
        // App.tsx onAuthStateChange handles the transition to 'home'
        // Once session is created and profile synced.
        runEmotionalLoading(() => {
          onSuccess();
        });
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
      setLoading(false);
    }
  };

  if (step === 'emotional-loading') {
    return (
      <div className="fixed inset-0 z-[200] bg-white dark:bg-[#050505] flex flex-col items-center justify-center p-12 text-center animate-in fade-in duration-700">
        <div className="relative mb-8">
           <div className="w-20 h-20 border-[4px] border-indigo-500/10 border-t-indigo-600 rounded-full animate-spin"></div>
           <div className="absolute inset-0 flex items-center justify-center font-black text-indigo-600 text-lg">ሳ</div>
        </div>
        <h2 className="text-3xl font-black text-black dark:text-white tracking-tighter mb-4 transition-all duration-300">
          {loadingMessage}
        </h2>
      </div>
    );
  }

  if (step === 'confirmation') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6 animate-in fade-in duration-500">
        <div className="w-full max-w-xl bg-white dark:bg-[#0c0c0e] rounded-[3rem] p-10 sm:p-16 shadow-2xl border border-indigo-500/10 text-center">
          <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center text-5xl mx-auto mb-8">📧</div>
          <h2 className="text-4xl font-black text-black dark:text-white tracking-tighter mb-4">Verify your email</h2>
          <p className="text-gray-500 mb-10">We've sent a link to {formData.email}. Please confirm to continue.</p>
          <button onClick={() => setStep('login')} className="w-full py-6 rounded-[1.5rem] bg-indigo-600 text-white font-black uppercase text-sm tracking-widest shadow-xl">Back to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-white dark:bg-[#0c0c0e] rounded-[3rem] p-10 sm:p-16 shadow-2xl border border-indigo-500/10 transition-all">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white font-black text-4xl mx-auto mb-8 shadow-xl">ሳ</div>
          <h2 className="text-4xl font-black text-black dark:text-white tracking-tighter mb-2">
            {step === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-gray-400 font-medium italic">Savvy Student Marketplace</p>
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
              <input type="email" required className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl px-6 py-5 outline-none dark:text-white font-bold focus:ring-2 focus:ring-indigo-600 transition-all" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">{t('password')}</label>
              <input type="password" required className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl px-6 py-5 outline-none dark:text-white font-bold focus:ring-2 focus:ring-indigo-600 transition-all" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
            </div>
            <button type="submit" disabled={loading} className="w-full py-6 rounded-[1.5rem] bg-indigo-600 text-white font-black text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-all">
              {loading ? 'Processing...' : t('login')}
            </button>
            <button type="button" onClick={() => setStep('initial-email')} className="w-full text-[10px] font-black text-gray-400 uppercase tracking-widest py-4">New here? Sign up</button>
          </form>
        )}

        {step === 'initial-email' && (
          <form onSubmit={(e) => { e.preventDefault(); setStep('details'); }} className="space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">{t('email')}</label>
              <input type="email" required placeholder="yourname@aau.edu.et" className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl px-6 py-5 outline-none dark:text-white font-bold focus:ring-2 focus:ring-indigo-600 transition-all" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <button type="submit" className="w-full py-6 rounded-[1.5rem] bg-black dark:bg-white text-white dark:text-black font-black text-sm uppercase tracking-widest shadow-xl">{t('continue')}</button>
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
                    type="button"
                    onClick={() => setFormData(p => ({...p, preferences: p.preferences.includes(id) ? p.preferences.filter(x => x !== id) : [...p.preferences, id]}))} 
                    className={`p-6 rounded-[1.5rem] border-2 transition-all text-left group ${formData.preferences.includes(id) ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/10' : 'border-gray-50 dark:border-white/5'}`}
                  >
                    <p className={`font-black text-[10px] uppercase tracking-wider ${formData.preferences.includes(id) ? 'text-indigo-600' : 'text-gray-400'}`}>{t(id)}</p>
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => setStep('account')} className="w-full py-6 rounded-[1.5rem] bg-indigo-600 text-white font-black text-sm uppercase tracking-widest shadow-xl active:scale-95">{t('nextStep')}</button>
          </div>
        )}

        {step === 'account' && (
          <form onSubmit={handleRegister} className="space-y-8 animate-in fade-in duration-500">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">{t('fullName')}</label>
              <input required className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl px-6 py-5 outline-none dark:text-white font-bold focus:ring-2 focus:ring-indigo-600 transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">{t('password')}</label>
              <input type="password" required minLength={6} className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl px-6 py-5 outline-none dark:text-white font-bold focus:ring-2 focus:ring-indigo-600 transition-all" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
            </div>
            <button type="submit" disabled={loading} className="w-full py-6 rounded-[1.5rem] bg-indigo-600 text-white font-black text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-all">
              {loading ? 'Creating Account...' : t('finalize')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Auth;
