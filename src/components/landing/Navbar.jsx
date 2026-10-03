import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSiteInfo } from '../../context/SiteInfoContext';
import ContentModal from './ContentModal';

const Navbar = () => {
  const { siteInfo } = useSiteInfo();
  const displayName = siteInfo.company_name || siteInfo.platform_name || 'Nexus HRM';
  const logoLetter = displayName.charAt(0).toUpperCase();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', content: '' });

  const openModal = (e, title, content) => {
    e.preventDefault();
    setModalConfig({ isOpen: true, title, content });
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Features', href: '/#features' },
    { name: 'Pricing', href: '/#pricing' },
    { name: 'Testimonials', href: '/#testimonials' },
    { name: 'FAQ', href: '/#faq' },
  ];

  const handleScrollToSection = (e, href) => {
    if (href.startsWith('/#')) {
      e.preventDefault();
      const targetId = href.replace('/#', '');
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[60] transition-all duration-500 ${
        isScrolled
          ? 'bg-slate-900/95 backdrop-blur-xl shadow-glass'
          : 'bg-transparent'
      }`}
    >
    <div className="w-full bg-primary/10 border-b border-primary/20 py-1.5 overflow-hidden flex items-center">
      <motion.div 
        animate={{ x: ["-100vw", "0vw"] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="flex whitespace-nowrap min-w-[200vw]"
      >
        <p className="text-[11px] font-semibold text-primary-light uppercase tracking-widest w-full flex justify-around">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <a key={i} href="#" className="hover:text-white transition-colors inline-flex items-center gap-3 px-8">
              <Sparkles size={12} className="text-secondary" />
              Powered by {displayName}
              <Sparkles size={12} className="text-secondary" />
            </a>
          ))}
        </p>
      </motion.div>
    </div>
    <nav
      className={`w-full transition-all duration-500 ${
        isScrolled ? 'py-3 border-b border-white/10' : 'py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-3 group">
              {siteInfo.company_logo ? (
                <img src={siteInfo.company_logo} alt={displayName} className="h-10 object-contain" />
              ) : (
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/50 blur-md rounded-xl group-hover:bg-primary/80 transition-all duration-300"></div>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-heading font-bold text-xl relative z-10 border border-white/20 group-hover:scale-105 transition-transform duration-300">
                    {logoLetter}
                  </div>
                </div>
              )}
              <span className="font-heading font-bold text-2xl tracking-tight text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-400 transition-all duration-300">
                {displayName}
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8 bg-white/5 px-6 py-2 rounded-full border border-white/10 backdrop-blur-md">
            {navLinks.map((link) => (
              link.name === 'Privacy Policy' ? (
                <button
                  key={link.name}
                  onClick={(e) => openModal(e, 'Privacy Policy', siteInfo.privacy_policy)}
                  className="font-sans font-medium text-sm text-slate-300 hover:text-white transition-colors relative group bg-transparent border-none cursor-pointer"
                >
                  {link.name}
                  <span className="absolute -bottom-2 left-1/2 w-0 h-1 bg-primary rounded-t-full transition-all duration-300 group-hover:w-full group-hover:left-0 shadow-[0_0_10px_rgba(37,99,235,0.8)]"></span>
                </button>
              ) : link.href.startsWith('/#') ? (
                <a
                  key={link.name}
                  href={link.href.replace('/', '')}
                  onClick={(e) => handleScrollToSection(e, link.href)}
                  className="font-sans font-medium text-sm text-slate-300 hover:text-white transition-colors relative group"
                >
                  {link.name}
                  <span className="absolute -bottom-2 left-1/2 w-0 h-1 bg-primary rounded-t-full transition-all duration-300 group-hover:w-full group-hover:left-0 shadow-[0_0_10px_rgba(37,99,235,0.8)]"></span>
                </a>
              ) : link.href.startsWith('/') ? (
                <Link
                  key={link.name}
                  to={link.href}
                  className="font-sans font-medium text-sm text-slate-300 hover:text-white transition-colors relative group"
                >
                  {link.name}
                  <span className="absolute -bottom-2 left-1/2 w-0 h-1 bg-primary rounded-t-full transition-all duration-300 group-hover:w-full group-hover:left-0 shadow-[0_0_10px_rgba(37,99,235,0.8)]"></span>
                </Link>
              ) : (
                <a
                  key={link.name}
                  href={link.href}
                  className="font-sans font-medium text-sm text-slate-300 hover:text-white transition-colors relative group"
                >
                  {link.name}
                  <span className="absolute -bottom-2 left-1/2 w-0 h-1 bg-primary rounded-t-full transition-all duration-300 group-hover:w-full group-hover:left-0 shadow-[0_0_10px_rgba(37,99,235,0.8)]"></span>
                </a>
              )
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/login" className="btn-premium py-2.5 px-6 text-sm flex items-center gap-2 group">
              Get Started
              <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-slate-300 hover:text-white bg-white/5 p-2 rounded-lg border border-white/10 transition-colors focus:outline-none"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="md:hidden absolute top-full left-0 right-0 bg-navy-dark/95 backdrop-blur-xl border-b border-white/10 shadow-2xl overflow-hidden"
          >
            <div className="px-4 py-6 space-y-2">
              {navLinks.map((link) => (
                link.name === 'Privacy Policy' ? (
                  <button
                    key={link.name}
                    onClick={(e) => openModal(e, 'Privacy Policy', siteInfo.privacy_policy)}
                    className="block w-full text-left px-4 py-3 rounded-xl text-base font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors bg-transparent border-none cursor-pointer"
                  >
                    {link.name}
                  </button>
                ) : link.href.startsWith('/#') ? (
                  <a
                    key={link.name}
                    href={link.href.replace('/', '')}
                    className="block px-4 py-3 rounded-xl text-base font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                    onClick={(e) => handleScrollToSection(e, link.href)}
                  >
                    {link.name}
                  </a>
                ) : link.href.startsWith('/') ? (
                  <Link
                    key={link.name}
                    to={link.href}
                    className="block px-4 py-3 rounded-xl text-base font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.name}
                  </Link>
                ) : (
                  <a
                    key={link.name}
                    href={link.href}
                    className="block px-4 py-3 rounded-xl text-base font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.name}
                  </a>
                )
              ))}
              <div className="pt-6 mt-4 border-t border-white/10 flex flex-col gap-3 px-2">
                <Link
                  to="/login"
                  className="w-full btn-premium py-3 rounded-xl flex items-center justify-center gap-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Sparkles size={16} />
                  Get Started / Login
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ContentModal 
        isOpen={modalConfig.isOpen} 
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })} 
        title={modalConfig.title} 
        content={modalConfig.content} 
      />
    </nav>
    </header>
  );
};

export default Navbar;
