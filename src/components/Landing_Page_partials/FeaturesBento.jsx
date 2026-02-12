import React from "react";
import Image from "next/image";
import { FiCalendar, FiUsers, FiTrendingUp, FiShield, FiZap, FiGlobe, FiSmartphone, FiCreditCard } from "react-icons/fi";

const BentoCard = ({ title, description, icon: Icon, className = "", children }) => (
  <div className={`relative overflow-hidden bg-white rounded-[1.5rem] p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:border-gray-200 transition-all duration-300 group ${className}`}>
    <div className="relative z-10 h-full flex flex-col">
      <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-[color:var(--secondary-color)] mb-6 group-hover:scale-110 transition-transform border border-gray-100">
        <Icon className="text-2xl" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3 tracking-tight">{title}</h3>
      <p className="text-gray-500 leading-relaxed text-sm mb-6">{description}</p>
      <div className="mt-auto">
        {children}
      </div>
    </div>
  </div>
);

function FeaturesBento({ images }) {
  return (
    <section id="features" className="relative bg-gray-50/50 py-24">
       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-left max-w-3xl mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight mb-6">
                Built for <span className="text-[color:var(--secondary-color)]">Everyone.</span> <br/>
                Ready for <span className="text-purple-600">Everything.</span>
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl">
                UniHub is making it easy for students and organizers to access and benefit from a connected campus ecosystem.
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(280px,auto)]">
            {/* Card 1 - Event Management */}
            <BentoCard 
                title="Event Protocol" 
                description="Deploy events in seconds. From ticketing to check-ins, the entire lifecycle is automated."
                icon={FiCalendar}
                className="md:col-span-2 bg-white"
            >
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                     {/* Mock Event Card 1 */}
                     <div className="group/card flex flex-col p-4 bg-white rounded-[1.5rem] ring-1 ring-gray-100 shadow-sm hover:shadow-md transition-all">
                         <div className="h-24 bg-gray-100 rounded-xl mb-3 relative overflow-hidden">
                             <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10"></div>
                             <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-[10px] font-bold text-gray-900 shadow-sm">
                                 ₦2,000
                             </div>
                         </div>
                         <div className="font-bold text-gray-900 text-sm mb-1">Campus Tech Fest</div>
                         <div className="flex items-center gap-2 text-xs text-gray-500">
                             <FiCalendar className="text-[color:var(--secondary-color)]" />
                             <span>Dec 18 • Main Auditorium</span>
                         </div>
                     </div>

                     {/* Mock Event Card 2 */}
                     <div className="group/card flex flex-col p-4 bg-white rounded-[1.5rem] ring-1 ring-gray-100 shadow-sm hover:shadow-md transition-all opacity-80 sm:translate-y-4">
                         <div className="h-24 bg-gray-100 rounded-xl mb-3 relative overflow-hidden">
                              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10"></div>
                              <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-[10px] font-bold text-gray-900 shadow-sm">
                                 Free
                             </div>
                         </div>
                         <div className="font-bold text-gray-900 text-sm mb-1">Freshers Night</div>
                         <div className="flex items-center gap-2 text-xs text-gray-500">
                             <FiCalendar className="text-[color:var(--secondary-color)]" />
                             <span>Jan 24 • Sports Complex</span>
                         </div>
                     </div>
                 </div>
            </BentoCard>

            {/* Card 2 - Mobile First */}
            <BentoCard 
                title="Mobile First" 
                description="Accessible by all students regardless of device. Beautifully designed for ease and speed."
                icon={FiSmartphone}
                className="bg-gray-900 text-white overflow-hidden"
            >
               <style jsx>{`
                    .bg-gray-900 h3 { color: white !important; }
                    .bg-gray-900 p { color: #9CA3AF !important; }
                    .bg-gray-900 .bg-gray-50 { background-color: rgba(255,255,255,0.1) !important; border-color: rgba(255,255,255,0.1) !important; color: white !important; }
                `}</style>
                <div className="mt-8 flex justify-center relative">
                    {/* Phone Mockup */}
                    <div className="w-40 h-64 bg-gray-800 rounded-t-[2rem] border-[6px] border-gray-700 border-b-0 relative overflow-hidden shadow-2xl transform translate-y-2">
                         {/* Status Bar */}
                         <div className="absolute top-0 left-0 right-0 h-6 bg-gray-900 z-20 flex justify-between items-center px-4">
                             <div className="w-8 h-1 bg-gray-800 rounded-full"></div>
                         </div>
                         
                         {/* App Content */}
                         <div className="absolute inset-0 bg-white pt-8 px-3">
                             {/* Header */}
                             <div className="flex justify-between items-center mb-4">
                                 <div className="w-8 h-8 rounded-full bg-gray-100"></div>
                                 <div className="w-4 h-4 rounded-full bg-gray-100"></div>
                             </div>
                             
                             {/* Content Blocks */}
                             <div className="space-y-3">
                                 <div className="h-24 rounded-xl bg-gray-100 relative overflow-hidden">
                                     <div className="absolute inset-0 bg-gradient-to-r from-[color:var(--secondary-color)]/20 to-purple-500/20"></div>
                                 </div>
                                 <div className="h-8 w-2/3 bg-gray-100 rounded-lg"></div>
                                 <div className="grid grid-cols-2 gap-2">
                                     <div className="h-20 rounded-xl bg-gray-50"></div>
                                     <div className="h-20 rounded-xl bg-gray-50"></div>
                                 </div>
                             </div>
                             
                             {/* Floating Action Button */}
                             <div className="absolute bottom-4 right-4 w-10 h-10 bg-[color:var(--secondary-color)] rounded-full shadow-lg flex items-center justify-center text-white">
                                 <FiZap className="w-4 h-4" />
                             </div>
                         </div>
                    </div>
                </div>
            </BentoCard>

            {/* Card 3 - Communities */}
            <BentoCard 
                title="Community Governance" 
                description="Empower student leaders with tools to manage members, roles, and permissions."
                icon={FiUsers}
            >
                <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-[color:var(--secondary-color)]/30 transition-colors cursor-default">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold">JD</div>
                            <div>
                                <div className="text-xs font-bold text-gray-900">John Doe</div>
                                <div className="text-[10px] text-gray-500">President</div>
                            </div>
                        </div>
                        <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-1 rounded-full font-medium border border-purple-100">Admin</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-[color:var(--secondary-color)]/30 transition-colors cursor-default opacity-80">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">AS</div>
                            <div>
                                <div className="text-xs font-bold text-gray-900">Alice Smith</div>
                                <div className="text-[10px] text-gray-500">Event Lead</div>
                            </div>
                        </div>
                        <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium border border-blue-100">Organizer</span>
                    </div>
                </div>
            </BentoCard>

            {/* Card 4 - Analytics */}
            <BentoCard 
                title="Data & Insights" 
                description="Real-time analytics on attendance and engagement to help you grow."
                icon={FiTrendingUp}
            >
                <div className="mt-6 flex items-end justify-between gap-2 h-24 px-2">
                     <div className="w-full bg-gray-50 rounded-t-lg h-[40%] relative group">
                         <div className="absolute inset-0 bg-gray-100 rounded-t-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                     </div>
                     <div className="w-full bg-gray-100 rounded-t-lg h-[60%] relative group">
                         <div className="absolute inset-0 bg-gray-200 rounded-t-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                     </div>
                     <div className="w-full bg-[color:var(--secondary-color)]/80 rounded-t-lg h-[85%] relative group shadow-sm">
                         <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                             2.4k
                         </div>
                     </div>
                     <div className="w-full bg-gray-100 rounded-t-lg h-[50%] relative group">
                         <div className="absolute inset-0 bg-gray-200 rounded-t-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                     </div>
                     <div className="w-full bg-gray-50 rounded-t-lg h-[30%] relative group">
                         <div className="absolute inset-0 bg-gray-100 rounded-t-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                     </div>
                </div>
            </BentoCard>

            {/* Card 5 - Secure Payments */}
             <BentoCard 
                title="Secure Payments" 
                description="Integrated wallet and payment processing for seamless ticket sales."
                icon={FiCreditCard}
            >
                <div className="mt-6 relative h-28 flex items-center justify-center">
                    {/* Back Card */}
                    <div className="absolute top-0 right-8 left-8 h-24 bg-gray-100 rounded-xl border border-gray-200 transform rotate-6"></div>
                    
                    {/* Front Card */}
                    <div className="absolute top-0 right-4 left-4 h-24 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-xl p-4 flex flex-col justify-between transform -rotate-2 hover:rotate-0 transition-transform duration-300">
                         <div className="flex justify-between items-start">
                             <div className="w-8 h-5 bg-yellow-400/90 rounded-md"></div>
                             <FiZap className="text-gray-600 text-lg" />
                         </div>
                         <div className="space-y-2">
                             <div className="flex gap-2">
                                 <div className="h-1.5 w-12 bg-gray-700 rounded-full"></div>
                                 <div className="h-1.5 w-8 bg-gray-700 rounded-full"></div>
                             </div>
                             <div className="flex justify-between items-center">
                                 <div className="text-white font-mono text-xs tracking-wider">•••• 4242</div>
                                 <div className="text-[10px] text-gray-400 font-mono">12/26</div>
                             </div>
                         </div>
                    </div>
                </div>
            </BentoCard>
            
            {/* Wide Card - Global */}
             <BentoCard 
                title="The Ecosystem" 
                description="Join thousands of students building the future of campus connection."
                icon={FiGlobe}
                className="md:col-span-3 bg-gradient-to-r from-purple-50 to-blue-50 border-none"
            >
                <div className="flex flex-wrap gap-3 mt-6 justify-center md:justify-start">
                     {["Hackathons", "Workshops", "Seminars", "Parties", "Sports", "Music", "Esports", "Tech", "Arts"].map((tag, i) => (
                         <span key={i} className="px-5 py-2 rounded-full bg-white text-sm font-bold text-gray-600 shadow-sm border border-gray-100 hover:border-[color:var(--secondary-color)] transition-colors cursor-default">
                             {tag}
                         </span>
                     ))}
                </div>
            </BentoCard>
        </div>
       </div>
    </section>
  );
}

export default FeaturesBento;
