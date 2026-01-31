
import React, { useState } from 'react';
import { Listing } from '../types';
import { db } from '../services/supabaseService';
import { useLanguage } from './LanguageContext';
import { COMMISSION_RATE } from '../constants';

interface CheckoutProps {
  listing: Listing;
  onSuccess: () => void;
  onCancel: () => void;
}

const Checkout: React.FC<CheckoutProps> = ({ listing, onSuccess, onCancel }) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState('');

  const commission = listing.price * COMMISSION_RATE;
  const total = listing.price + commission;

  const handlePlaceOrder = async () => {
    if (!deliveryInfo.trim()) {
      alert("Please provide delivery details (e.g., Campus, Dormitory No.)");
      return;
    }

    setLoading(true);
    try {
      await db.createOrder(listing, listing.price, deliveryInfo);
      alert("Success! Your order has been placed through Savvy Escrow.");
      onSuccess();
    } catch (err: any) {
      alert("Failed to place order: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 reveal">
      <div className="flex items-center gap-6 mb-16">
        <button onClick={onCancel} className="w-12 h-12 bg-white dark:bg-white/5 rounded-2xl flex items-center justify-center text-xl shadow-sm hover:scale-105 transition-all">←</button>
        <div>
          <h1 className="text-4xl font-black tracking-tighter dark:text-white">{t('secureCheckout')}</h1>
          <p className="text-gray-400 font-medium">Finalize your purchase securely.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left: Product & Delivery */}
        <div className="space-y-10">
          <div className="bg-white dark:bg-[#141414] p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-white/5 flex gap-6 items-center">
            <img src={listing.image_url} className="w-24 h-32 object-cover rounded-2xl" />
            <div>
              <h3 className="text-2xl font-black dark:text-white">{listing.title}</h3>
              <p className="text-gray-400 text-sm mt-1">{listing.seller_name}</p>
              <p className="text-xl font-black mt-2 dark:text-white">{listing.price} ETB</p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{t('deliveryInfo')}</label>
            <textarea 
              className="w-full bg-white dark:bg-[#141414] border border-gray-100 dark:border-white/5 rounded-[2rem] p-8 min-h-[160px] outline-none focus:ring-2 focus:ring-indigo-600 transition-all dark:text-white shadow-sm"
              placeholder={t('deliveryPlaceholder')}
              value={deliveryInfo}
              onChange={(e) => setDeliveryInfo(e.target.value)}
            />
          </div>
        </div>

        {/* Right: Summary */}
        <div className="bg-black dark:bg-white text-white dark:text-black p-10 rounded-[3rem] shadow-2xl h-fit">
          <h3 className="text-xl font-black mb-10 tracking-tight">{t('checkout')}</h3>
          
          <div className="space-y-6 mb-10">
            <div className="flex justify-between items-center opacity-70">
              <span className="text-sm font-bold">{t('price')}</span>
              <span className="font-black">{listing.price} ETB</span>
            </div>
            <div className="flex justify-between items-center opacity-70">
              <span className="text-sm font-bold">{t('commission')}</span>
              <span className="font-black">{commission.toFixed(2)} ETB</span>
            </div>
            <div className="h-[1px] bg-white/10 dark:bg-black/10"></div>
            <div className="flex justify-between items-center">
              <span className="text-lg font-black">{t('total')}</span>
              <span className="text-3xl font-black">{total.toFixed(2)} ETB</span>
            </div>
          </div>

          <button 
            disabled={loading}
            onClick={handlePlaceOrder}
            className="w-full bg-white dark:bg-black text-black dark:text-white py-6 rounded-[2rem] font-black uppercase tracking-widest text-sm shadow-xl active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? 'Processing...' : t('placeOrder')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
