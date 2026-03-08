import React from 'react';
import InfoLayout from './InfoLayout';
import { ShieldCheck, Lock, CheckCircle } from 'lucide-react';

const EscrowTermsPage: React.FC = () => {
  return (
    <InfoLayout title="Escrow Terms">
      <div className="space-y-10">
        <section>
          <h2 className="text-2xl font-black uppercase tracking-tighter dark:text-white mb-6">Escrow in Transactions</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
            Escrow is used to increase trust between buyers and sellers. It acts as a neutral third party that holds funds until both parties are satisfied with the transaction.
          </p>
        </section>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: <Lock className="text-amber-500" />,
              title: "Secure Hold",
              description: "Funds are temporarily held until a transaction is confirmed by both parties."
            },
            {
              icon: <ShieldCheck className="text-emerald-500" />,
              title: "Trust Building",
              description: "Escrow provides a layer of security that encourages more trading within the community."
            },
            {
              icon: <CheckCircle className="text-indigo-500" />,
              title: "Fair Resolution",
              description: "Both parties must follow the platform guidelines for escrow transactions to ensure fairness."
            }
          ].map((item, i) => (
            <div key={i} className="p-8 bg-gray-50 dark:bg-white/5 rounded-3xl border border-gray-100 dark:border-white/10 text-center">
              <div className="w-16 h-16 bg-white dark:bg-white/10 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-6">
                {item.icon}
              </div>
              <h3 className="text-lg font-black uppercase tracking-tighter dark:text-white mb-2">{item.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>

        <section className="bg-savvy-accent/10 p-8 rounded-3xl border border-savvy-accent/20">
          <h2 className="text-xl font-black uppercase tracking-tighter text-savvy-accent mb-4">Escrow Guidelines</h2>
          <ul className="space-y-4 text-sm text-gray-600 dark:text-gray-400 list-disc pl-6">
            <li>Buyers should only release funds after they have received and inspected the product.</li>
            <li>Sellers should only ship or hand over items after they have received confirmation that funds are in escrow.</li>
            <li>In case of a dispute, SavvyMarket will review the transaction and provide a resolution based on our terms.</li>
          </ul>
        </section>
      </div>
    </InfoLayout>
  );
};

export default EscrowTermsPage;
