
import React, { useState } from 'react';
import { Listing, CartItem } from '../../types/index';
import { db } from '../../services/supabase/db';
import { useLanguage } from '../../app/LanguageContext';
import { useUIStore } from '../../store/ui.store';
import { useCartStore } from '../../store/cart.store';
import { useAuthStore } from '../../features/auth/auth.store';

interface CheckoutProps {
  listing?: Listing;
  items?: CartItem[];
  onSuccess: () => void;
  onCancel: () => void;
}

const Checkout: React.FC<CheckoutProps> = ({ listing, items, onSuccess, onCancel }) => {
  const { t } = useLanguage();
  const { addToast } = useUIStore();
  const { user } = useAuthStore();
  const { clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState('');

  const checkoutItems = items || (listing ? [{ listing, quantity: 1 }] : []);
  const total = checkoutItems.reduce((sum, item) => sum + (item.listing?.price || 0) * (item.quantity || 1), 0);

  const handlePlaceOrder = async () => {
    if (!deliveryInfo.trim()) {
      addToast("Please provide meeting details!", "info");
      return;
    }
    
    setLoading(true);
    try {
      // Create orders for each item
      // In a real app, we might group by seller, but for simplicity here we create one order per listing
      for (const item of checkoutItems) {
        if (item.listing) {
          await db.createOrder(item.listing, item.listing.price * (item.quantity || 1), deliveryInfo);
        }
      }
      
      if (items && user) {
        await clearCart(user.id);
      }

      addToast("Trade requests sent! Check 'My Orders'.", "success");
      onSuccess();
    } catch (err: any) {
      console.error("Checkout Failure:", err);
      const errorMsg = err.message || "Trade failed. Please try again.";
      addToast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-3 md:px-6 py-8 md:py-16 animate-in fade-in duration-700">
      <div className="flex items-center gap-4 md:gap-6 mb-8 md:mb-12">
        <button 
          onClick={onCancel} 
          className="p-3 md:p-4 bg-white dark:bg-white/5 rounded-xl md:rounded-2xl shadow-sm hover:scale-105 transition-all text-black dark:text-white border border-gray-100 dark:border-white/5"
        >
          ← {t('back')}
        </button>
        <div>
          <h1 className="text-2xl md:text-4xl font-black tracking-tighter dark:text-white">Secure Checkout.</h1>
          <p className="text-[10px] md:text-sm text-gray-400 font-medium italic">Review items and meeting details</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
        <div className="space-y-6 md:space-y-8">
          <div className="space-y-3 md:space-y-4">
            {checkoutItems.map((item, idx) => (
              <div key={idx} className="bg-white dark:bg-[#0c0c0e] p-3 md:p-6 rounded-xl md:rounded-[2rem] shadow-sm border border-gray-100 dark:border-white/5 flex gap-4 md:gap-6 items-center">
                <div className="w-16 h-16 md:w-20 md:h-20 flex-shrink-0 bg-gray-50 dark:bg-white/5 rounded-lg md:rounded-xl overflow-hidden shadow-md">
                  <img src={item.listing?.image_url} className="w-full h-full object-cover" alt={item.listing?.title} referrerPolicy="no-referrer" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm md:text-lg font-bold md:font-black dark:text-white leading-tight">{item.listing?.title}</h3>
                  <p className="text-gray-400 text-[8px] md:text-[10px] font-bold uppercase tracking-widest mt-1">Qty: {item.quantity || 1} • Seller: {item.listing?.seller_name}</p>
                  <p className="text-indigo-600 font-black mt-1 text-sm md:text-base">{(item.listing?.price || 0) * (item.quantity || 1)} ETB</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 md:p-8 bg-indigo-50/50 dark:bg-indigo-500/5 rounded-2xl md:rounded-[2.5rem] border border-indigo-100 dark:border-indigo-500/10">
            <h4 className="text-[8px] md:text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-3 md:mb-4">🛡️ Escrow Protection Active</h4>
            <div className="space-y-3 md:space-y-4">
              <div className="flex gap-3 md:gap-4">
                <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-indigo-600 mt-1.5 md:mt-2 shrink-0"></div>
                <p className="text-[10px] md:text-xs font-medium text-gray-600 dark:text-gray-400">Your funds are held by Savvy until you confirm delivery.</p>
              </div>
              <div className="flex gap-3 md:gap-4">
                <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-indigo-600 mt-1.5 md:mt-2 shrink-0"></div>
                <p className="text-[10px] md:text-xs font-medium text-gray-600 dark:text-gray-400">Cancel trade anytime before the seller accepts.</p>
              </div>
            </div>
          </div>

          <div className="space-y-2 md:space-y-3">
            <label className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Meeting & Delivery Details</label>
            <textarea 
              className="w-full bg-white dark:bg-[#0c0c0e] border border-gray-100 dark:border-white/10 rounded-xl md:rounded-[2rem] p-4 md:p-8 min-h-[120px] md:min-h-[160px] outline-none focus:ring-2 focus:ring-indigo-600 transition-all dark:text-white shadow-sm font-medium text-sm"
              placeholder="e.g. Meet at 6 Kilo main gate, tomorrow 4pm."
              value={deliveryInfo}
              onChange={(e) => setDeliveryInfo(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-black dark:bg-white text-white dark:text-black p-6 md:p-12 rounded-2xl md:rounded-[3.5rem] shadow-2xl h-fit">
          <h3 className="text-xl md:text-2xl font-black mb-6 md:mb-10 tracking-tight">Summary</h3>
          
          <div className="space-y-4 md:space-y-6 mb-8 md:mb-12">
            <div className="flex justify-between items-center opacity-60">
              <span className="text-xs md:text-sm font-bold">Subtotal</span>
              <span className="font-black text-sm md:text-base">{total} ETB</span>
            </div>
            <div className="flex justify-between items-center text-green-500">
              <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest">AAU Fee</span>
              <span className="font-black text-[8px] md:text-[9px] uppercase tracking-widest">Free (Beta)</span>
            </div>
            <div className="h-[1px] bg-white/10 dark:bg-black/10"></div>
            <div className="flex justify-between items-center">
              <span className="text-base md:text-lg font-black">Total Cost</span>
              <span className="text-2xl md:text-4xl font-black">{total} ETB</span>
            </div>
          </div>

          <button 
            disabled={loading || checkoutItems.length === 0}
            onClick={handlePlaceOrder}
            className="w-full bg-white dark:bg-black text-black dark:text-white py-4 md:py-6 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-xs shadow-xl active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Confirm Secure Order'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
