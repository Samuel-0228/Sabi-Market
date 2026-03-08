import React from 'react';
import InfoLayout from './InfoLayout';

const PrivacyPolicyPage: React.FC = () => {
  return (
    <InfoLayout title="Privacy Policy">
      <div className="space-y-8 text-gray-600 dark:text-gray-400 leading-relaxed">
        <section>
          <h2 className="text-2xl font-black uppercase tracking-tighter dark:text-white mb-4">Data Collection</h2>
          <p>
            User information is used primarily to operate the platform and facilitate transactions between students. We collect basic profile information such as your name, AAU email, and listing details.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-black uppercase tracking-tighter dark:text-white mb-4">Data Usage</h2>
          <p>
            Your data is used to improve platform functionality, enhance user experience, and provide personalized recommendations. We use analytics to understand how our community uses SavvyMarket.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-black uppercase tracking-tighter dark:text-white mb-4">Third Parties</h2>
          <p>
            We respect your privacy. Personal information is not sold to third parties. We only share data when necessary to provide our services (e.g., payment processing) or when required by law.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-black uppercase tracking-tighter dark:text-white mb-4">Security</h2>
          <p>
            Users should keep their account credentials secure. We implement industry-standard security measures to protect your data, but no system is 100% secure.
          </p>
        </section>

        <section className="pt-8 border-t border-gray-100 dark:border-white/10">
          <p className="text-xs uppercase font-black tracking-widest text-gray-400">
            Last Updated: March 2026
          </p>
        </section>
      </div>
    </InfoLayout>
  );
};

export default PrivacyPolicyPage;
