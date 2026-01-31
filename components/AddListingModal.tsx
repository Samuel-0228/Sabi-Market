
import React, { useState, useRef } from 'react';
import { db } from '../services/supabaseService';
import { useLanguage } from './LanguageContext';
import { generateProductImage } from '../services/geminiService';

interface AddListingModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const AddListingModal: React.FC<AddListingModalProps> = ({ onClose, onSuccess }) => {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
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
    } catch (err) {
      alert("Failed to upload image. Ensure the 'market-assets' bucket exists and is public.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.image_url) {
      alert("Please provide a product image (AI or Upload)");
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
    } catch (err) {
      alert("Failed to create listing");
    } finally {
      setLoading(false);
    }
  };

  const generateAIImage = async () => {
    if (!formData.title) {
      alert("Please enter a title first!");
      return;
    }
    setAiLoading(true);
    try {
      const img = await generateProductImage(`Professional studio photography of ${formData.title} for an e-commerce marketplace`, "1K");
      if (img) setFormData({ ...formData, image_url: img });
    } catch (err) {
      alert("AI Generation failed. Check your API key.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-500">
      <div className="bg-white w-full max-w-4xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:flex-row h-full max-h-[85vh]">
        
        {/* Visual Selector */}
        <div className="md:w-[45%] bg-gray-50 p-10 flex flex-col items-center justify-center border-r border-gray-100">
          <div className="w-full aspect-square bg-white rounded-[2.5rem] shadow-sm border-2 border-dashed border-gray-100 flex flex-col items-center justify-center overflow-hidden relative group">
            {formData.image_url ? (
              <img src={formData.image_url} className="w-full h-full object-cover" alt="Preview" />
            ) : (
              <div className="text-center p-8">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">📸</div>
                <p className="text-xs font-black text-gray-300 uppercase tracking-widest">No Image Provided</p>
              </div>
            )}
            {(aiLoading || uploading) && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>

          <div className="w-full mt-10 grid grid-cols-2 gap-3">
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-white border border-gray-200 text-black py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm"
            >
              Upload Photo
            </button>
            <button 
              type="button"
              onClick={generateAIImage}
              className="bg-black text-white py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-gray-800 transition-all shadow-xl"
            >
              AI Magic ✨
            </button>
          </div>
          <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
        </div>

        {/* Content Form */}
        <div className="md:w-[55%] p-12 overflow-y-auto">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-4xl font-black text-black tracking-tighter">New Listing.</h2>
              <p className="text-gray-400 font-medium text-sm mt-1">Start your campus business.</p>
            </div>
            <button onClick={onClose} className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center hover:bg-gray-100">✕</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">Product Title</label>
                <input 
                  required
                  className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold text-lg outline-none focus:bg-white focus:ring-2 focus:ring-black transition-all"
                  placeholder="e.g. Scientific Calculator"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">Description</label>
                <textarea 
                  required
                  rows={3}
                  className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold outline-none focus:bg-white focus:ring-2 focus:ring-black transition-all resize-none"
                  placeholder="Briefly describe the condition and features..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">Price (ETB)</label>
                  <input 
                    type="number"
                    required
                    className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold outline-none focus:bg-white focus:ring-2 focus:ring-black transition-all"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">Contact Phone</label>
                  <input 
                    type="tel"
                    required
                    placeholder="+251..."
                    className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold outline-none focus:bg-white focus:ring-2 focus:ring-black transition-all"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">Stock Count</label>
                  <input 
                    type="number"
                    required
                    className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold outline-none focus:bg-white focus:ring-2 focus:ring-black transition-all"
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">Category</label>
                  <select 
                    className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold outline-none focus:bg-white focus:ring-2 focus:ring-black transition-all"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  >
                    <option value="goods">Goods</option>
                    <option value="tutoring">Tutoring</option>
                    <option value="digital">Digital</option>
                    <option value="services">Services</option>
                  </select>
                </div>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading || uploading || aiLoading}
              className="w-full bg-black text-white py-6 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl hover:bg-gray-800 transition-all disabled:opacity-50 mt-4"
            >
              {loading ? 'Publishing...' : 'Launch to Market'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddListingModal;
