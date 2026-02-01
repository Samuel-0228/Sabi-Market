
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
  const [loadingMsg, setLoadingMsg] = useState('');
  const [error, setError] = useState('');

  const PREFERENCE_OPTIONS = [
    { id: 'course', label: t('course'), icon: '📚' },
    { id: 'academic_materials', label: t('academic_materials'), icon: '✏️' },
    { id: 'goods', label: t('goods'), icon: '⚡' },
    { id: 'food', label: t('food'), icon: '🍔' },
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
    if (formData.password.length < 6) { setError('Password must be 6+ chars'); return; }
    setLoading(true);
    setLoadingMsg("Creating your student profile...");
    try {
      await db.register(formData.email, formData.password, formData.name, formData.preferences);
      setStep('verify');
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoadingMsg("Getting your favorites...");
    try {
      await db.login(formData.email, formData.password);
      setLoadingMsg("Assembling your homepage...");
      setTimeout(onSuccess, 1000);
    } catch (err: any) { setError(err.message); setLoading(false); }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-12 text-center animate-in fade-in duration-500">
         <div className="relative mb-10">
           <div className="w-20 h-20 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
           <div className="absolute inset-0 flex items-center justify-center font-black text-xl text-black dark:text-white">ሳ</div>
         </div>
         <h2 className="text-2xl font-black dark:text-white mb-2">{loadingMsg}</h2>
         <p className="text-gray-400 font-medium uppercase text-[10px] tracking-[0.2em] pulse-slow">Savvy Security Protocol Active</p>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="bg-white dark:bg-[#0f0f12] w-full max-w-lg rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(99,102,241,0.15)] p-10 sm:p-14 border border-indigo-500/5">
        <div className="mb-12 text-center">
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white font-black text-4xl mx-auto mb-8 shadow-[0_20px_40px_-10px_rgba(79,70,229,0.4)]">ሳ</div>
          <h2 className="text-4xl font-black text-black dark:text-white tracking-tighter mb-2">{t('welcome')}</h2>
          <p className="text-gray-400 font-medium text-sm tracking-tight">{t('exclusiveMarket')}</p>
        </div>

        {error && <div className="bg-red-50 dark:bg-red-500/10 text-red-500 p-5 rounded-2xl mb-8 text-sm font-bold border border-red-100 dark:border-red-500/20">{error}</div>}

        {step === 'initial' && (
          <form onSubmit={handleStart} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">University Email</label>
              <input type="email" required className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl px-8 py-6 focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white transition-all font-bold text-lg" placeholder="id@aau.edu.et" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
            </div>
            <button className="w-full bg-black dark:bg-white text-white dark:text-black py-6 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
              {t('continue')} <span className="ml-2">→</span>
            </button>
            <p className="text-center text-gray-400 text-[10px] font-bold pt-6 uppercase tracking-widest">Already have an account? <button type="button" onClick={() => setStep('login')} className="text-indigo-600 dark:text-indigo-400 underline ml-1">Login</button></p>
          </form>
        )}

        {step === 'details' && (
          <div className="space-y-10">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-6 px-1">{t('pickInterests')}</label>
              <div className="grid grid-cols-2 gap-4">
                {PREFERENCE_OPTIONS.map(opt => (
                  <button key={opt.id} onClick={() => handleTogglePreference(opt.id)} className={`p-8 rounded-[2.5rem] border-2 text-left transition-all duration-300 ${formData.preferences.includes(opt.id) ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 scale-95' : 'border-gray-50 dark:border-white/5 bg-gray-50/50 dark:bg-white/2 hover:border-indigo-500/20'}`}>
                    <span className="text-3xl mb-6 block floating" style={{animationDelay: `${Math.random()}s`}}>{opt.icon}</span>
                    <p className="font-black text-xs uppercase tracking-wider text-black dark:text-white">{opt.label}</p>
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => setStep('account')} className="w-full bg-black dark:bg-white text-white dark:text-black py-6 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-xl transition-all">
              {t('nextStep')}
            </button>
          </div>
        )}

        {step === 'account' && (
          <form onSubmit={handleRegister} className="space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Full Identity Name</label>
              <input required className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl px-8 py-6 outline-none dark:text-white font-bold text-lg" placeholder="Student Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Secure Password</label>
              <input type="password" required className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl px-8 py-6 outline-none dark:text-white font-bold text-lg" placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
            </div>
            <button disabled={loading} className="w-full bg-indigo-600 text-white py-6 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-700 transition-all">
              {t('finalize')}
            </button>
          </form>
        )}

        {step === 'login' && (
          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">University Email</label>
              <input type="email" required className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl px-8 py-6 outline-none dark:text-white font-bold text-lg" placeholder="id@aau.edu.et" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Password</label>
              <input type="password" required className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl px-8 py-6 outline-none dark:text-white font-bold text-lg" placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
            </div>
            <button disabled={loading} className="w-full bg-black dark:bg-white text-white dark:text-black py-6 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-xl transition-all">
              {t('login')}
            </button>
            <button type="button" onClick={() => setStep('initial')} className="w-full text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-indigo-500 transition-colors pt-4">Need an account? Join Savvy</button>
          </form>
        )}

        {step === 'verify' && (
          <div className="text-center py-10">
            <div className="text-7xl mb-10">📧</div>
            <h2 className="text-3xl font-black mb-4 dark:text-white">{t('checkInbox')}</h2>
            <p className="text-gray-400 mb-12 font-medium">{t('verificationText')} <span className="text-indigo-600 dark:text-indigo-400 font-bold">{formData.email}</span></p>
            <button onClick={() => setStep('login')} className="w-full bg-black dark:bg-white text-white dark:text-black py-6 rounded-[2.5rem] font-black uppercase tracking-widest text-sm shadow-xl">Go to Login</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;
