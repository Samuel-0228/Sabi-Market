
import React, { useState, useEffect } from 'react';
import { db } from '../services/supabaseService';
import { useLanguage } from './LanguageContext';

interface AuthProps {
  onSuccess: () => void;
}

type AuthStep = 'login' | 'register' | 'emotional-loading' | 'success';

const Auth: React.FC<AuthProps> = ({ onSuccess }) => {
  const { t } = useLanguage();
  const [step, setStep] = useState<AuthStep>('login');
  const [loadingMessage, setLoadingMessage] = useState('Checking credentials...');
  const [formData, setFormData] = useState({ email: '', password: '', name: '', preferences: [] as string[] });
  const [error, setError] = useState('');

  const loadingSequence = [
    "Checking credentials...",
    "Assembling your favorites...",
    "Finding items you'll love...",
    "Connecting you to campus..."
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
    }, 1200);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await db.login(formData.email, formData.password);
      runEmotionalLoading(onSuccess);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await db.register(formData.email, formData.password, formData.name, []);
      runEmotionalLoading(() => {
        alert("Account created! Please check your email for verification.");
        setStep('login');
      });
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    }
  };

  if (step === 'emotional-loading') {
    return (
      <div className="fixed inset-0 z-[100] bg-white dark:bg-black flex flex-col items-center justify-center p-10 text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] animate-pulse"></div>
        <div className="relative z-10">
          <div className="mb-12">
            <div className="w-24 h-24 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
          <h2 className="text-4xl font-black text-black dark:text-white tracking-tighter mb-4 transition-all duration-500">
            {loadingMessage}
          </h2>
          <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px]">Savvy Security Protocol Active</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 bg-transparent">
      <div className="w-full max-w-xl bg-white dark:bg-[#0c0c0e] rounded-[3rem] p-10 sm:p-16 shadow-[0_40px_100px_-20px_rgba(99,102,241,0.2)] border border-indigo-500/5 transition-all">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-pink-500 rounded-3xl flex items-center justify-center text-white font-black text-4xl mx-auto mb-6 shadow-xl">ሳ</div>
          <h2 className="text-4xl font-black text-black dark:text-white tracking-tighter mb-2">
            {step === 'login' ? 'Welcome Back' : 'Join the Community'}
          </h2>
          <p className="text-gray-400 font-medium text-sm">Empowering Addis Ababa University students.</p>
        </div>

        {error && <div className="bg-red-50 dark:bg-red-500/10 text-red-500 p-5 rounded-2xl mb-8 text-sm font-bold border border-red-100 dark:border-red-500/20">{error}</div>}

        <form onSubmit={step === 'login' ? handleLogin : handleRegister} className="space-y-6">
          {step === 'register' && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Full Name</label>
              <input required className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl px-8 py-6 outline-none dark:text-white font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
          )}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">University Email</label>
            <input type="email" required className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl px-8 py-6 outline-none dark:text-white font-bold" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Secure Password</label>
            <input type="password" required className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl px-8 py-6 outline-none dark:text-white font-bold" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          </div>

          <button className="w-full py-6 rounded-[2rem] btn-vibrant text-white font-black text-sm uppercase tracking-[0.2em] shadow-2xl mt-4">
            {step === 'login' ? 'Continue to Market' : 'Complete Profile'}
          </button>
        </form>

        <div className="mt-12 pt-8 border-t border-gray-100 dark:border-white/5 text-center">
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-4">
            {step === 'login' ? "New to Savvy?" : "Already a member?"}
          </p>
          <button 
            onClick={() => setStep(step === 'login' ? 'register' : 'login')}
            className="text-indigo-500 font-black uppercase tracking-widest text-xs hover:underline"
          >
            {step === 'login' ? 'Create Student Account' : 'Back to Login'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
