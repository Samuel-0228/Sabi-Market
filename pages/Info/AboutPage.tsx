import React from 'react';
import InfoLayout from './InfoLayout';

const AboutPage: React.FC = () => {
  return (
    <InfoLayout title="About Savvy">
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-black uppercase tracking-tighter dark:text-white mb-4">Our Mission</h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            SavvyMarket is a student marketplace based at Addis Ababa University where students can sell items they no longer need, browse listings from other students, and connect safely with buyers and sellers within the campus community.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-black uppercase tracking-tighter dark:text-white mb-4">Why SavvyMarket?</h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            The platform is designed to make student-to-student trading easier, safer, and more organized. We believe that campus life is better when we share resources and support each other's entrepreneurial spirit.
          </p>
        </section>

        <section className="bg-savvy-accent/10 p-6 rounded-2xl border border-savvy-accent/20">
          <p className="text-savvy-accent font-bold italic">
            "Empowering AAU students through a secure and efficient local marketplace."
          </p>
        </section>
      </div>
    </InfoLayout>
  );
};

export default AboutPage;
