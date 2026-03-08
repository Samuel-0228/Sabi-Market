import React from 'react';
import InfoLayout from './InfoLayout';

const TermsOfServicePage: React.FC = () => {
  return (
    <InfoLayout title="Terms of Service">
      <div className="space-y-8 text-gray-600 dark:text-gray-400 leading-relaxed">
        <section>
          <h2 className="text-2xl font-black uppercase tracking-tighter dark:text-white mb-4">User Responsibility</h2>
          <p>
            Users must provide accurate information when creating an account and listing items. Misuse of the platform, including fraudulent activity, may result in account suspension.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-black uppercase tracking-tighter dark:text-white mb-4">Sellers</h2>
          <p>
            Sellers are responsible for the items they list. Listings must be accurate, and sellers must be prepared to complete transactions as described.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-black uppercase tracking-tighter dark:text-white mb-4">Buyers</h2>
          <p>
            Buyers must verify products before purchasing. SavvyMarket is not responsible for disputes between users, although we provide tools to help resolve them.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-black uppercase tracking-tighter dark:text-white mb-4">Platform Role</h2>
          <p>
            The platform is not responsible for disputes between users. We provide the infrastructure for student-to-student trading but do not guarantee the quality or legality of items listed.
          </p>
        </section>

        <section className="bg-gray-50 dark:bg-white/5 p-6 rounded-2xl border border-gray-100 dark:border-white/10 italic">
          <p className="text-sm">
            By using SavvyMarket, you agree to these terms and conditions. We reserve the right to update these terms at any time.
          </p>
        </section>
      </div>
    </InfoLayout>
  );
};

export default TermsOfServicePage;
