import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, PlayCircle, Star, Users, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardPreview from './DashboardPreview';

const Hero = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
  };

  return (
    <section className="relative pt-24 pb-20 lg:pt-32 lg:pb-32 overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 blur-[120px] rounded-full pointer-events-none -z-10 animate-pulse"></div>
      <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-accent/20 blur-[100px] rounded-full pointer-events-none -z-10 animate-pulse delay-1000"></div>
      <div className="absolute bottom-0 right-1/3 w-[600px] h-[400px] bg-secondary/15 blur-[120px] rounded-full pointer-events-none -z-10"></div>
      
      {/* subtle grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] -z-10"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
        {/* Left Column - Text */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center lg:text-left flex-1 max-w-2xl mx-auto lg:mx-0"
        >
          {/* Badge */}
          <motion.div variants={itemVariants} className="flex justify-center lg:justify-start mb-8">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-slate-300 text-sm font-semibold font-sans backdrop-blur-md shadow-glass">
              <Zap size={16} className="text-secondary fill-secondary/20 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              <span>Next-Gen HR & Payroll Software</span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary mx-1 shadow-[0_0_8px_rgba(37,99,235,1)]"></span>
              <span className="text-white">v3.0 Live</span>
            </div>
          </motion.div>

          {/* Heading */}
          <motion.h1 variants={itemVariants} className="text-4xl md:text-5xl lg:text-6xl font-heading font-extrabold text-white tracking-tight leading-[1.1] mb-6">
            Smart Attendance, Payroll & HR <br className="hidden lg:block" />
            <span className="text-gradient">Automated for You</span>
          </motion.h1>

          {/* Subheading */}
          <motion.p variants={itemVariants} className="text-lg md:text-xl text-slate-400 font-sans mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
            Transform your workplace with AI-powered biometric attendance, instant payroll processing, and real-time employee tracking. Designed for modern enterprises.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-12">
            <Link to="/login" className="w-full sm:w-auto btn-premium py-3.5 px-8 text-base flex items-center justify-center gap-2">
              Get Started <ArrowRight size={20} />
            </Link>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-4 text-sm font-medium text-slate-400 font-sans">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-success drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
              Biometric Verified
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-success drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
              Real-Time Tracking
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-secondary drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]" />
              Bank-Grade Security
            </div>
          </motion.div>
        </motion.div>

        {/* Right Column - Dashboard Preview */}
        <motion.div 
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 w-full relative mt-16 lg:mt-0"
        >
          <div className="relative w-full max-w-[600px] mx-auto lg:max-w-none">
            <DashboardPreview />
            
            {/* Floating Elements Around Dashboard */}
            <motion.div 
              animate={{ y: [-10, 10, -10] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="hidden lg:flex absolute -left-12 top-20 glass-card-dark p-4 items-center gap-4 z-20 shadow-2xl scale-75 xl:scale-90 origin-left"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/30 shadow-[0_0_15px_rgba(37,99,235,0.3)]">
                <Users size={24} className="text-primary-light" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Active Employees</p>
                <p className="text-xl font-bold text-white">1,248</p>
              </div>
            </motion.div>
            
            <motion.div 
              animate={{ y: [10, -10, 10] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="hidden lg:flex absolute -right-4 bottom-24 glass-card-dark p-4 items-center gap-4 z-20 shadow-2xl scale-75 xl:scale-90 origin-right"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center border border-accent/30 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                <Star size={24} className="text-accent-light" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Payroll Processed</p>
                <p className="text-xl font-bold text-white">₹45.2M</p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
