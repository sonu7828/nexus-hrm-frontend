import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';

const faqs = [
  {
    question: 'How easy is it to configure biometric attendance?',
    answer: 'It is highly straightforward. Once you register employee face profiles in the system, our smart edge recognition technology automatically syncs check-in/out logs directly with your dashboard.',
  },
  {
    question: 'Do I need technical skills to set up payroll?',
    answer: 'Not at all. Our system is designed with a user-friendly interface. You can set up payroll rules, tax deductions, and bonuses in a few clicks. Our support team is also available to help you with the initial configuration.',
  },
  {
    question: 'Is my company data secure?',
    answer: 'Yes, we take security very seriously. All data is encrypted both in transit and at rest using bank-grade AES-256 encryption. We also provide role-based access control and detailed activity logs.',
  },
  {
    question: 'Does the system support mobile devices?',
    answer: 'Absolutely. Employees can use our responsive mobile web app to mark attendance (via GPS or QR code), apply for leaves, and view their payslips on the go.',
  },
  {
    question: 'Can I upgrade or downgrade my plan later?',
    answer: 'Yes, you can change your subscription plan at any time from your billing dashboard. Changes will be pro-rated and reflected in your next billing cycle.',
  },
];

const FAQAccordion = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section id="faq" className="py-24 relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-primary-light font-semibold tracking-wide uppercase text-xs mb-5 backdrop-blur-md">
              Got Questions?
            </div>
            <h3 className="text-4xl md:text-5xl lg:text-6xl font-heading font-extrabold text-white mb-6">Frequently Asked Questions</h3>
          </motion.div>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div 
              key={index} 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-navy-light/40 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden hover:border-primary/50 transition-colors shadow-glass"
            >
              <button
                className="w-full px-6 py-5 text-left flex justify-between items-center focus:outline-none"
                onClick={() => setActiveIndex(activeIndex === index ? null : index)}
              >
                <span className="font-semibold text-lg text-white group-hover:text-primary-light transition-colors">{faq.question}</span>
                <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center transition-all duration-300 ${activeIndex === index ? 'bg-primary text-white shadow-[0_0_15px_rgba(37,99,235,0.5)] rotate-180' : 'bg-white/10 text-slate-400'}`}>
                  {activeIndex === index ? <Minus size={20} /> : <Plus size={20} />}
                </div>
              </button>
              
              <AnimatePresence>
                {activeIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="px-6 pb-6 text-slate-400 font-sans leading-relaxed border-t border-white/5 pt-4">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQAccordion;
