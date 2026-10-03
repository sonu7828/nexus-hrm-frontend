import React from 'react';

const DashboardPreview = () => {
  return (
    <div className="relative mx-auto max-w-5xl rounded-[2.5rem] p-[2px] bg-gradient-to-b from-primary/50 via-accent/20 to-navy-dark shadow-[0_0_50px_rgba(37,99,235,0.3)] group">
      <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-[2.5rem] pointer-events-none"></div>
      
      {/* Browser Chrome / Inner container */}
      <div className="relative rounded-[2.4rem] overflow-hidden bg-navy-dark border border-white/5 shadow-inner flex flex-col group-hover:-translate-y-2 transition-transform duration-500">
        <img 
          src="/dashboard-mockup.png" 
          alt="HRM Attendance Dashboard Mockup" 
          className="w-full h-auto object-cover border-none"
        />
        {/* Subtle overlay for blending */}
        <div className="absolute inset-0 bg-gradient-to-t from-navy-dark/40 to-transparent pointer-events-none mix-blend-overlay"></div>
      </div>
    </div>
  );
};

export default DashboardPreview;
