
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
    try {
      await db.register(formData.email, formData.password, formData.name, formData.preferences);
      setStep('verify');
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await db.login(formData.email, formData.password);
      onSuccess();
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="bg-white dark:bg-[#141414] w-full max-w-lg rounded-[2.5rem] shadow-2xl p-8 sm:p-12 border border-gray-100 dark:border-white/5">
        <div className="mb-10 text-center">
          <div className="w-16 h-16 bg-black dark:bg-white rounded-2xl flex items-center justify-center text-white dark:text-black font-bold text-3xl mx-auto mb-6 shadow-xl">ሳ</div>
          <h2 className="text-4xl font-black text-black dark:text-white tracking-tighter">{t('welcome')}</h2>
        </div>

        {error && <div className="bg-red-50 text-red-500 p-4 rounded-xl mb-6 text-sm font-bold border border-red-100">{error}</div>}

        {step === 'initial' && (
          <form onSubmit={handleStart} className="space-y-6">
            <input type="email" required className="w-full bg-gray-50 dark:bg-black/50 border-none rounded-2xl px-6 py-5 focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white" placeholder="id@aau.edu.et" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
            <button className="w-full bg-black dark:bg-white text-white dark:text-black py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl active:scale-95">
              {t('continue')} <span className="text-lg">→</span>
            </button>
            <p className="text-center text-gray-400 text-[10px] font-bold pt-4 uppercase tracking-widest">Already have an account? <button type="button" onClick={() => setStep('login')} className="text-black dark:text-white underline">Login</button></p>
          </form>
        )}

        {step === 'details' && (
          <div className="space-y-8">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-6 px-1">{t('pickInterests')}</label>
            <div className="grid grid-cols-2 gap-4">
              {PREFERENCE_OPTIONS.map(opt => (
                <button key={opt.id} onClick={() => handleTogglePreference(opt.id)} className={`p-6 rounded-3xl border-2 text-left transition-all ${formData.preferences.includes(opt.id) ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 scale-95' : 'border-gray-50 dark:border-white/5'}`}>
                  <span className="text-2xl mb-4 block">{opt.icon}</span>
                  <p className="font-bold text-sm text-black dark:text-white">{opt.label}</p>
                </button>
              ))}
            </div>
            <button onClick={() => setStep('account')} className="w-full bg-black dark:bg-white text-white dark:text-black py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl">
              {t('nextStep')}
            </button>
          </div>
        )}

        {step === 'account' && (
          <form onSubmit={handleRegister} className="space-y-6">
            <input required className="w-full bg-gray-50 dark:bg-black/50 border-none rounded-2xl px-6 py-5 outline-none dark:text-white" placeholder="Full Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            <input type="password" required className="w-full bg-gray-50 dark:bg-black/50 border-none rounded-2xl px-6 py-5 outline-none dark:text-white" placeholder="Min 6 characters" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
            <button disabled={loading} className="w-full bg-black dark:bg-white text-white dark:text-black py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl">
              {loading ? 'Processing...' : t('finalize')}
            </button>
          </form>
        )}

        {step === 'login' && (
          <form onSubmit={handleLogin} className="space-y-6">
            <input type="email" required className="w-full bg-gray-50 dark:bg-black/50 border-none rounded-2xl px-6 py-5 outline-none dark:text-white" placeholder="Email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
            <input type="password" required className="w-full bg-gray-50 dark:bg-black/50 border-none rounded-2xl px-6 py-5 outline-none dark:text-white" placeholder="Password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
            <button disabled={loading} className="w-full bg-black dark:bg-white text-white dark:text-black py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl">
              {loading ? 'Processing...' : t('login')}
            </button>
            <button type="button" onClick={() => setStep('initial')} className="w-full text-[10px] font-black text-gray-400 uppercase tracking-widest">Need an account? Register</button>
          </form>
        )}

        {step === 'verify' && (
          <div className="text-center">
            <h2 className="text-3xl font-black mb-4">Check Inbox</h2>
            <p className="text-gray-400 mb-8">We've sent a link to {formData.email}</p>
            <button onClick={() => setStep('login')} className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs">Login</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;
