
import React, { useState, useRef } from 'react';
import { db, supabase } from '../services/supabaseService';
import { useLanguage } from './LanguageContext';

interface AddListingModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const AddListingModal: React.FC<AddListingModalProps> = ({ onClose, onSuccess }) => {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'goods',
    stock: '1',
    image_url: '',
    contact_phone: ''
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const publicUrl = await db.uploadImage(file);
      setFormData(prev => ({ ...prev, image_url: publicUrl }));
    } catch (err: any) {
      console.error("Upload error details:", err);
      alert(`Upload failed: ${err.message || "Unknown error"}. Check if you are logged in and the 'market-assets' bucket is public.`);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.image_url) {
      alert("Please upload a product photo first.");
      return;
    }
    setLoading(true);
    try {
      await db.createListing({
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        category: formData.category as any
      });
      onSuccess();
    } catch (err: any) {
      alert("Failed to create listing: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-500">
      <div className="bg-white dark:bg-[#0c0c0e] w-full max-w-4xl rounded-[3.5rem] overflow-hidden shadow-2xl flex flex-col md:flex-row h-full max-h-[85vh] border border-white/5">
        
        <div className="md:w-[45%] bg-gray-50/50 dark:bg-black/40 p-10 flex flex-col items-center justify-center border-r border-gray-100 dark:border-white/5 relative">
          <div className="w-full aspect-[4/5] bg-white dark:bg-white/5 rounded-[2.5rem] shadow-inner border-2 border-dashed border-gray-200 dark:border-white/10 flex flex-col items-center justify-center overflow-hidden relative group">
            {formData.image_url ? (
              <img src={formData.image_url} className="w-full h-full object-cover" alt="Preview" />
            ) : (
              <div className="text-center p-8">
                <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6 shadow-sm">📸</div>
                <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-loose">
                  {uploading ? 'Uploading assets...' : t('uploadPhoto')}
                </p>
              </div>
            )}
            
            {uploading && (
              <div className="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-10">
                <div className="w-12 h-12 border-4 border-savvy-pink border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()} 
              disabled={uploading}
              className="absolute inset-0 opacity-0 cursor-pointer z-20" 
              title={t('uploadPhoto')} 
            />
          </div>

          <div className="w-full mt-10">
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()} 
              disabled={uploading}
              className="w-full py-5 rounded-2xl btn-hope font-black text-[11px] uppercase tracking-widest shadow-xl disabled:opacity-50"
            >
              {uploading ? 'Processing...' : t('selectImage')}
            </button>
          </div>
          <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
        </div>

        <div className="md:w-[55%] p-12 overflow-y-auto">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-4xl font-black text-black dark:text-white tracking-tighter">{t('newListing')}</h2>
              <p className="text-gray-400 font-medium text-sm mt-2 italic">Savvy AI will help categorize your items.</p>
            </div>
            <button onClick={onClose} className="w-12 h-12 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all text-black dark:text-white">✕</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3 px-1">{t('productTitle')}</label>
                <input required className="w-full bg-gray-50/50 dark:bg-white/5 border-2 border-transparent focus:border-savvy-pink rounded-2xl px-6 py-5 font-bold text-lg outline-none transition-all dark:text-white" placeholder="e.g. Vintage AAU Hoodie" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3 px-1">{t('category')}</label>
                <div className="relative">
                  <select className="w-full bg-gray-50/50 dark:bg-white/5 border-2 border-transparent focus:border-savvy-pink rounded-2xl px-6 py-5 font-bold outline-none transition-all dark:text-white appearance-none cursor-pointer" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                    <option value="goods">{t('goods')}</option>
                    <option value="course">{t('course')}</option>
                    <option value="academic_materials">{t('academic_materials')}</option>
                    <option value="food">{t('food')}</option>
                  </select>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">▼</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3 px-1">{t('price')} (ETB)</label>
                  <input type="number" required className="w-full bg-gray-50/50 dark:bg-white/5 border-2 border-transparent focus:border-savvy-pink rounded-2xl px-6 py-5 font-bold outline-none transition-all dark:text-white" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3 px-1">{t('contactPhone')}</label>
                  <input type="tel" required placeholder="+251..." className="w-full bg-gray-50/50 dark:bg-white/5 border-2 border-transparent focus:border-savvy-pink rounded-2xl px-6 py-5 font-bold outline-none transition-all dark:text-white" value={formData.contact_phone} onChange={(e) => setFormData({...formData, contact_phone: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3 px-1">{t('description')}</label>
                <textarea required rows={4} className="w-full bg-gray-50/50 dark:bg-white/5 border-2 border-transparent focus:border-savvy-pink rounded-2xl px-6 py-5 font-bold outline-none transition-all resize-none dark:text-white" placeholder="What should other students know about this item?" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
              </div>
            </div>

            <button type="submit" disabled={loading || uploading} className="w-full py-7 rounded-[2rem] btn-hope font-black text-sm uppercase tracking-widest shadow-2xl disabled:opacity-50 mt-4 active:scale-95">
              {loading ? t('publishing') : t('launchMarket')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddListingModal;
