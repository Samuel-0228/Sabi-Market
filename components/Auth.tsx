
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
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'verify') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 reveal">
        <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] p-12 text-center border border-gray-50">
          <div className="w-20 h-20 bg-gray-900 rounded-3xl flex items-center justify-center mx-auto mb-10 rotate-3">
            <span className="text-4xl text-white">📧</span>
          </div>
          <h2 className="text-4xl font-extrabold text-gray-900 mb-6 tracking-tight">Activation required</h2>
          <p className="text-gray-500 mb-10 text-lg leading-relaxed">
            Check your inbox. We've sent a link to <br/> <span className="text-black font-bold">{formData.email}</span>.
          </p>
          <button 
            onClick={() => setStep('login')}
            className="w-full bg-black text-white py-5 rounded-2xl font-bold text-lg btn-primary"
          >
            Log in now
          </button>
        </div>
      </div>
    );
  }

  if (step === 'initial') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-50 rounded-full blur-[120px] opacity-60"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-50 rounded-full blur-[120px] opacity-40"></div>

        <div className="max-w-5xl w-full text-center z-10 reveal">
          <div className="mb-12">
            <div className="w-14 h-14 bg-black rounded-2xl mx-auto flex items-center justify-center text-white text-2xl font-bold mb-8 shadow-xl">ሳ</div>
            <h1 className="text-7xl md:text-[6rem] font-black text-black mb-8 tracking-tighter leading-[0.9] text-balance">
              Commerce for <br/> <span className="text-indigo-600">the next generation.</span>
            </h1>
            <p className="text-gray-500 text-xl md:text-2xl font-medium max-w-2xl mx-auto mb-16 leading-relaxed">
              Start your student business in minutes. Simple, professional, and built for Addis Ababa University.
            </p>
            
            <form onSubmit={handleStart} className="flex flex-col md:flex-row gap-4 max-w-2xl mx-auto bg-white p-3 rounded-[2rem] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.08)] border border-gray-50">
              <input 
                type="email"
                required
                placeholder="Enter your student email"
                className="flex-1 h-16 bg-transparent rounded-2xl px-6 text-lg font-medium outline-none"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
              <button 
                type="submit"
                className="h-16 px-10 bg-black text-white font-bold text-lg rounded-[1.5rem] btn-primary flex items-center justify-center gap-2"
              >
                Join Savvy <span>→</span>
              </button>
            </form>
            {error && <p className="text-red-500 text-sm mt-6 font-semibold">{error}</p>}
          </div>

          <div className="mt-24 pt-12 border-t border-gray-100/50 flex flex-wrap items-center justify-center gap-12 text-gray-300 font-bold tracking-widest text-xs uppercase">
             <span>Trusted by 5k+ Students</span>
             <span className="h-1 w-1 bg-gray-200 rounded-full"></span>
             <span>Verified AAU Campus</span>
             <span className="h-1 w-1 bg-gray-200 rounded-full"></span>
             <span>Escrow Protected</span>
          </div>

          <div className="mt-12">
             <button 
               onClick={() => setStep('login')}
               className="text-gray-400 font-bold hover:text-black transition-all text-sm tracking-wide"
             >
               Already have a store? <span className="text-black underline underline-offset-4 decoration-2 decoration-indigo-200">Log in here</span>
             </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 reveal">
      <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.12)] p-12 md:p-16 border border-gray-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8">
           <button onClick={() => setStep('initial')} className="text-gray-400 hover:text-black transition-colors font-bold text-sm">✕</button>
        </div>

        <div className="text-center mb-12">
          <div className="w-12 h-12 bg-black rounded-xl mx-auto flex items-center justify-center text-white text-xl font-bold mb-6">ሳ</div>
          <h2 className="text-3xl font-black text-black tracking-tight">
            {step === 'details' ? 'Profile Setup' : step === 'account' ? 'Security' : 'Login'}
          </h2>
        </div>

        {step === 'details' && (
          <div className="space-y-10">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Your Full Name</label>
              <input 
                required
                className="w-full bg-gray-50 h-16 rounded-2xl px-6 font-bold text-lg outline-none border border-transparent focus:border-indigo-600 focus:bg-white transition-all"
                placeholder="Abebe Balcha"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 block">I'm here for:</label>
              <div className="grid grid-cols-2 gap-3">
                {PREFERENCE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleTogglePreference(opt.id)}
                    className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 text-center ${
                      formData.preferences.includes(opt.id)
                        ? 'bg-black border-black text-white'
                        : 'bg-white border-gray-100 hover:border-gray-900 text-gray-400'
                    }`}
                  >
                    <span className="text-2xl">{opt.icon}</span>
                    <span className="text-[9px] font-black uppercase tracking-wide">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <button 
              onClick={() => {
                if(!formData.name) return setError('Name is required');
                if(formData.preferences.length === 0) return setError('Select interests');
                setStep('account');
                setError('');
              }}
              className="w-full h-16 bg-black text-white rounded-2xl font-bold text-lg btn-primary"
            >
              Continue
            </button>
          </div>
        )}

        {step === 'account' && (
          <form onSubmit={handleRegister} className="space-y-10">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Secure Password</label>
              <input 
                type="password"
                required
                className="w-full bg-gray-50 h-16 rounded-2xl px-6 font-bold text-lg outline-none border border-transparent focus:border-indigo-600 focus:bg-white transition-all"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
            {error && <p className="text-red-500 text-sm font-bold bg-red-50 p-6 rounded-2xl">{error}</p>}
            <button 
              type="submit"
              disabled={loading}
              className="w-full h-16 bg-black text-white rounded-2xl font-bold text-lg btn-primary disabled:opacity-50"
            >
              {loading ? 'Finalizing...' : 'Create Store'}
            </button>
          </form>
        )}

        {step === 'login' && (
          <form onSubmit={handleLogin} className="space-y-8">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Email Address</label>
              <input 
                type="email"
                required
                className="w-full bg-gray-50 h-16 rounded-2xl px-6 font-bold text-lg outline-none border border-transparent focus:border-indigo-600 focus:bg-white transition-all"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Password</label>
              <input 
                type="password"
                required
                className="w-full bg-gray-50 h-16 rounded-2xl px-6 font-bold text-lg outline-none border border-transparent focus:border-indigo-600 focus:bg-white transition-all"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
            {error && <p className="text-red-500 text-sm font-bold text-center">{error}</p>}
            <button 
              type="submit"
              disabled={loading}
              className="w-full h-16 bg-black text-white rounded-2xl font-bold text-lg btn-primary"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
            <div className="text-center pt-4">
               <button type="button" onClick={() => setStep('initial')} className="text-gray-400 font-bold text-sm">Create an account</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Auth;
