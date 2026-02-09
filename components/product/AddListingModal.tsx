
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
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
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
      addToast("Photo uploaded successfully!", "success");
    } catch (err: any) {
      console.error("Upload error:", err);
      addToast(err.message || "Upload failed. Check storage bucket permissions.", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleAiAssist = async () => {
    if (!formData.title || !formData.description) {
      addToast("Enter a title and description first!", "info");
      return;
    }
    setAiAnalyzing(true);
    try {
      const suggestion = await suggestListingDetails(formData.title, formData.description);
      setFormData(prev => ({
        ...prev,
        title: suggestion.title,
        price: suggestion.price.toString(),
        category: suggestion.category,
        description: suggestion.description
      }));
      addToast("AI magic applied! Review the changes.", "success");
    } catch (err) {
      addToast("AI failed to analyze. Try again.", "error");
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.image_url) return addToast("A photo is required!", "info");
    
    setLoading(true);
    try {
      await db.createListing({ 
        ...formData, 
        price: parseFloat(formData.price), 
        stock: parseInt(formData.stock), 
        category: formData.category as any 
      });
      addToast("Your listing is live!", "success");
      onSuccess();
    } catch (err: any) {
      console.error("Publishing error:", err);
      addToast("Failed to publish listing: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-2xl p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-[#0c0c0e] w-full max-w-5xl rounded-[3.5rem] overflow-hidden flex flex-col md:flex-row h-full max-h-[90vh] border border-white/5 shadow-2xl">
        <div className="md:w-[40%] bg-gray-50/50 dark:bg-black/40 p-10 flex flex-col items-center justify-center border-r dark:border-white/5">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-square bg-white dark:bg-white/5 rounded-[2.5rem] shadow-inner border-2 border-dashed border-gray-100 dark:border-white/10 flex flex-col items-center justify-center overflow-hidden cursor-pointer group hover:border-indigo-500 transition-all relative"
          >
             {formData.image_url ? (
               <img src={formData.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
             ) : (
               <div className="text-center">
                  <div className="text-4xl mb-4 opacity-40">📸</div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    {uploading ? 'Uploading...' : 'Tap to select photo'}
                  </p>
               </div>
             )}
             {uploading && (
               <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                 <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
               </div>
             )}
          </div>
          <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
          
          <div className="mt-12 w-full space-y-4">
            <div className="p-6 bg-indigo-50 dark:bg-indigo-500/5 rounded-3xl border border-indigo-100 dark:border-indigo-500/10">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-2">Pro Tip</h4>
              <p className="text-xs text-indigo-800 dark:text-indigo-300 font-medium">Clear photos and AI-optimized titles sell 3x faster on Savvy.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-12 flex-1 flex flex-col overflow-y-auto space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-4xl font-black dark:text-white tracking-tighter leading-none mb-2">New Listing</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">AAU Student Marketplace</p>
            </div>
            <button type="button" onClick={onClose} className="w-12 h-12 bg-gray-50 dark:bg-white/10 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all text-black dark:text-white">✕</button>
          </div>

          <div className="space-y-6">
            <div className="relative">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Title</label>
              <input 
                required 
                className="w-full bg-gray-50 dark:bg-white/5 border-none p-5 rounded-2xl dark:text-white font-bold outline-none focus:ring-2 focus:ring-indigo-600 transition-all" 
                placeholder="Snappy product name" 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})} 
              />
              <button 
                type="button"
                onClick={handleAiAssist}
                disabled={aiAnalyzing}
                className="absolute right-4 top-[2.4rem] bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all disabled:opacity-50"
              >
                {aiAnalyzing ? 'Analyzing...' : '✨ AI Assist'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
               <div>
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Price (ETB)</label>
                 <input 
                   required 
                   type="number"
                   className="w-full bg-gray-50 dark:bg-white/5 border-none p-5 rounded-2xl dark:text-white font-bold outline-none focus:ring-2 focus:ring-indigo-600 transition-all" 
                   value={formData.price} 
                   onChange={e => setFormData({...formData, price: e.target.value})} 
                 />
               </div>
               <div>
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Category</label>
                 <select 
                   className="w-full bg-gray-50 dark:bg-white/5 border-none p-5 rounded-2xl dark:text-white font-bold outline-none focus:ring-2 focus:ring-indigo-600 transition-all appearance-none"
                   value={formData.category}
                   onChange={e => setFormData({...formData, category: e.target.value})}
                 >
                   <option value="goods">Goods</option>
                   <option value="course">Courses</option>
                   <option value="academic_materials">Academic Materials</option>
                   <option value="food">Food & Snacks</option>
                 </select>
               </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Description</label>
              <textarea 
                required 
                rows={4}
                className="w-full bg-gray-50 dark:bg-white/5 border-none p-5 rounded-2xl dark:text-white font-bold outline-none focus:ring-2 focus:ring-indigo-600 transition-all resize-none" 
                placeholder="Detailed description..." 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})} 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading || uploading}
            className="w-full btn-hope py-6 rounded-[1.5rem] font-black uppercase text-sm tracking-[0.2em] shadow-2xl mt-auto disabled:opacity-50"
          >
            {loading ? 'Publishing...' : 'Launch Listing'}
          </button>
        </form>
      </div>
    </div>
  );
};
export default AddListingModal;
