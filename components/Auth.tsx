
import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Github, Chrome, Facebook } from 'lucide-react';
import { authApi } from '../features/auth/auth.api';
import { useAuthStore } from '../features/auth/auth.store';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { 
  label: string; 
  icon: React.ReactNode;
};

const Input = ({ label, icon, ...props }: InputProps) => (
  <div className="space-y-2">
    <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">{label}</label>
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors">
        {icon}
      </div>
      <input 
        required 
        className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl pl-12 pr-6 py-4 outline-none dark:text-white font-medium focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all placeholder:text-gray-300" 
        {...props} 
      />
    </div>
  </div>
);

interface AuthProps {
  onSuccess?: () => void;
  initialStep?: 'login' | 'initial-email';
}

type Step = 'login' | 'register' | 'syncing';

const Auth: React.FC<AuthProps> = ({ onSuccess, initialStep = 'login' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, sync, forceInitialize, initialized } = useAuthStore();
  
  const [step, setStep] = useState<Step>(initialStep === 'login' ? 'login' : 'register');
  const [formData, setFormData] = useState({ email: '', password: '', name: '', preferences: [] as string[] });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/marketplace';

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
        const result = await authApi.register(formData.email, formData.password, formData.name, formData.preferences);
        if (result.needsConfirmation) {
          setError('Registration successful! Please check your email to confirm.');
          setLoading(false);
          setStep('login');
          return;
        }
      } else {
        await authApi.login(formData.email, formData.password);
      }
      
      setStep('syncing');
      const profile = await sync();
      
      if (!profile) {
        throw new Error("Session established but profile synchronization failed.");
      }
      
    } catch (err: any) {
      console.error("Auth error:", err);
      let msg = err.message || 'Authentication failed.';
      if (msg.toLowerCase().includes('email not confirmed')) {
        msg = 'Please confirm your email first.';
      } else if (msg.toLowerCase().includes('invalid login credentials')) {
        msg = 'Invalid email or password.';
      }
      setError(msg);
      setLoading(false);
      setStep(isRegister ? 'register' : 'login');
    }
  };

  if (step === 'syncing') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-[#050505] p-10">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative mb-12"
        >
          <div className="w-24 h-24 border-[3px] border-indigo-500/10 border-t-indigo-600 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center font-black text-indigo-600 text-2xl">ሳ</div>
        </motion.div>
        <h2 className="text-3xl font-black dark:text-white tracking-tighter">Initializing Identity</h2>
        <p className="mt-2 text-gray-400 font-medium italic mb-10">Building secure trade connection...</p>
        <button 
          onClick={() => forceInitialize()}
          className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-indigo-600 transition-colors"
        >
          Stuck? Click here to bypass
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white dark:bg-[#050505]">
      {/* Left Side: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-16 lg:p-24">
        <div className="w-full max-w-md">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-black dark:bg-white rounded-xl flex items-center justify-center text-white dark:text-black font-black text-xl shadow-lg">ሳ</div>
              <span className="font-black text-xl tracking-tighter dark:text-white">Savvy Market</span>
            </div>
            <h1 className="text-4xl font-black dark:text-white tracking-tighter mb-2">
              {step === 'login' ? 'Sign in' : 'Create account'}
            </h1>
            <p className="text-gray-400 font-medium">
              {step === 'login' ? 'Welcome back! Please enter your details.' : 'Join the AAU student marketplace today.'}
            </p>
          </motion.div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 p-4 rounded-xl mb-8 text-xs font-bold border border-red-500/10"
            >
              {error}
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {step === 'login' ? (
              <motion.form 
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={(e: FormEvent) => { e.preventDefault(); handleAuth(false); }} 
                className="space-y-6"
              >
                <Input 
                  label="Email Address" 
                  type="email" 
                  icon={<Mail className="w-5 h-5" />}
                  value={formData.email} 
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({...formData, email: e.target.value})} 
                  placeholder="name@aau.edu.et"
                />
                <Input 
                  label="Password" 
                  type="password" 
                  icon={<Lock className="w-5 h-5" />}
                  value={formData.password} 
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({...formData, password: e.target.value})} 
                  placeholder="••••••••"
                />
                
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600" 
                    />
                    <span className="text-xs font-bold text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">Remember me</span>
                  </label>
                  <button type="button" className="text-xs font-bold text-gray-400 hover:text-indigo-600 transition-colors">Forgot Password?</button>
                </div>

                <button 
                  disabled={loading} 
                  className="w-full py-4 rounded-xl bg-black dark:bg-white text-white dark:text-black font-black uppercase text-[11px] tracking-[0.2em] shadow-xl active:scale-95 transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? 'Processing...' : 'Sign in'}
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>

                <div className="text-center">
                  <p className="text-xs font-bold text-gray-400">
                    Don't have an account? {' '}
                    <button type="button" onClick={() => setStep('register')} className="text-indigo-600 hover:underline">Sign up</button>
                  </p>
                </div>

                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100 dark:border-white/5"></div></div>
                  <div className="relative flex justify-center text-[10px] uppercase font-black text-gray-300 tracking-widest bg-white dark:bg-[#050505] px-4">Or continue with</div>
                </div>

                <div className="flex gap-4">
                  <button type="button" className="flex-1 flex items-center justify-center py-3 border border-gray-100 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <Chrome className="w-5 h-5" />
                  </button>
                  <button type="button" className="flex-1 flex items-center justify-center py-3 border border-gray-100 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <Github className="w-5 h-5" />
                  </button>
                  <button type="button" className="flex-1 flex items-center justify-center py-3 border border-gray-100 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <Facebook className="w-5 h-5" />
                  </button>
                </div>
              </motion.form>
            ) : (
              <motion.form 
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={(e: FormEvent) => { e.preventDefault(); handleAuth(true); }} 
                className="space-y-6"
              >
                <Input 
                  label="Full Name" 
                  icon={<User className="w-5 h-5" />}
                  value={formData.name} 
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({...formData, name: e.target.value})} 
                  placeholder="Abebe Bikila"
                />
                <Input 
                  label="AAU Email" 
                  type="email" 
                  icon={<Mail className="w-5 h-5" />}
                  value={formData.email} 
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({...formData, email: e.target.value})} 
                  placeholder="name@aau.edu.et"
                />
                <Input 
                  label="Create Password" 
                  type="password" 
                  icon={<Lock className="w-5 h-5" />}
                  value={formData.password} 
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({...formData, password: e.target.value})} 
                  placeholder="Min. 6 characters"
                />
                
                <button 
                  disabled={loading} 
                  className="w-full py-4 rounded-xl bg-black dark:bg-white text-white dark:text-black font-black uppercase text-[11px] tracking-[0.2em] shadow-xl active:scale-95 transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? 'Creating account...' : 'Sign up'}
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>

                <div className="text-center">
                  <p className="text-xs font-bold text-gray-400">
                    Already have an account? {' '}
                    <button type="button" onClick={() => setStep('login')} className="text-indigo-600 hover:underline">Sign in</button>
                  </p>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right Side: Decorative Panel */}
      <div className="hidden lg:flex w-1/2 bg-[#0c0c0e] relative overflow-hidden items-center justify-center p-24">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-600/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-600/10 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/4" />
        
        <div className="relative z-10 max-w-lg">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="mb-16"
          >
            <div className="w-32 h-32 bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 flex items-center justify-center text-white font-black text-6xl shadow-2xl mb-12">ሳ</div>
            <h2 className="text-5xl font-black text-white tracking-tighter leading-[0.9] mb-6">
              Welcome to <br /> <span className="text-indigo-500">Savvy Market.</span>
            </h2>
            <p className="text-gray-400 text-lg font-medium leading-relaxed">
              The premier marketplace for Addis Ababa University students. Buy, sell, and trade with confidence in a secure campus environment.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-8">
            <div className="p-6 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10">
              <p className="text-3xl font-black text-white mb-1">17k+</p>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Active Students</p>
            </div>
            <div className="p-6 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10">
              <p className="text-3xl font-black text-white mb-1">50k+</p>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Trades Completed</p>
            </div>
          </div>

          <div className="mt-16 p-8 bg-indigo-600 rounded-[2.5rem] shadow-2xl shadow-indigo-600/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-2xl rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
            <p className="text-white font-black text-xl tracking-tight mb-2">Get your right gear and right price now</p>
            <p className="text-indigo-100 text-sm font-medium opacity-80">Be among the first founders to shape the future of campus trade.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
