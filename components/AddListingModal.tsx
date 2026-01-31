
import React, { useState } from 'react';
import { db } from '../services/supabaseService';
import { useLanguage } from './LanguageContext';
import { generateProductImage } from '../services/geminiService';

interface AddListingModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const AddListingModal: React.FC<AddListingModalProps> = ({ onClose, onSuccess }) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'goods',
    stock: '1',
    image_url: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      alert("Please enter a title first for AI to imagine it!");
      return;
    }

    // Check for API key selection as required for high-quality model access
    const aistudio = (window as any).aistudio;
    if (aistudio) {
      const hasKey = await aistudio.hasSelectedApiKey();
      if (!hasKey) {
        // Provide link to billing documentation in the app flow implicitly through the dialog
        await aistudio.openSelectKey();
        // Proceed as per guideline race-condition mitigation: assume success and continue
      }
    }

    setAiLoading(true);
    try {
      const img = await generateProductImage(`Realistic professional product photo of ${formData.title}: ${formData.description}`, "1K");
      if (img) setFormData({ ...formData, image_url: img });
    } catch (err) {
      alert("AI Image generation failed. If using a high-quality model, please ensure your API key is configured with a billing project.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]">
        {/* Left Side: Preview/AI */}
        <div className="md:w-1/2 bg-gray-50 p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-gray-100">
          <div className="w-full aspect-square bg-white rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center overflow-hidden relative group">
            {formData.image_url ? (
              <img src={formData.image_url} className="w-full h-full object-cover" alt="Product preview" />
            ) : (
              <div className="text-center p-4">
                <span className="text-4xl">📸</span>
                <p className="text-xs text-gray-400 mt-2">No image selected</p>
              </div>
            )}
            {aiLoading && (
              <div className="absolute inset-0 bg-indigo-600/20 backdrop-blur flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
          <button 
            type="button"
            onClick={generateAIImage}
            disabled={aiLoading}
            className="mt-6 w-full bg-indigo-600 text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all disabled:opacity-50"
          >
            ✨ {aiLoading ? 'Imagining...' : 'Generate AI Image'}
          </button>
          <p className="text-[10px] text-gray-400 mt-2 text-center">Images powered by Gemini AI</p>
        </div>

        {/* Right Side: Form */}
        <div className="md:w-1/2 p-6 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black text-gray-900">{t('sell')}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase">Product Title</label>
              <input 
                required
                className="w-full mt-1 bg-gray-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="What are you selling?"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase">Description</label>
              <textarea 
                required
                rows={3}
                className="w-full mt-1 bg-gray-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                placeholder="Tell us about it..."
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Price (ETB)</label>
                <input 
                  type="number"
                  required
                  className="w-full mt-1 bg-gray-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Category</label>
                <select 
                  className="w-full mt-1 bg-gray-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  aria-label="Category"
                >
                  <option value="goods">Goods</option>
                  <option value="tutoring">Tutoring</option>
                  <option value="digital">Digital</option>
                  <option value="services">Services</option>
                </select>
              </div>
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-xl hover:bg-indigo-700 transition-all mt-4"
            >
              {loading ? 'Creating...' : 'Launch Listing'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddListingModal;
