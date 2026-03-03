
import React, { useState } from 'react';
import { authApi } from '../../features/auth/auth.api';
import { useLanguage } from '../../app/LanguageContext';

interface LoginProps {
  onSuccess: () => void;
  onSwitch: () => void;
}

const Login: React.FC<LoginProps> = ({ onSuccess, onSwitch }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.login(formData.email, formData.password);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-xl bg-white dark:bg-[#0c0c0e] rounded-[2.5rem] p-8 md:p-16 shadow-2xl border border-indigo-500/10 transition-all">
        <div className="text-center mb-8 md:mb-12">
          <div className="w-12 h-12 md:w-20 md:h-20 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl md:text-4xl mx-auto mb-6 shadow-xl">ሳ</div>
          <h2 className="text-2xl md:text-4xl font-black text-black dark:text-white tracking-tighter mb-1">{t('login')}</h2>
          <p className="text-[10px] md:text-sm text-gray-400 font-medium">Addis Ababa University Node</p>
        </div>

        {error && <div className="bg-red-50 text-red-500 p-3 rounded-xl mb-6 text-[10px] font-bold border border-red-100">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          <div className="space-y-1.5">
            <label className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">{t('email')}</label>
            <input type="email" required className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-xl px-5 py-3 md:py-5 outline-none dark:text-white text-sm font-bold" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">{t('password')}</label>
            <input type="password" required className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-xl px-5 py-3 md:py-5 outline-none dark:text-white text-sm font-bold" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          </div>
          <button type="submit" disabled={loading} className="w-full py-4 md:py-6 rounded-xl bg-indigo-600 text-white font-black text-[10px] md:text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50">
            {loading ? 'Processing...' : t('login')}
          </button>
          <button type="button" onClick={onSwitch} className="w-full text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest py-2">Join Savvy Market</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
