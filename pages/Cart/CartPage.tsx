
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
    <div className="bg-savvy-bg dark:bg-savvy-dark min-h-screen pt-24 md:pt-40 px-4 md:px-10 pb-32">
      <div className="max-w-[1000px] mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black dark:hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Feed
        </button>

        <h1 className="text-4xl md:text-7xl font-black tracking-tighter uppercase leading-[0.9] mb-12 dark:text-white">
          Your <br /> <span className="font-serif italic text-savvy-accent lowercase tracking-normal">Cart.</span>
        </h1>

        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence mode="popLayout">
              {items.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-20 text-center bg-white dark:bg-white/5 rounded-[2rem] border-2 border-dashed border-black/5 dark:border-white/5"
                >
                  <ShoppingBag className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-400 font-black uppercase tracking-[0.4em] text-[10px]">Your bag is empty</p>
                  <button 
                    onClick={() => navigate('/')}
                    className="mt-6 text-savvy-indigo font-black uppercase tracking-widest text-[10px] border-b-2 border-savvy-indigo pb-1"
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
                    className="bg-white dark:bg-[#0c0c0e] rounded-[2rem] p-6 flex gap-6 tibico-border shadow-sm group"
                  >
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden bg-gray-50 flex-shrink-0">
                      <img src={item.listing?.image_url} className="w-full h-full object-cover" alt={item.listing?.title} referrerPolicy="no-referrer" />
                    </div>
                    
                    <div className="flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-sm md:text-lg font-black dark:text-white leading-tight">{item.listing?.title}</h3>
                        <button 
                          onClick={() => removeItem(item.id)}
                          className="text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                      
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
                        Seller: {item.listing?.seller_name}
                      </p>

                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center gap-4 bg-gray-50 dark:bg-white/5 px-4 py-2 rounded-xl">
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="text-gray-400 hover:text-black dark:hover:text-white"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="text-xs font-black dark:text-white w-4 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="text-gray-400 hover:text-black dark:hover:text-white"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <p className="text-lg font-black dark:text-white tracking-tighter">
                          {(item.listing?.price || 0) * item.quantity} <span className="text-[10px] text-gray-400">ETB</span>
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-[#0c0c0e] rounded-[2rem] p-8 tibico-border shadow-xl sticky top-40">
              <h2 className="text-xl font-black dark:text-white uppercase tracking-tighter mb-8">Summary</h2>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <span>Subtotal</span>
                  <span>{total} ETB</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <span>Service Fee</span>
                  <span>0 ETB</span>
                </div>
                <div className="h-px bg-black/5 dark:bg-white/5 my-4" />
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-black dark:text-white uppercase tracking-widest">Total</span>
                  <span className="text-3xl font-black dark:text-white tracking-tighter">{total} <span className="text-xs text-gray-400">ETB</span></span>
                </div>
              </div>

              <button 
                disabled={items.length === 0}
                onClick={handleCheckout}
                className="w-full py-5 bg-savvy-indigo text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95 transition-all"
              >
                Checkout
              </button>
              
              <p className="mt-6 text-[8px] text-center font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                Secure trade handled via AAU Savvy Market. <br /> Meet in safe campus zones.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
