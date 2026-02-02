
import React, { useState, useRef } from 'react';
import { db } from '../../services/supabase/db';
import { useLanguage } from '../../app/LanguageContext';

interface AddListingModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const AddListingModal: React.FC<AddListingModalProps> = ({ onClose, onSuccess }) => {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', price: '', category: 'goods', stock: '1', image_url: '', contact_phone: '' });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const publicUrl = await db.uploadImage(file);
      setFormData(prev => ({ ...prev, image_url: publicUrl }));
    } catch (err: any) {
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.image_url) return alert("Upload a photo");
    setLoading(true);
    try {
      await db.createListing({ ...formData, price: parseFloat(formData.price), stock: parseInt(formData.stock), category: formData.category as any });
      onSuccess();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
      <div className="bg-white dark:bg-[#0c0c0e] w-full max-w-4xl rounded-[3rem] overflow-hidden flex flex-col md:row h-[85vh]">
        <div className="p-10 border-r border-gray-100 dark:border-white/5 flex flex-col items-center">
          <div className="w-full aspect-[4/5] bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center justify-center overflow-hidden">
             {formData.image_url ? <img src={formData.image_url} className="w-full h-full object-cover" /> : <span>Image</span>}
          </div>
          <button onClick={() => fileInputRef.current?.click()} className="mt-6 bg-black text-white p-4 rounded-xl text-xs font-black uppercase tracking-widest">Select Image</button>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
        </div>
        <form onSubmit={handleSubmit} className="p-10 flex-1 space-y-6 overflow-y-auto">
          <div className="flex justify-between">
            <h2 className="text-3xl font-black dark:text-white">New Product</h2>
            <button type="button" onClick={onClose}>✕</button>
          </div>
          <input className="w-full bg-gray-50 dark:bg-white/5 p-4 rounded-xl dark:text-white" placeholder="Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          <input className="w-full bg-gray-50 dark:bg-white/5 p-4 rounded-xl dark:text-white" type="number" placeholder="Price" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
          <textarea className="w-full bg-gray-50 dark:bg-white/5 p-4 rounded-xl dark:text-white" placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          <button type="submit" className="w-full bg-indigo-600 text-white p-6 rounded-2xl font-black uppercase">{loading ? 'Saving...' : 'Publish'}</button>
        </form>
      </div>
    </div>
  );
};

export default AddListingModal;
