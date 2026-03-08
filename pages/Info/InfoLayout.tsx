import React from 'react';
import { motion } from 'framer-motion';

interface InfoLayoutProps {
  title: string;
  children: React.ReactNode;
}

const InfoLayout: React.FC<InfoLayoutProps> = ({ title, children }) => {
  return (
    <div className="min-h-screen bg-savvy-bg dark:bg-savvy-dark pt-32 pb-20 px-6">
      <div className="max-w-[900px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl md:text-6xl font-black dark:text-white tracking-tighter uppercase mb-4">
            {title}
          </h1>
          <div className="h-2 w-20 bg-savvy-accent rounded-full" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="prose prose-lg dark:prose-invert max-w-none"
        >
          <div className="bg-white dark:bg-white/5 rounded-[2rem] p-8 md:p-12 tibico-border shadow-xl">
            {children}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default InfoLayout;
