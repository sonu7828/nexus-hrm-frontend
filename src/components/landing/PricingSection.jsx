import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../utils/axios';

const PricingSection = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/plans')
      .then(res => {
        if (res.data && res.data.length > 0) {
          setPlans(res.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching plans:', err);
        setLoading(false);
      });
  }, []);

  return (
    <section id="pricing" className="py-12 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[1000px] h-[500px] bg-primary/5 rounded-full blur-[150px] pointer-events-none z-0"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-primary-light font-semibold tracking-wide uppercase text-xs mb-5 backdrop-blur-md">
              Flexible Pricing
            </div>
            <h3 className="text-4xl md:text-5xl lg:text-6xl font-heading font-extrabold text-white mb-6 tracking-tight">
              Plans that scale with <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-light to-secondary">your team</span>
            </h3>
            <p className="text-lg text-slate-400">Choose the perfect plan for your business needs. No hidden fees, ever.</p>
          </motion.div>
        </div>

        <div className="flex flex-wrap justify-center gap-8 max-w-7xl mx-auto">
          {loading ? (
             <div className="col-span-full flex justify-center py-12">
               <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
             </div>
          ) : plans.length === 0 ? (
             <div className="col-span-full text-center text-slate-400 py-12">No plans available at the moment.</div>
          ) : plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              className={`relative rounded-3xl p-6 bg-navy-dark/60 backdrop-blur-xl border transition-all duration-500 flex flex-col group w-full max-w-[350px] md:w-[calc(50%-16px)] md:max-w-none xl:w-[calc(25%-24px)] ${
                plan.isPopular 
                ? 'border-primary shadow-[0_0_30px_rgba(37,99,235,0.2)] xl:scale-105 z-10' 
                : 'border-white/10 shadow-glass hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:border-white/20 hover:-translate-y-2'
              }`}
            >
              {!!plan.isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-secondary text-white text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-[0_0_15px_rgba(37,99,235,0.5)]">
                  <Sparkles size={14} className="text-white" /> MOST POPULAR
                </div>
              )}
              
              <div className="mb-2">
                <h4 className="text-xl font-bold text-white font-heading mb-1 group-hover:text-primary-light transition-colors">{plan.name}</h4>
                <p className="text-sm text-slate-400 leading-relaxed">{plan.description}</p>
              </div>

              <div className="mb-4 pb-4 border-b border-white/10">
                <span className="text-4xl md:text-5xl font-extrabold text-white font-heading tracking-tight">
                  {plan.price && (plan.price.startsWith('S$') || plan.price.startsWith('SGD')) ? plan.price : `S$${plan.price ? plan.price.replace(/[^0-9.]/g, '') : '0'}`}
                </span>
                <span className="text-slate-400 font-medium ml-1">{plan.duration}</span>
              </div>

              <ul className="space-y-2 mb-6 flex-1">
                {(() => {
                    let fList = [];
                    if (plan.features) {
                      try {
                        fList = Array.isArray(plan.features) ? plan.features : JSON.parse(plan.features);
                      } catch(e) {}
                    }
                    return fList.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 size={20} className={`shrink-0 mt-0.5 ${plan.isPopular ? 'text-primary-light' : 'text-slate-400'}`} />
                        <span className="text-slate-300 text-sm font-medium">{feature}</span>
                      </li>
                    ));
                })()}
              </ul>

              <Link 
                to={`/register?plan=${encodeURIComponent(plan.name)}`}
                className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 ${plan.isPopular ? 'btn-premium' : 'bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 shadow-glass'}`}>
                {plan.buttonText} {!!plan.isPopular && <ChevronRight size={18} />}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
