
import React, { useState, useRef } from 'react';
import { db } from '../../services/supabase/db';
import { useLanguage } from '../../app/LanguageContext';
import { suggestListingDetails } from '../../services/ai/gemini';
import { useUIStore } from '../../store/ui.store';

interface AddListingModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const AddListingModal: React.FC<AddListingModalProps> = ({ onClose, onSuccess }) => {
  const { t } = useLanguage();
  const { addToast } = useUIStore();
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
      const url = await db.uploadImage(file);
      setFormData(prev => ({ ...prev, image_url: url }));
      addToast("Photo verified", "success");
    } catch (err: any) {
      addToast("Upload error", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.image_url) return addToast("Photo required", "info");
    
    setLoading(true);

    // Safety Timeout: 15 seconds max for DB write
    const submissionPromise = db.createListing({ 
      ...formData, 
      price: parseFloat(formData.price), 
      stock: parseInt(formData.stock), 
      category: formData.category as any 
    });

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Request Timed Out")), 15000)
    );

    try {
      await Promise.race([submissionPromise, timeoutPromise]);
      addToast("Product is now live!", "success");
      onSuccess();
    } catch (err: any) {
      console.error("Publishing failure:", err);
      addToast(err.message === "Request Timed Out" 
        ? "Network slow. Check your internet." 
        : "Failed to post product.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-in fade-in">
      <div className="bg-white dark:bg-[#0c0c0e] w-full max-w-5xl rounded-[3rem] overflow-hidden flex flex-col md:flex-row h-full max-h-[90vh] shadow-2xl border border-white/5">
        <div className="md:w-[40%] bg-gray-50/50 dark:bg-black/20 p-10 flex flex-col items-center justify-center border-r dark:border-white/5">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-square bg-white dark:bg-white/5 rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-white/10 flex flex-col items-center justify-center overflow-hidden cursor-pointer hover:border-indigo-500 transition-all relative"
          >
             {formData.image_url ? (
               <img src={formData.image_url} className="w-full h-full object-cover" />
             ) : (
               <div className="text-center opacity-40">
                  <div className="text-4xl mb-2">📸</div>
                  <p className="text-[10px] font-black uppercase tracking-widest">{uploading ? 'Processing...' : 'Upload Photo'}</p>
               </div>
             )}
          </div>
          <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
        </div>

        <form onSubmit={handleSubmit} className="p-12 flex-1 flex flex-col overflow-y-auto">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-4xl font-black dark:text-white tracking-tighter">New Listing.</h2>
            <button type="button" onClick={onClose} className="w-12 h-12 bg-gray-50 dark:bg-white/10 rounded-full flex items-center justify-center hover:bg-red-500 transition-all">✕</button>
          </div>

          <div className="space-y-6 flex-1">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Product Title</label>
              <input required className="w-full bg-gray-50 dark:bg-white/5 border-none p-5 rounded-2xl dark:text-white font-bold outline-none focus:ring-2 focus:ring-indigo-600" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            </div>

            <div className="grid grid-cols-2 gap-6">
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Price (ETB)</label>
                 <input required type="number" className="w-full bg-gray-50 dark:bg-white/5 border-none p-5 rounded-2xl dark:text-white font-bold outline-none" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</label>
                 <select className="w-full bg-gray-50 dark:bg-white/5 border-none p-5 rounded-2xl dark:text-white font-bold outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                   <option value="goods">Goods</option>
                   <option value="course">Courses</option>
                   <option value="academic_materials">Materials</option>
                   <option value="food">Food</option>
                 </select>
               </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</label>
              <textarea required rows={4} className="w-full bg-gray-50 dark:bg-white/5 border-none p-5 rounded-2xl dark:text-white font-bold outline-none resize-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading || uploading}
            className="w-full btn-hope py-6 rounded-2xl font-black uppercase text-xs tracking-widest mt-8 disabled:opacity-50"
          >
            {loading ? 'Publishing to Market...' : 'Launch to AAU Market'}
          </button>
        </form>
      </div>
    </div>
  );
};
export default AddListingModal;
