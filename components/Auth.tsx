
import React, { useState } from 'react';
import { db } from '../services/supabaseService';
import { useLanguage } from './LanguageContext';

interface AuthProps {
  onSuccess: () => void;
}

type AuthStep = 'initial' | 'details' | 'account' | 'verify';

const Auth: React.FC<AuthProps> = ({ onSuccess }) => {
  const { t } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState<AuthStep>('initial');
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '', 
    name: '',
    preferences: [] as string[]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const PREFERENCE_OPTIONS = [
    { id: 'goods', label: 'Used Goods', icon: '📦' },
    { id: 'tutoring', label: 'Tutoring', icon: '📚' },
    { id: 'digital', label: 'Digital Courses', icon: '💻' },
    { id: 'services', label: 'Services', icon: '🛠️' },
  ];

  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
  };

  const handleNextStep = () => {
    if (step === 'details' && !formData.name) {
      setError('Please provide your name.');
      return;
    }
    if (step === 'details' && formData.preferences.length === 0) {
      setError('Select at least one interest.');
      return;
    }
    setError('');
    setStep('account');
  };

  const handleTogglePreference = (id: string) => {
    setFormData(prev => ({
      ...prev,
      preferences: prev.preferences.includes(id) 
        ? prev.preferences.filter(p => p !== id)
        : [...prev.preferences, id]
    }));
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(formData.email)) {
      setError('Please provide a valid working email address.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await db.login(formData.email, formData.password);
        onSuccess();
      } else {
        await db.register(formData.email, formData.password, formData.name, formData.preferences);
        setStep('verify');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'verify') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 border border-gray-100 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>
          <div className="text-6xl mb-6 animate-bounce">✉️</div>
          <h2 className="text-2xl font-black text-gray-900 mb-4">Check your Inbox!</h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            We have sent a verification link to <span className="font-bold text-indigo-600">{formData.email}</span>. 
            Please verify your email to access the marketplace.
          </p>
          <div className="bg-gray-50 rounded-2xl p-4 mb-8 text-xs text-gray-500 italic">
            Email sent from: <span className="font-semibold">savvysocietyteam@outlook.com</span>
          </div>
          <button 
            onClick={() => { setStep('initial'); setIsLogin(true); }}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-indigo-700 transition-all"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 md:p-12 border border-gray-100 overflow-hidden relative">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-50 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-blue-50 rounded-full blur-3xl"></div>
        
        <div className="relative text-center mb-10">
          <div className="w-16 h-16 bg-indigo-600 rounded-3xl mx-auto flex items-center justify-center text-white text-3xl font-black shadow-lg mb-4">
            ሳ
          </div>
          <h2 className="text-3xl font-black text-gray-900">
            {isLogin ? t('login') : (step === 'details' ? 'Welcome' : 'Secure Account')}
          </h2>
          <p className="text-gray-400 text-sm mt-2">
            {isLogin ? t('slogan') : (step === 'details' ? 'Tell us about yourself' : 'Last step to join Savvy')}
          </p>
        </div>

        {isLogin ? (
          <form onSubmit={handleAuth} className="space-y-6 relative">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase ml-2 tracking-widest">{t('email')}</label>
              <input 
                type="email"
                required
                className="w-full mt-1 bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase ml-2 tracking-widest">{t('password')}</label>
              <input 
                type="password"
                required
                className="w-full mt-1 bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
            {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-5 rounded-[1.5rem] font-bold shadow-xl hover:bg-indigo-700 transition-all"
            >
              {loading ? 'Processing...' : t('login')}
            </button>
            <div className="text-center">
              <button 
                type="button"
                onClick={() => { setIsLogin(false); setStep('details'); setError(''); }}
                className="text-indigo-600 text-sm font-bold hover:underline"
              >
                Need an account? Register
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6 relative">
            {step === 'details' ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase ml-2 tracking-widest">{t('fullName')}</label>
                  <input 
                    required
                    className="w-full mt-1 bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Abebe Balcha"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase ml-2 tracking-widest mb-2 block">I am interested in:</label>
                  <div className="grid grid-cols-2 gap-3">
                    {PREFERENCE_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleTogglePreference(opt.id)}
                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${
                          formData.preferences.includes(opt.id)
                            ? 'bg-indigo-50 border-indigo-600 scale-95 shadow-inner'
                            : 'bg-white border-gray-50 hover:border-gray-200'
                        }`}
                      >
                        <span className="text-2xl">{opt.icon}</span>
                        <span className={`text-[10px] font-bold uppercase ${formData.preferences.includes(opt.id) ? 'text-indigo-700' : 'text-gray-400'}`}>
                          {opt.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}
                <button 
                  onClick={handleNextStep}
                  className="w-full bg-indigo-600 text-white py-5 rounded-[1.5rem] font-bold shadow-xl hover:bg-indigo-700 transition-all"
                >
                  Continue →
                </button>
                <div className="text-center">
                  <button 
                    onClick={() => { setIsLogin(true); setStep('initial'); }}
                    className="text-gray-400 text-xs font-bold hover:text-indigo-600"
                  >
                    Back to Login
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAuth} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase ml-2 tracking-widest">{t('email')}</label>
                  <input 
                    type="email"
                    required
                    className="w-full mt-1 bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="id@aau.edu.et"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase ml-2 tracking-widest">{t('password')}</label>
                  <input 
                    type="password"
                    required
                    className="w-full mt-1 bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="At least 6 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>
                {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white py-5 rounded-[1.5rem] font-bold shadow-xl hover:bg-indigo-700 transition-all"
                >
                  {loading ? 'Creating Account...' : 'Register Account'}
                </button>
                <div className="text-center">
                  <button 
                    type="button"
                    onClick={() => setStep('details')}
                    className="text-gray-400 text-xs font-bold hover:text-indigo-600"
                  >
                    ← Back to Preferences
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;
