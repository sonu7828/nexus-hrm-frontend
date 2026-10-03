import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSiteInfo } from '../../context/SiteInfoContext';

const CTASection = () => {
  const { siteInfo } = useSiteInfo();
  const displayName = siteInfo.company_name || siteInfo.platform_name || 'Nexus HRM Pro';

  return (
    <section className="py-24 relative overflow-hidden z-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass-card-dark border-primary/30 p-10 md:p-16 relative overflow-hidden"
        >
          {/* Internal Glows */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary/20 rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent/20 rounded-full blur-[80px] pointer-events-none translate-y-1/2 -translate-x-1/3"></div>

          <div className="relative z-10">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.5)]">
                <Zap size={32} className="text-white fill-white/20" />
              </div>
            </div>
            
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-extrabold text-white mb-6 leading-tight tracking-tight">
              Start Managing Your Workforce <br className="hidden md:block"/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-light to-secondary">Smarter Today</span>
            </h2>
            <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto font-sans leading-relaxed">
              Join 500+ innovative companies using {displayName} to automate their HR, biometric attendance, and payroll operations effortlessly.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-10">
              <Link to="/login" className="w-full sm:w-auto bg-white text-slate-800 hover:bg-slate-100 font-heading font-bold py-4 px-10 rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] active:scale-95 flex items-center justify-center gap-2 text-lg">
                Get Started Now <ArrowRight size={20} />
              </Link>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-slate-400 text-sm md:text-base font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-success drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]" /> Full feature access
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-success drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]" /> No setup fee
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-success drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]" /> No credit card required
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
