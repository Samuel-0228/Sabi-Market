
import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../features/auth/auth.api';
import { useAuthStore } from '../features/auth/auth.store';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { label: string; };

const Input = ({ label, ...props }: InputProps) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">{label}</label>
    <input 
      required 
      className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl px-6 py-5 outline-none dark:text-white font-bold focus:ring-2 focus:ring-indigo-600 transition-all" 
      {...props} 
    />
  </div>
);

interface AuthProps {
  onSuccess?: () => void;
  initialStep?: 'login' | 'initial-email';
}

type Step = 'login' | 'initial-email' | 'syncing';

const Auth: React.FC<AuthProps> = ({ onSuccess, initialStep = 'login' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, sync, forceInitialize, initialized } = useAuthStore();
  
  const [step, setStep] = useState<Step>(initialStep === 'login' ? 'login' : 'initial-email');
  const [formData, setFormData] = useState({ email: '', password: '', name: '', preferences: [] as string[] });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirection target
  const from = (location.state as any)?.from?.pathname || '/marketplace';

  // REACTIVE REDIRECT: If the user becomes available via background sync, go to marketplace
  useEffect(() => {
    if (user && initialized) {
      if (onSuccess) onSuccess();
      navigate(from, { replace: true });
    }
  }, [user, initialized, navigate, from, onSuccess]);

  const handleAuth = async (isRegister: boolean) => {
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await authApi.register(formData.email, formData.password, formData.name, formData.preferences);
      } else {
        await authApi.login(formData.email, formData.password);
      }
      
      // Move to syncing state - the useEffect above will handle the redirect once sync finishes
      setStep('syncing');
      await sync();
      
    } catch (err: any) {
      console.error("Authentication phase error:", err);
      setError(err.message || 'Authentication failed. Please check your credentials.');
      setLoading(false);
      setStep(isRegister ? 'initial-email' : 'login');
    }
  };

  const handleManualBypass = () => {
    forceInitialize();
    navigate(from, { replace: true });
  };

  if (step === 'syncing') {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center text-center p-10">
        <div className="relative mb-12">
          <div className="w-24 h-24 border-[4px] border-indigo-500/10 border-t-indigo-600 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center font-black text-indigo-600 text-xl">ሳ</div>
        </div>
        <h2 className="text-3xl font-black dark:text-white tracking-tighter animate-pulse">Initializing Identity...</h2>
        <p className="mt-4 text-gray-400 font-medium italic mb-10">Building secure trade connection</p>
        <button 
          onClick={handleManualBypass}
          className="px-8 py-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-indigo-600 transition-all active:scale-95"
        >
          stuck? click here to get access fast
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 animate-in slide-in-from-bottom-8 duration-700">
      <div className="w-full max-w-xl bg-white dark:bg-[#0c0c0e] rounded-[3.5rem] p-10 sm:p-16 shadow-2xl border border-indigo-500/5">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white font-black text-4xl mx-auto mb-8 shadow-xl">ሳ</div>
          <h2 className="text-4xl font-black dark:text-white tracking-tighter">{step === 'login' ? 'Welcome' : 'Join'}</h2>
          <p className="text-gray-400 font-medium mt-2">Addis Ababa University Marketplace</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 p-5 rounded-2xl mb-8 text-xs font-bold border border-red-500/10 animate-bounce">
            {error}
          </div>
        )}

        {step === 'login' ? (
          <form onSubmit={(e: FormEvent) => { e.preventDefault(); handleAuth(false); }} className="space-y-6">
            <Input 
              label="Student Email" 
              type="email" 
              value={formData.email} 
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({...formData, email: e.target.value})} 
              placeholder="name@aau.edu.et"
            />
            <Input 
              label="Password" 
              type="password" 
              value={formData.password} 
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({...formData, password: e.target.value})} 
              placeholder="••••••••"
            />
            <button 
              disabled={loading} 
              className="w-full py-6 rounded-2xl bg-indigo-600 text-white font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Validating credentials...' : 'Enter Marketplace'}
            </button>
            <button type="button" onClick={() => setStep('initial-email')} className="w-full text-[10px] font-black text-gray-400 uppercase tracking-widest py-4 hover:text-indigo-600 transition-colors">New here? Register</button>
          </form>
        ) : (
          <form onSubmit={(e: FormEvent) => { e.preventDefault(); handleAuth(true); }} className="space-y-6">
            <Input 
              label="Full Name" 
              value={formData.name} 
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({...formData, name: e.target.value})} 
              placeholder="Abebe Bikila"
            />
            <Input 
              label="AAU Email" 
              type="email" 
              value={formData.email} 
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({...formData, email: e.target.value})} 
              placeholder="name@aau.edu.et"
            />
            <Input 
              label="Create Password" 
              type="password" 
              value={formData.password} 
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({...formData, password: e.target.value})} 
              placeholder="Min. 6 characters"
            />
            <button 
              disabled={loading} 
              className="w-full py-6 rounded-2xl bg-indigo-600 text-white font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Finalize Profile'}
            </button>
            <button type="button" onClick={() => setStep('login')} className="w-full text-[10px] font-black text-gray-400 uppercase tracking-widest py-4 hover:text-indigo-600 transition-colors">Already a member? Login</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Auth;
