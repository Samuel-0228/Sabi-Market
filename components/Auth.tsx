
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
    { id: 'goods', label: 'Tech & Gear', icon: '⚡' },
    { id: 'tutoring', label: 'Learning', icon: '🧠' },
    { id: 'digital', label: 'Design & Code', icon: '🎨' },
    { id: 'services', label: 'Life Services', icon: '🤝' },
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
      <div className="min-h-screen flex items-center justify-center p-6 reveal">
        <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] p-12 text-center border border-gray-50">
          <div className="w-20 h-20 bg-gray-900 rounded-3xl flex items-center justify-center mx-auto mb-10 rotate-3">
            <span className="text-white text-4xl">📧</span>
          </div>
          <h2 className="text-3xl font-black text-black mb-4">Check your inbox</h2>
          <p className="text-gray-500 mb-8">We've sent a verification link to {formData.email}. Please verify your email to continue.</p>
          <button 
            onClick={() => setStep('login')}
            className="w-full bg-black text-white py-4 rounded-2xl font-bold"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-12 border border-gray-100">
        <div className="mb-10 text-center">
          <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center text-white font-bold text-3xl mx-auto mb-6">ሳ</div>
          <h2 className="text-4xl font-black text-black tracking-tighter">Welcome to Savvy.</h2>
          <p className="text-gray-400 font-medium mt-2">The exclusive student marketplace.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-xl mb-6 text-sm font-bold border border-red-100 animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}

        {step === 'initial' && (
          <form onSubmit={handleStart} className="space-y-6">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">University Email</label>
              <input 
                type="email"
                required
                className="w-full bg-gray-50 border-none rounded-2xl px-6 py-5 focus:ring-2 focus:ring-black outline-none transition-all"
                placeholder="id@aau.edu.et"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <button className="w-full bg-black text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-3">
              Continue <span className="text-lg">→</span>
            </button>
            <p className="text-center text-gray-400 text-[10px] font-bold uppercase tracking-widest pt-4">
              Already have an account? <button type="button" onClick={() => setStep('login')} className="text-black underline">Login</button>
            </p>
          </form>
        )}

        {step === 'details' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-6 px-1">Pick your interests</label>
              <div className="grid grid-cols-2 gap-4">
                {PREFERENCE_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleTogglePreference(opt.id)}
                    className={`p-6 rounded-3xl border-2 text-left transition-all ${
                      formData.preferences.includes(opt.id) 
                      ? 'border-black bg-gray-50 scale-95 shadow-inner' 
                      : 'border-gray-50 hover:border-gray-200'
                    }`}
                  >
                    <span className="text-2xl mb-4 block">{opt.icon}</span>
                    <p className="font-bold text-sm text-black">{opt.label}</p>
                  </button>
                ))}
              </div>
            </div>
            <button 
              onClick={() => setStep('account')}
              className="w-full bg-black text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:bg-gray-800 transition-all"
            >
              Next Step
            </button>
          </div>
        )}

        {step === 'account' && (
          <form onSubmit={handleRegister} className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">Full Name</label>
              <input 
                required
                className="w-full bg-gray-50 border-none rounded-2xl px-6 py-5 focus:ring-2 focus:ring-black outline-none"
                placeholder="Abebe Bikila"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">Create Password</label>
              <input 
                type="password"
                required
                className="w-full bg-gray-50 border-none rounded-2xl px-6 py-5 focus:ring-2 focus:ring-black outline-none"
                placeholder="Min 6 characters"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
            <button 
              disabled={loading}
              className="w-full bg-black text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:bg-gray-800 transition-all"
            >
              {loading ? 'Creating...' : 'Finalize Profile'}
            </button>
            <button type="button" onClick={() => setStep('details')} className="w-full text-[10px] font-black text-gray-400 uppercase tracking-widest">Back</button>
          </form>
        )}

        {step === 'login' && (
          <form onSubmit={handleLogin} className="space-y-6 animate-in fade-in slide-in-from-top-4">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">Email</label>
              <input 
                type="email"
                required
                className="w-full bg-gray-50 border-none rounded-2xl px-6 py-5 focus:ring-2 focus:ring-black outline-none"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">Password</label>
              <input 
                type="password"
                required
                className="w-full bg-gray-50 border-none rounded-2xl px-6 py-5 focus:ring-2 focus:ring-black outline-none"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
            <button 
              disabled={loading}
              className="w-full bg-black text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:bg-gray-800 transition-all"
            >
              {loading ? 'Logging in...' : 'Sign In'}
            </button>
            <p className="text-center text-gray-400 text-[10px] font-bold uppercase tracking-widest pt-4">
              Need an account? <button type="button" onClick={() => setStep('initial')} className="text-black underline">Register</button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default Auth;
