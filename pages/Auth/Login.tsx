
import React, { useState } from 'react';
import { db } from '../../services/supabase/db';
import { useLanguage } from '../../app/LanguageContext';

interface AuthProps {
  onSuccess: () => void;
}

type AuthStep = 'login' | 'initial-email' | 'details' | 'account' | 'emotional-loading';

const Auth: React.FC<AuthProps> = ({ onSuccess }) => {
  const { t } = useLanguage();
  const [step, setStep] = useState<AuthStep>('login');
  const [loadingMessage, setLoadingMessage] = useState('Verifying your identity...');
  const [formData, setFormData] = useState({ email: '', password: '', name: '', preferences: [] as string[] });
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await db.login(formData.email, formData.password);
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await db.register(formData.email, formData.password, formData.name, formData.preferences);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    }
  };

  if (step === 'emotional-loading') return <div>Loading...</div>;

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-white dark:bg-[#0c0c0e] rounded-[3rem] p-10 sm:p-16 shadow-2xl">
        {step === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-6">
             <h2 className="text-4xl font-black text-center mb-8 dark:text-white">Welcome</h2>
             <input className="w-full bg-gray-50 dark:bg-white/5 p-5 rounded-2xl dark:text-white" type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
             <input className="w-full bg-gray-50 dark:bg-white/5 p-5 rounded-2xl dark:text-white" type="password" placeholder="Password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
             <button type="submit" className="w-full bg-indigo-600 text-white p-6 rounded-[1.5rem] font-black uppercase tracking-widest">{t('login')}</button>
             <button type="button" onClick={() => setStep('initial-email')} className="w-full text-gray-400 text-xs uppercase font-black">Register</button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-6">
             <h2 className="text-4xl font-black text-center mb-8 dark:text-white">Join Savvy</h2>
             <input className="w-full bg-gray-50 dark:bg-white/5 p-5 rounded-2xl dark:text-white" type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
             <input className="w-full bg-gray-50 dark:bg-white/5 p-5 rounded-2xl dark:text-white" type="text" placeholder="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
             <input className="w-full bg-gray-50 dark:bg-white/5 p-5 rounded-2xl dark:text-white" type="password" placeholder="Password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
             <button type="submit" className="w-full bg-indigo-600 text-white p-6 rounded-[1.5rem] font-black uppercase tracking-widest">{t('register')}</button>
             <button type="button" onClick={() => setStep('login')} className="w-full text-gray-400 text-xs uppercase font-black">Back to Login</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Auth;
