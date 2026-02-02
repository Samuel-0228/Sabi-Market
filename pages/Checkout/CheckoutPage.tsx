
import React, { useState } from 'react';
import { Listing } from '../../types/index.d';
import { db } from '../../services/supabase/db';
import { useLanguage } from '../../app/LanguageContext';
import { COMMISSION_RATE } from '../../config/constants';

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
    if (!deliveryInfo.trim()) return alert("Provide delivery details");
    setLoading(true);
    try {
      await db.createOrder(listing, listing.price, deliveryInfo);
      onSuccess();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <button onClick={onCancel} className="mb-10 p-4 bg-white dark:bg-white/5 rounded-xl shadow-sm">← Back</button>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="bg-white dark:bg-[#141414] p-10 rounded-[2.5rem] shadow-sm">
          <h2 className="text-2xl font-black mb-6 dark:text-white">{listing.title}</h2>
          <textarea 
            className="w-full bg-gray-50 dark:bg-black p-6 rounded-2xl outline-none dark:text-white" 
            placeholder="Dormitory number, campus..." 
            value={deliveryInfo} 
            onChange={e => setDeliveryInfo(e.target.value)} 
          />
        </div>
        <div className="bg-black text-white p-10 rounded-[2.5rem]">
          <h3 className="text-xl font-black mb-6">Total: {total.toFixed(2)} ETB</h3>
          <button onClick={handlePlaceOrder} disabled={loading} className="w-full bg-white text-black p-5 rounded-2xl font-black uppercase">Place Order</button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
