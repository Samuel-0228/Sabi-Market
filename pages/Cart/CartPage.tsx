
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Plus, Minus, ArrowLeft, ShoppingBag } from 'lucide-react';
import { useAuthStore } from '../../features/auth/auth.store';
import { useCartStore } from '../../store/cart.store';

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
    items, 
    loading, 
    fetchCart, 
    updateQuantity, 
    removeItem, 
    getTotal 
  } = useCartStore();

  useEffect(() => {
    if (user) {
      fetchCart(user.id);
    }
  }, [user, fetchCart]);

  const total = getTotal();

  if (loading && items.length === 0) {
    return (
      <div className="min-h-screen pt-40 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-savvy-indigo" />
      </div>
    );
  }

  const handleCheckout = () => {
    // Navigate to checkout with all cart items
    navigate('/checkout', { state: { items } });
  };

  return (
    <div className="bg-savvy-bg dark:bg-savvy-dark min-h-screen pt-20 md:pt-40 px-3 md:px-10 pb-32">
      <div className="max-w-[1000px] mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black dark:hover:text-white mb-6 md:mb-8 transition-colors"
        >
          <ArrowLeft className="w-3 h-3 md:w-4 md:h-4" /> Back to Feed
        </button>

        <h1 className="text-3xl md:text-7xl font-black tracking-tighter uppercase leading-[0.9] mb-8 md:mb-12 dark:text-white">
          Your <br /> <span className="font-serif italic text-savvy-accent lowercase tracking-normal">Cart.</span>
        </h1>

        <div className="grid lg:grid-cols-3 gap-6 md:gap-12">
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            <AnimatePresence mode="popLayout">
              {items.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-12 md:py-20 text-center bg-white dark:bg-white/5 rounded-2xl md:rounded-[2rem] border-2 border-dashed border-black/5 dark:border-white/5"
                >
                  <ShoppingBag className="w-10 h-10 md:w-12 md:h-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-400 font-black uppercase tracking-[0.4em] text-[9px] md:text-[10px]">Your bag is empty</p>
                  <button 
                    onClick={() => navigate('/')}
                    className="mt-4 md:mt-6 text-savvy-indigo font-black uppercase tracking-widest text-[9px] md:text-[10px] border-b-2 border-savvy-indigo pb-1"
                  >
                    Start Shopping
                  </button>
                </motion.div>
              ) : (
                items.map((item) => (
                  <motion.div 
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="bg-white dark:bg-[#0c0c0e] rounded-2xl md:rounded-[2rem] p-3 md:p-6 flex gap-4 md:gap-6 tibico-border shadow-sm group"
                  >
                    <div className="w-20 h-20 md:w-32 md:h-32 rounded-xl md:rounded-2xl overflow-hidden bg-gray-50 flex-shrink-0">
                      <img src={item.listing?.image_url} className="w-full h-full object-cover" alt={item.listing?.title} referrerPolicy="no-referrer" />
                    </div>
                    
                    <div className="flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-1 md:mb-2">
                        <h3 className="text-[13px] md:text-lg font-bold md:font-black dark:text-white leading-tight line-clamp-2">{item.listing?.title}</h3>
                        <button 
                          onClick={() => removeItem(item.id)}
                          className="text-gray-300 hover:text-red-500 transition-colors p-1"
                        >
                          <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                      </div>
                      
                      <p className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 md:mb-4">
                        Seller: {item.listing?.seller_name}
                      </p>

                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center gap-3 md:gap-4 bg-gray-50 dark:bg-white/5 px-2 py-1 md:px-4 md:py-2 rounded-lg md:rounded-xl">
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="text-gray-400 hover:text-black dark:hover:text-white"
                          >
                            <Minus className="w-3 h-3 md:w-4 md:h-4" />
                          </button>
                          <span className="text-[11px] md:text-xs font-black dark:text-white w-3 md:w-4 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="text-gray-400 hover:text-black dark:hover:text-white"
                          >
                            <Plus className="w-3 h-3 md:w-4 md:h-4" />
                          </button>
                        </div>
                        
                        <p className="text-base md:text-lg font-black dark:text-white tracking-tighter">
                          {(item.listing?.price || 0) * item.quantity} <span className="text-[8px] md:text-[10px] text-gray-400">ETB</span>
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-[#0c0c0e] rounded-2xl md:rounded-[2rem] p-6 md:p-8 tibico-border shadow-xl sticky top-40 hidden lg:block">
              <h2 className="text-lg md:text-xl font-black dark:text-white uppercase tracking-tighter mb-6 md:mb-8">Summary</h2>
              
              <div className="space-y-3 md:space-y-4 mb-6 md:mb-8">
                <div className="flex justify-between text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <span>Subtotal</span>
                  <span>{total} ETB</span>
                </div>
                <div className="flex justify-between text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <span>Service Fee</span>
                  <span>0 ETB</span>
                </div>
                <div className="h-px bg-black/5 dark:bg-white/5 my-3 md:my-4" />
                <div className="flex justify-between items-baseline">
                  <span className="text-xs md:text-sm font-black dark:text-white uppercase tracking-widest">Total</span>
                  <span className="text-2xl md:text-3xl font-black dark:text-white tracking-tighter">{total} <span className="text-[10px] md:text-xs text-gray-400">ETB</span></span>
                </div>
              </div>

              <button 
                disabled={items.length === 0}
                onClick={handleCheckout}
                className="w-full py-4 md:py-5 bg-savvy-indigo text-white rounded-xl md:rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-[0.3em] shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95 transition-all"
              >
                Checkout
              </button>
              
              <p className="mt-4 md:mt-6 text-[7px] md:text-[8px] text-center font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                Secure trade handled via AAU Savvy Market. <br /> Meet in safe campus zones.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Footer Checkout */}
      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-[100] lg:hidden bg-white/90 dark:bg-black/90 backdrop-blur-xl border-t dark:border-white/10 p-4 flex items-center justify-between animate-in slide-in-from-bottom duration-500 pb-safe">
          <div>
            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Amount</p>
            <p className="text-xl font-black dark:text-white tracking-tighter">
              {total} <span className="text-[10px] text-gray-400">ETB</span>
            </p>
          </div>
          <button 
            onClick={handleCheckout}
            className="bg-savvy-indigo text-white px-8 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all"
          >
            Checkout ({items.length})
          </button>
        </div>
      )}
    </div>
  );
};

export default CartPage;
