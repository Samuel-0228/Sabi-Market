import React from 'react';
import InfoLayout from './InfoLayout';
import { ShieldAlert, MapPin, Eye, MessageSquare, AlertTriangle } from 'lucide-react';

const CampusSafetyPage: React.FC = () => {
  return (
    <InfoLayout title="Campus Safety">
      <div className="space-y-10">
        <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
          SavvyMarket aims to create a safe trading environment for Addis Ababa University students. While we provide the platform, safety is a community effort.
        </p>

        <div className="grid gap-6">
          {[
            {
              icon: <MapPin className="text-emerald-500" />,
              title: "Meet in Public Areas",
              description: "Always coordinate meetings in well-lit, busy public areas on campus, such as the library entrance, student lounges, or near security posts."
            },
            {
              icon: <Eye className="text-blue-500" />,
              title: "Verify Before Paying",
              description: "Thoroughly inspect the product's condition and functionality before completing the payment. Never pay for an item you haven't seen."
            },
            {
              icon: <ShieldAlert className="text-amber-500" />,
              title: "Protect Personal Info",
              description: "Avoid sharing sensitive personal information like your exact dorm room number or private contact details until you trust the other party."
            },
            {
              icon: <MessageSquare className="text-indigo-500" />,
              title: "Use Platform Messaging",
              description: "Keep your conversations within SavvyMarket. This helps us maintain a record of the transaction and provides a layer of security."
            },
            {
              icon: <AlertTriangle className="text-red-500" />,
              title: "Report Suspicious Activity",
              description: "If a user behaves suspiciously or attempts to scam you, report them immediately to the SavvyMarket team."
            }
          ].map((tip, i) => (
            <div key={i} className="flex gap-6 p-6 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10">
              <div className="w-12 h-12 bg-white dark:bg-white/10 rounded-xl flex items-center justify-center shadow-md shrink-0">
                {tip.icon}
              </div>
              <div>
                <h3 className="text-lg font-black uppercase tracking-tighter dark:text-white mb-1">{tip.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{tip.description}</p>
              </div>
            </div>
          ))}
        </div>

        <section className="bg-red-500/10 p-8 rounded-3xl border border-red-500/20 text-center">
          <h2 className="text-xl font-black uppercase tracking-tighter text-red-600 dark:text-red-400 mb-2">Emergency?</h2>
          <p className="text-sm text-red-600/80 dark:text-red-400/80">
            If you feel unsafe or are in immediate danger, contact AAU Campus Security or local authorities immediately.
          </p>
        </section>
      </div>
    </InfoLayout>
  );
};

export default CampusSafetyPage;
