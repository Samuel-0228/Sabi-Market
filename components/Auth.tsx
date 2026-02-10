
import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { authApi } from '../features/auth/auth.api';
import { useLanguage } from '../app/LanguageContext';

interface AuthProps {
  onSuccess: () => void;
  initialStep?: 'login' | 'initial-email';
}

type Step = 'login' | 'initial-email' | 'details' | 'account' | 'syncing';

const Auth: React.FC<AuthProps> = ({ onSuccess, initialStep = 'login' }) => {
  const { t } = useLanguage();
  const [step, setStep] = useState<Step>(initialStep === 'login' ? 'login' : 'initial-email');
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '', 
    name: '', 
    preferences: [] as string[] 
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setStep(initialStep === 'login' ? 'login' : 'initial-email');
  }, [initialStep]);

  const handleAuth = async (isRegister: boolean) => {
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await authApi.register(formData.email, formData.password, formData.name, formData.preferences);
      } else {
        await authApi.login(formData.email, formData.password);
      }
      setStep('syncing');
      setTimeout(() => onSuccess(), 1000);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
      setLoading(false);
    }
  };

  if (step === 'syncing') {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
        <div className="w-20 h-20 border-[4px] border-indigo-500/10 border-t-indigo-600 rounded-full animate-spin mb-8" />
        <h2 className="text-3xl font-black dark:text-white tracking-tighter">Synchronizing Node...</h2>
        <p className="mt-4 text-gray-400 font-medium italic">Entering Savvy Node Space</p>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 animate-in slide-in-from-bottom-8 duration-700">
      <div className="w-full max-w-xl bg-white dark:bg-[#0c0c0e] rounded-[3.5rem] p-10 sm:p-16 shadow-2xl border border-indigo-500/5">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white font-black text-4xl mx-auto mb-8 shadow-xl transform hover:rotate-6 transition-transform">ሳ</div>
          <h2 className="text-4xl font-black dark:text-white tracking-tighter">
            {step === 'login' ? 'Welcome Back' : 'Join the Node'}
          </h2>
          <p className="mt-2 text-gray-400 font-medium italic">AAU Exclusive Marketplace</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-500/10 text-red-500 p-5 rounded-2xl mb-8 text-xs font-bold border border-red-500/10 animate-in shake">
            {error}
          </div>
        )}

        {step === 'login' && (
          <form onSubmit={(e: FormEvent) => { e.preventDefault(); handleAuth(false); }} className="space-y-6">
            <Input 
              label="Student Email" 
              type="email" 
              value={formData.email} 
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({...formData, email: e.target.value})} 
              placeholder="name@aau.edu.et" 
            />
            <Input 
              label="Access Code" 
              type="password" 
              value={formData.password} 
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({...formData, password: e.target.value})} 
            />
            <Button loading={loading}>Sign In</Button>
            <button 
              type="button" 
              onClick={() => setStep('initial-email')} 
              className="w-full text-[10px] font-black text-gray-400 uppercase tracking-widest py-4 hover:text-indigo-600 transition-colors"
            >
              First time here? Register
            </button>
          </form>
        )}

        {step === 'initial-email' && (
          <form onSubmit={(e: FormEvent) => { e.preventDefault(); setStep('details'); }} className="space-y-6">
            <Input 
              label="Academic Email" 
              type="email" 
              value={formData.email} 
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({...formData, email: e.target.value})} 
              placeholder="Required: @aau.edu.et" 
            />
            <Button>Next Step</Button>
            <button 
              type="button" 
              onClick={() => setStep('login')} 
              className="w-full text-[10px] font-black text-gray-400 uppercase tracking-widest py-4 hover:text-indigo-600 transition-colors"
            >
              Already a member? Sign In
            </button>
          </form>
        )}

        {step === 'details' && (
          <div className="space-y-8 animate-in slide-in-from-right duration-500">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Configure Interests</h4>
            <div className="grid grid-cols-2 gap-4">
              {['goods', 'course', 'academic_materials', 'food'].map(cat => (
                <button 
                  key={cat} 
                  type="button"
                  onClick={() => setFormData(p => ({
                    ...p, 
                    preferences: p.preferences.includes(cat) 
                      ? p.preferences.filter(x => x !== cat) 
                      : [...p.preferences, cat]
                  }))}
                  className={`p-6 rounded-[1.5rem] border-2 transition-all text-left group ${
                    formData.preferences.includes(cat) 
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-500/5' 
                      : 'border-gray-50 dark:border-white/5'
                  }`}
                >
                  <span className={`text-[10px] font-black uppercase tracking-wider ${
                    formData.preferences.includes(cat) ? 'text-indigo-600' : 'text-gray-400'
                  }`}>{cat.replace('_', ' ')}</span>
                </button>
              ))}
            </div>
            <Button onClick={() => setStep('account')}>Continue Setup</Button>
          </div>
        )}

        {step === 'account' && (
          <form onSubmit={(e: FormEvent) => { e.preventDefault(); handleAuth(true); }} className="space-y-6">
            <Input 
              label="Student Name" 
              value={formData.name} 
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({...formData, name: e.target.value})} 
              placeholder="Full Name"
            />
            <Input 
              label="Create Access Code" 
              type="password" 
              value={formData.password} 
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({...formData, password: e.target.value})} 
            />
            <Button loading={loading}>Finalize Identity</Button>
          </form>
        )}
      </div>
    </div>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const Input = ({ label, ...props }: InputProps) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">{label}</label>
    <input 
      required 
      className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl px-6 py-5 outline-none dark:text-white font-bold focus:ring-2 focus:ring-indigo-600 transition-all placeholder:text-gray-400" 
      {...props} 
    />
  </div>
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

const Button = ({ loading, children, ...props }: ButtonProps) => (
  <button 
    {...props} 
    disabled={loading} 
    className="w-full py-6 rounded-[1.5rem] bg-indigo-600 text-white font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50"
  >
    {loading ? 'Initializing...' : children}
  </button>
);

export default Auth;
