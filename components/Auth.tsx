
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
        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl pl-12 pr-6 py-4 outline-none dark:text-white font-medium focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all placeholder:text-gray-300" 
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
  const [success, setSuccess] = useState('');
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

  const from = React.useMemo(() => {
    let path = (location.state as any)?.from?.pathname || '/marketplace';
    if (path === '/auth' || path === '/') path = '/marketplace';
    return path;
  }, [location.state]);

  useEffect(() => {
    if (user && initialized) {
      if (onSuccess) onSuccess();
      navigate(from, { replace: true });
    }
  }, [user, initialized, navigate, from, onSuccess]);

  const handleAuth = async (isRegister: boolean) => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      let loginData;
      if (isRegister) {
        const result = await authApi.register(formData.email, formData.password, formData.name, formData.preferences);
        if (result.needsConfirmation) {
          setSuccess('Registration successful! Please check your email to confirm.');
          setLoading(false);
          setStep('login');
          return;
        }
        loginData = result;
      } else {
        loginData = await authApi.login(formData.email, formData.password);
      }
      
      const profile = await sync(loginData?.session);
      setLoading(false);
      
      if (profile) {
        if (onSuccess) onSuccess();
        navigate(from, { replace: true });
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB] dark:bg-[#0A0A0B] p-4 md:p-10 lg:p-16">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[1100px] bg-white dark:bg-[#121214] rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] dark:shadow-none border border-gray-100 dark:border-white/5 overflow-hidden flex flex-col md:flex-row min-h-[650px]"
      >
        {/* Left Side: Visual Section */}
        <div className="hidden md:flex md:w-1/2 relative overflow-hidden">
          <div className="absolute inset-0">
            <img 
              src="https://www.aau.edu.et/_next/image?url=%2Fimages%2Fforumbuilding.jpg&w=3840&q=75" 
              alt="AAU Campus" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            {/* Modern Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />
          </div>
          
          {/* Branding Content */}
          <div className="relative z-20 p-12 flex flex-col justify-end h-full w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-black font-black text-xl shadow-lg mb-6">ሳ</div>
              <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tighter leading-[1.1] mb-4">
                Welcome to <br /> 
                <span className="text-savvy-accent italic font-serif lowercase tracking-normal">SavvyMarket.</span>
              </h2>
              <p className="text-white/70 text-lg font-medium leading-relaxed max-w-sm">
                Buy and sell smarter with your campus community. The exclusive AAU student node.
              </p>
            </motion.div>
            
            {/* Social Proof */}
            <div className="mt-10 pt-10 border-t border-white/10 flex items-center gap-4">
              <div className="flex -space-x-2">
                {[1,2,3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-black/50 bg-gray-800 overflow-hidden">
                    <img src={`https://picsum.photos/seed/user${i}/100/100`} alt="user" referrerPolicy="no-referrer" />
                  </div>
                ))}
              </div>
              <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Joined by 2k+ Students</p>
            </div>
          </div>
        </div>

        {/* Right Side: Form Section */}
        <div className="w-full md:w-1/2 p-8 sm:p-12 lg:p-16 flex flex-col justify-center relative bg-white dark:bg-[#121214]">
          {/* Mobile Logo */}
          <div className="md:hidden mb-8">
            <div className="w-10 h-10 bg-black dark:bg-white rounded-xl flex items-center justify-center text-white dark:text-black font-black text-xl">ሳ</div>
          </div>

          <div className="mb-10">
            <h1 className="text-3xl font-black dark:text-white tracking-tighter mb-2">
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
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-4 rounded-2xl mb-8 text-xs font-bold border border-emerald-500/10 flex items-center gap-3"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {success}
            </motion.div>
          )}

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
                  setSuccess('');
                  try {
                    const { error } = await supabase.auth.updateUser({ password: formData.password });
                    if (error) throw error;
                    setSuccess('Password successfully updated! You can now sign in.');
                    setStep('login');
                  } catch (err: any) {
                    setError(err.message || 'Failed to update password.');
                  } finally {
                    setLoading(false);
                  }
                }} 
                className="space-y-5"
              >
                <Input 
                  label="New Password" 
                  type="password" 
                  icon={<Lock className="w-4 h-4" />}
                  value={formData.password} 
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({...formData, password: e.target.value})} 
                  placeholder="••••••••"
                />
                <button 
                  disabled={loading} 
                  className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-xl font-bold text-sm shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? 'Updating...' : 'Update Password'}
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>
                <div className="text-center">
                  <button type="button" onClick={() => setStep('login')} className="text-xs font-bold text-gray-400 hover:text-black dark:hover:text-white transition-colors">Back to Sign in</button>
                </div>
              </motion.form>
            ) : step === 'login' ? (
              <motion.form 
                key="login"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={(e: FormEvent) => { e.preventDefault(); handleAuth(false); }} 
                className="space-y-5"
              >
                <Input 
                  label="Email Address" 
                  type="email" 
                  icon={<Mail className="w-4 h-4" />}
                  value={formData.email} 
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({...formData, email: e.target.value})} 
                  placeholder="name@aau.edu.et"
                />
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Password</label>
                    <button 
                      type="button" 
                      onClick={async () => {
                        if (!formData.email) {
                          setError('Please enter your email address first.');
                          return;
                        }
                        setLoading(true);
                        setError('');
                        setSuccess('');
                        try {
                          const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
                            redirectTo: `${window.location.origin}/auth?step=reset`,
                          });
                          if (error) throw error;
                          setSuccess('Password reset link sent! Please check your email.');
                        } catch (err: any) {
                          setError(err.message || 'Failed to send reset link.');
                        } finally {
                          setLoading(false);
                        }
                      }}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input 
                      required 
                      type="password"
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl pl-12 pr-6 py-4 outline-none dark:text-white font-medium focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all placeholder:text-gray-300" 
                      value={formData.password}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({...formData, password: e.target.value})}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                
                <button 
                  disabled={loading} 
                  className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-xl font-bold text-sm shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
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
                  <div className="relative flex justify-center text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-white dark:bg-[#121214] px-4">or continue with</div>
                </div>

                <div className="flex gap-4">
                  <button type="button" className="flex-1 flex items-center justify-center py-3.5 border border-gray-100 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all active:scale-95">
                    <Chrome className="w-4 h-4 dark:text-white" />
                  </button>
                  <button type="button" className="flex-1 flex items-center justify-center py-3.5 border border-gray-100 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all active:scale-95">
                    <Github className="w-4 h-4 dark:text-white" />
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
                className="space-y-5"
              >
                <Input 
                  label="Full Name" 
                  icon={<User className="w-4 h-4" />}
                  value={formData.name} 
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({...formData, name: e.target.value})} 
                  placeholder="Abebe Bikila"
                />
                <Input 
                  label="AAU Email" 
                  type="email" 
                  icon={<Mail className="w-4 h-4" />}
                  value={formData.email} 
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({...formData, email: e.target.value})} 
                  placeholder="name@aau.edu.et"
                />
                <Input 
                  label="Create Password" 
                  type="password" 
                  icon={<Lock className="w-4 h-4" />}
                  value={formData.password} 
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({...formData, password: e.target.value})} 
                  placeholder="Min. 6 characters"
                />
                
                <button 
                  disabled={loading} 
                  className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-xl font-bold text-sm shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
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

          <div className="mt-10 text-center">
            <p className="text-xs font-bold text-gray-400">
              {step === 'login' ? "Don't have an account?" : "Already have an account?"} {' '}
              <button 
                type="button" 
                onClick={() => setStep(step === 'login' ? 'register' : 'login')} 
                className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-bold ml-1"
              >
                {step === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
