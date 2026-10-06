import React from 'react';
import { 
  Settings, 
  Users, 
  MonitorSmartphone, 
  CalendarDays, 
  FileText, 
  Calculator,
  ArrowDown
} from 'lucide-react';
import { motion } from 'framer-motion';

const Guide = () => {
  const steps = [
    {
      id: 1,
      title: "Configure System Settings",
      icon: <Settings size={28} />,
      color: "from-blue-500 to-indigo-500",
      bgLight: "bg-blue-50",
      iconColor: "text-blue-600",
      content: (
        <ul className="space-y-3 mt-4 text-slate-600 text-sm font-medium">
          <li className="flex gap-3">
            <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0 mt-1.5"></span>
            <span>Navigate to the <b>Settings</b> menu from the sidebar.</span>
          </li>
          <li className="flex gap-3">
            <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0 mt-1.5"></span>
            <span>Enter your company details — Shift Timing, Grace Period, and Late Deduction rules.</span>
          </li>
          <li className="flex gap-3">
            <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0 mt-1.5"></span>
            <span>Set up Email SMTP and Notifications so that all alerts work correctly.</span>
          </li>
        </ul>
      )
    },
    {
      id: 2,
      title: "Add Your Employees",
      icon: <Users size={28} />,
      color: "from-emerald-500 to-teal-500",
      bgLight: "bg-emerald-50",
      iconColor: "text-emerald-600",
      content: (
        <ul className="space-y-3 mt-4 text-slate-600 text-sm font-medium">
          <li className="flex gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 mt-1.5"></span>
            <span>Go to the <b>Employees</b> tab and add your staff details.</span>
          </li>
          <li className="flex gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 mt-1.5"></span>
            <span>Set their salary rate (Hourly or Monthly) and department.</span>
          </li>
          <li className="flex gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 mt-1.5"></span>
            <span>For Face Attendance, go to <b>Face Register</b> and scan each employee's face.</span>
          </li>
        </ul>
      )
    },
    {
      id: 3,
      title: "Standalone Tablet Kiosk",
      icon: <MonitorSmartphone size={28} />,
      color: "from-orange-500 to-amber-500",
      bgLight: "bg-orange-50",
      iconColor: "text-orange-600",
      content: (
        <ul className="space-y-3 mt-4 text-slate-600 text-sm font-medium">
          <li className="flex gap-3">
            <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0 mt-1.5"></span>
            <span>To set up a physical tablet on site, open the dedicated standalone terminal at <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono text-slate-800">/kiosk</code>.</span>
          </li>
          <li className="flex gap-3">
            <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0 mt-1.5"></span>
            <span>Enter company admin credentials once to pair and lock the tablet into attendance mode.</span>
          </li>
          <li className="flex gap-3">
            <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0 mt-1.5"></span>
            <span>Workers mark punches safely with zero access to admin account, payroll, or settings.</span>
          </li>
        </ul>
      )
    },
    {
      id: 4,
      title: "Manage Leaves & Holidays",
      icon: <CalendarDays size={28} />,
      color: "from-fuchsia-500 to-pink-500",
      bgLight: "bg-fuchsia-50",
      iconColor: "text-fuchsia-600",
      content: (
        <ul className="space-y-3 mt-4 text-slate-600 text-sm font-medium">
          <li className="flex gap-3">
            <span className="w-2 h-2 rounded-full bg-fuchsia-400 shrink-0 mt-1.5"></span>
            <span>Go to <b>Attendance {'>'} Holidays</b> and add your upcoming public holidays in advance.</span>
          </li>
          <li className="flex gap-3">
            <span className="w-2 h-2 rounded-full bg-fuchsia-400 shrink-0 mt-1.5"></span>
            <span>Employees can apply for leave directly from their own panel.</span>
          </li>
          <li className="flex gap-3">
            <span className="w-2 h-2 rounded-full bg-fuchsia-400 shrink-0 mt-1.5"></span>
            <span>Review and Approve or Reject leave requests from the <b>Leaves</b> section.</span>
          </li>
        </ul>
      )
    },
    {
      id: 5,
      title: "Review Expense Claims",
      icon: <FileText size={28} />,
      color: "from-rose-500 to-red-500",
      bgLight: "bg-rose-50",
      iconColor: "text-rose-600",
      content: (
        <ul className="space-y-3 mt-4 text-slate-600 text-sm font-medium">
          <li className="flex gap-3">
            <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0 mt-1.5"></span>
            <span>When employees incur business expenses (Travel, Food, etc.), they submit a claim.</span>
          </li>
          <li className="flex gap-3">
            <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0 mt-1.5"></span>
            <span>Go to the <b>Claims</b> tab, verify the receipt, and Approve it.</span>
          </li>
          <li className="flex gap-3">
            <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0 mt-1.5"></span>
            <span>Once approved, the reimbursement amount is automatically added to their monthly salary.</span>
          </li>
        </ul>
      )
    },
    {
      id: 6,
      title: "Generate Payroll",
      icon: <Calculator size={28} />,
      color: "from-purple-500 to-violet-500",
      bgLight: "bg-purple-50",
      iconColor: "text-purple-600",
      content: (
        <ul className="space-y-3 mt-4 text-slate-600 text-sm font-medium">
          <li className="flex gap-3">
            <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0 mt-1.5"></span>
            <span>At the end of the month, go to the <b>Payroll</b> tab.</span>
          </li>
          <li className="flex gap-3">
            <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0 mt-1.5"></span>
            <span>Click <b>"Process Cycle"</b>. The system will automatically calculate Late Deductions, Leaves, Claims, and CPF contributions (based on employee age).</span>
          </li>
          <li className="flex gap-3">
            <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0 mt-1.5"></span>
            <span>Once everything looks correct, confirm and your Pay Slips will be generated!</span>
          </li>
        </ul>
      )
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-10">
      <div className="text-center mb-5 space-y-1">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">System Guide</h1>
        <p className="text-slate-500 font-medium text-sm">A simple step-by-step guide to set up and use the Nexus HRM System.</p>
      </div>

      <div className="space-y-3">
          {[0, 2, 4].map((rowStart, rowIndex) => {
            const pair = steps.slice(rowStart, rowStart + 2);
            return (
              <React.Fragment key={rowIndex}>
                {/* Down arrow between rows */}
                {rowIndex > 0 && (
                  <div className="flex justify-center -my-1">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                      <ArrowDown size={16} className="text-slate-400" />
                    </div>
                  </div>
                )}

                {/* Row of 2 cards with arrow */}
                <div className="flex flex-col md:flex-row items-stretch gap-3">
                  {pair.map((step, i) => (
                    <React.Fragment key={step.id}>
                      {/* Horizontal arrow between cards */}
                      {i === 1 && (
                        <div className="hidden md:flex items-center -mx-1">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                            <ArrowDown size={16} className="text-slate-400 -rotate-90" />
                          </div>
                        </div>
                      )}
                      {/* Mobile down arrow between cards in same row */}
                      {i === 1 && (
                        <div className="flex md:hidden justify-center -my-1">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                            <ArrowDown size={16} className="text-slate-400" />
                          </div>
                        </div>
                      )}

                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: (rowStart + i) * 0.08 }}
                        className="flex-1"
                      >
                        <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-all group relative overflow-hidden h-full">
                          <div className={`absolute -right-10 -top-10 w-32 h-32 ${step.bgLight} rounded-full blur-[40px] opacity-50 group-hover:opacity-100 transition-opacity`}></div>
                          
                          <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-3">
                              <div className={`w-10 h-10 ${step.bgLight} rounded-xl flex items-center justify-center shadow-sm shrink-0`}>
                                <div className={step.iconColor}>{step.icon}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-transparent bg-clip-text bg-gradient-to-br ${step.color} font-black text-lg`}>{step.id}.</span>
                                <h3 className="text-sm font-black text-slate-800 tracking-tight leading-tight">
                                  {step.title}
                                </h3>
                              </div>
                            </div>
                            
                            {step.content}
                          </div>
                        </div>
                      </motion.div>
                    </React.Fragment>
                  ))}
                </div>
              </React.Fragment>
            );
          })}
        </div>

      <div className="mt-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-500 font-bold text-sm rounded-full border border-slate-200">
          <ArrowDown size={16} />
          <span>Setup complete? Your system is ready to use!</span>
        </div>
      </div>
    </div>
  );
};

export default Guide;
