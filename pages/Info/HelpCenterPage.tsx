import React from 'react';
import InfoLayout from './InfoLayout';
import { Mail, MessageCircle } from 'lucide-react';

const HelpCenterPage: React.FC = () => {
  return (
    <InfoLayout title="Help Center">
      <div className="space-y-12">
        <section>
          <h2 className="text-2xl font-black uppercase tracking-tighter dark:text-white mb-6">User Guidance</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-black uppercase tracking-widest text-savvy-accent">How to create an account</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                Simply click on the "JOIN" button at the top right of the page. Use your AAU student email to register and verify your account.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-black uppercase tracking-widest text-savvy-accent">How to list a product</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                Go to your Dashboard and click on "Add Listing". Provide clear photos, a detailed description, and a fair price.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-black uppercase tracking-widest text-savvy-accent">How to contact a seller</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                On the product details page, use the "Message Seller" button to start a conversation through our secure messaging system.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-black uppercase tracking-widest text-savvy-accent">How to complete a transaction</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                Coordinate a safe meeting place on campus, verify the product, and complete the payment. Use escrow for added security.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-gray-50 dark:bg-white/5 p-8 rounded-3xl border border-gray-100 dark:border-white/10">
          <h2 className="text-2xl font-black uppercase tracking-tighter dark:text-white mb-6">Contact Support</h2>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white dark:bg-white/10 rounded-2xl flex items-center justify-center shadow-lg">
                <Mail className="text-savvy-accent" size={24} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-gray-400">Email Support</p>
                <a href="mailto:savvysocietyteam@gmail.com" className="text-lg font-bold dark:text-white hover:text-savvy-accent transition-colors">
                  savvysocietyteam@gmail.com
                </a>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white dark:bg-white/10 rounded-2xl flex items-center justify-center shadow-lg">
                <MessageCircle className="text-savvy-accent" size={24} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-gray-400">Telegram Channels</p>
                <div className="flex gap-4">
                  <a href="https://t.me/savvy_society" target="_blank" rel="noreferrer" className="text-lg font-bold dark:text-white hover:text-savvy-accent transition-colors">
                    @savvy_society
                  </a>
                  <a href="https://t.me/savvy_market" target="_blank" rel="noreferrer" className="text-lg font-bold dark:text-white hover:text-savvy-accent transition-colors">
                    @savvy_market
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-black uppercase tracking-tighter dark:text-white mb-4">Troubleshooting</h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed italic">
            Experiencing technical issues? Try refreshing the page or clearing your browser cache. If the problem persists, reach out to our support team.
          </p>
        </section>
      </div>
    </InfoLayout>
  );
};

export default HelpCenterPage;
