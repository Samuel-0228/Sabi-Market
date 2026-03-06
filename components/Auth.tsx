
import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Github, Chrome } from 'lucide-react';
import { authApi } from '../features/auth/auth.api';
import { useAuthStore } from '../features/auth/auth.store';
import { supabase } from '../services/supabase/client';

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

type Step = 'login' | 'register' | 'reset';

const Auth: React.FC<AuthProps> = ({ onSuccess, initialStep = 'login' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, sync, initialized } = useAuthStore();
  
  const [step, setStep] = useState<Step>(initialStep === 'login' ? 'login' : 'register');
  const [formData, setFormData] = useState({ email: '', password: '', name: '', preferences: [] as string[] });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialStep === 'login') setStep('login');
    else if (initialStep === 'initial-email') setStep('register');
  }, [initialStep]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('step') === 'reset') {
      setStep('reset');
    }
  }, [location]);

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
      let loginData;
      if (isRegister) {
        const result = await authApi.register(formData.email, formData.password, formData.name, formData.preferences);
        if (result.needsConfirmation) {
          setError('Registration successful! Please check your email to confirm.');
          setLoading(false);
          setStep('login');
          return;
        }
        loginData = result;
      } else {
        loginData = await authApi.login(formData.email, formData.password);
      }
      
      // sync() will set loading: true in the store, triggering the global loading screen in App.tsx
      await sync(loginData?.session);
      setLoading(false);
      
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

  return (
    <div className="min-h-screen flex bg-savvy-bg dark:bg-savvy-dark overflow-hidden">
      {/* Left Side: Visual Section */}
      <div className="hidden md:flex md:w-[40%] lg:w-1/2 relative overflow-hidden items-center justify-center">
        <motion.div 
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 10, ease: "linear" }}
          className="absolute inset-0"
        >
          <img 
            src="https://www.aau.edu.et/_next/image?url=%2Fimages%2Fforumbuilding.jpg&w=3840&q=75" 
            alt="AAU Campus" 
            className="w-full h-full object-cover opacity-80 dark:opacity-40 grayscale-[20%]"
            referrerPolicy="no-referrer"
          />
        </motion.div>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/20 to-transparent z-10" />
        
        {/* Branding Text */}
        <div className="relative z-20 p-12 lg:p-20 max-w-xl">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-black font-black text-3xl shadow-2xl mb-8">ሳ</div>
            <h2 className="text-4xl lg:text-6xl font-black text-white tracking-tighter leading-[0.9] mb-6">
              Welcome back to <br /> <span className="text-savvy-accent italic font-serif lowercase tracking-normal">SavvyMarket.</span>
            </h2>
            <p className="text-white/80 text-lg font-medium leading-relaxed tracking-tight">
              Buy and sell smarter with students around you. The exclusive AAU student node.
            </p>
          </motion.div>
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-12 left-12 z-20 flex items-center gap-4">
          <div className="flex -space-x-3">
            {[1,2,3].map(i => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-white/20 bg-gray-800 overflow-hidden">
                <img src={`https://picsum.photos/seed/user${i}/100/100`} alt="user" />
              </div>
            ))}
          </div>
          <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.3em]">Joined by 2k+ Students</p>
        </div>
      </div>

      {/* Right Side: Login Form Section */}
      <div className="w-full md:w-[60%] lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-24 relative">
        {/* Mobile Logo */}
        <div className="absolute top-8 left-8 md:hidden">
          <div className="w-10 h-10 bg-black dark:bg-white rounded-xl flex items-center justify-center text-white dark:text-black font-black text-xl">ሳ</div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="mb-10 text-center md:text-left">
            <h1 className="text-3xl lg:text-4xl font-black dark:text-white tracking-tighter mb-3">
              {step === 'login' ? 'Sign in to your account' : step === 'register' ? 'Create your account' : 'Reset your password'}
            </h1>
            <p className="text-gray-400 font-medium text-sm">
              {step === 'login' ? 'Enter your AAU credentials to continue.' : 'Join the most active student community in Ethiopia.'}
            </p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 p-4 rounded-2xl mb-8 text-xs font-bold border border-red-500/10 flex items-center gap-3"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              {error}
            </motion.div>
          )}

          <div className="bg-white dark:bg-white/5 p-8 rounded-[2.5rem] tibico-border shadow-2xl backdrop-blur-sm">
            <AnimatePresence mode="wait">
              {step === 'reset' ? (
                <motion.form 
                  key="reset"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  onSubmit={async (e: FormEvent) => { 
                    e.preventDefault(); 
                    setLoading(true);
                    setError('');
                    try {
                      const { error } = await supabase.auth.updateUser({ password: formData.password });
                      if (error) throw error;
                      setError('Password successfully updated! You can now sign in.');
                      setStep('login');
                    } catch (err: any) {
                      setError(err.message || 'Failed to update password.');
                    } finally {
                      setLoading(false);
                    }
                  }} 
                  className="space-y-6"
                >
                  <Input 
                    label="New Password" 
                    type="password" 
                    icon={<Lock className="w-5 h-5" />}
                    value={formData.password} 
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({...formData, password: e.target.value})} 
                    placeholder="••••••••"
                  />
                  <button 
                    disabled={loading} 
                    className="btn-premium w-full py-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {loading ? 'Updating...' : 'Update Password'}
                    {!loading && <ArrowRight className="w-4 h-4" />}
                  </button>
                  <div className="text-center">
                    <button type="button" onClick={() => setStep('login')} className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-savvy-indigo transition-colors">Back to Sign in</button>
                  </div>
                </motion.form>
              ) : step === 'login' ? (
                <motion.form 
                  key="login"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
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
                  <div className="space-y-1">
                    <Input 
                      label="Password" 
                      type="password" 
                      icon={<Lock className="w-5 h-5" />}
                      value={formData.password} 
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({...formData, password: e.target.value})} 
                      placeholder="••••••••"
                    />
                    <div className="flex justify-end">
                      <button 
                        type="button" 
                        onClick={async () => {
                          if (!formData.email) {
                            setError('Please enter your email address first.');
                            return;
                          }
                          setLoading(true);
                          try {
                            const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
                              redirectTo: `${window.location.origin}/auth?step=reset`,
                            });
                            if (error) throw error;
                            setError('Password reset link sent! Please check your email.');
                          } catch (err: any) {
                            setError(err.message || 'Failed to send reset link.');
                          } finally {
                            setLoading(false);
                          }
                        }}
                        className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-savvy-indigo transition-colors"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  </div>
                  
                  <button 
                    disabled={loading} 
                    className="btn-premium w-full py-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        Sign in
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100 dark:border-white/5"></div></div>
                    <div className="relative flex justify-center text-[8px] uppercase font-black text-gray-300 tracking-[0.3em] bg-white dark:bg-[#121214] px-4">Or continue with</div>
                  </div>

                  <div className="flex gap-4">
                    <button type="button" className="flex-1 flex items-center justify-center py-4 border border-gray-100 dark:border-white/10 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all active:scale-95">
                      <Chrome className="w-5 h-5 dark:text-white" />
                    </button>
                    <button type="button" className="flex-1 flex items-center justify-center py-4 border border-gray-100 dark:border-white/10 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all active:scale-95">
                      <Github className="w-5 h-5 dark:text-white" />
                    </button>
                  </div>
                </motion.form>
              ) : (
                <motion.form 
                  key="register"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
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
                    className="btn-premium w-full py-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        Sign up
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-10 text-center">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              {step === 'login' ? "Don't have an account?" : "Already have an account?"} {' '}
              <button 
                type="button" 
                onClick={() => setStep(step === 'login' ? 'register' : 'login')} 
                className="text-savvy-indigo hover:underline ml-2"
              >
                {step === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
