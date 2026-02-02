
import React, { useState } from 'react';
import { authApi } from '../../features/auth/auth.api';
import { useLanguage } from '../../app/LanguageContext';

interface RegisterProps {
  onSuccess: () => void;
  onSwitch: () => void;
}

const Register: React.FC<RegisterProps> = ({ onSuccess, onSwitch }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({ email: '', password: '', fullName: '', preferences: [] as string[] });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.register(formData.email, formData.password, formData.fullName, formData.preferences);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-white dark:bg-[#0c0c0e] rounded-[3rem] p-10 sm:p-16 shadow-2xl border border-indigo-500/10 transition-all">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white font-black text-4xl mx-auto mb-8 shadow-xl">ሳ</div>
          <h2 className="text-4xl font-black text-black dark:text-white tracking-tighter mb-2">{t('register')}</h2>
          <p className="text-gray-400 font-medium">Addis Ababa University Marketplace</p>
        </div>

        {error && <div className="bg-red-50 text-red-500 p-4 rounded-2xl mb-6 text-xs font-bold border border-red-100">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">{t('fullName')}</label>
            <input required className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl px-6 py-5 outline-none dark:text-white font-bold" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">{t('email')}</label>
            <input type="email" required className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl px-6 py-5 outline-none dark:text-white font-bold" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">{t('password')}</label>
            <input type="password" required className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl px-6 py-5 outline-none dark:text-white font-bold" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          </div>
          <button type="submit" disabled={loading} className="w-full py-6 rounded-[1.5rem] bg-indigo-600 text-white font-black text-sm uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50">
            {loading ? 'Creating Account...' : t('finalize')}
          </button>
          <button type="button" onClick={onSwitch} className="w-full text-[10px] font-black text-gray-400 uppercase tracking-widest py-4">Already have an account? {t('login')}</button>
        </form>
      </div>
    </div>
  );
};

export default Register;
