
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X } from 'lucide-react';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => Promise<void>;
  title: string;
  subtitle: string;
}

const RatingModal: React.FC<RatingModalProps> = ({ isOpen, onClose, onSubmit, title, subtitle }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setLoading(true);
    try {
      await onSubmit(rating, comment);
      onClose();
    } catch (error) {
      console.error("Rating submission failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-white dark:bg-[#0c0c0e] rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-black/5 dark:border-white/5 overflow-hidden"
          >
            <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>

            <div className="text-center mb-8">
              <h3 className="text-2xl font-black dark:text-white tracking-tighter uppercase mb-2">{title}</h3>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{subtitle}</p>
            </div>

            <div className="flex justify-center gap-2 mb-8">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-125 active:scale-90"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      (hover || rating) >= star ? 'fill-savvy-accent text-savvy-accent' : 'text-gray-200 dark:text-white/10'
                    }`}
                  />
                </button>
              ))}
            </div>

            <div className="space-y-4 mb-8">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Comment (Optional)</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience..."
                className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-2xl px-6 py-4 outline-none dark:text-white font-bold focus:ring-2 focus:ring-savvy-accent transition-all resize-none h-32"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={rating === 0 || loading}
              className="w-full py-5 bg-savvy-accent text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
            >
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default RatingModal;
