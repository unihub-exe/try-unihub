import Link from "next/link";
import Image from "next/image";
import { FiArrowRight, FiSearch, FiLayers, FiShield, FiZap } from "react-icons/fi";

function HeroHome() {
  return (
    <section className="bg-white relative overflow-hidden" id="about">
      {/* Mesh Gradient Background (Reef-like) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-gradient-to-br from-purple-200/40 to-[color:var(--secondary-color)]/20 blur-[100px] rounded-full mix-blend-multiply" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-gradient-to-tr from-blue-200/40 to-purple-200/30 blur-[100px] rounded-full mix-blend-multiply" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="pt-32 pb-20 md:pt-48 md:pb-32">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
             {/* Left Column: Text */}
             <div className="text-left">
                <h1 className="text-6xl md:text-7xl font-bold text-gray-900 tracking-tight leading-[1.1] mb-8">
                   The Campus <br/>
                   <span className="text-[color:var(--secondary-color)]">Operating System.</span>
                </h1>
                
                <p className="text-xl text-gray-500 leading-relaxed mb-10 max-w-lg">
                   UniHub is the all-in-one platform for student communities. Reliable, fast, and built for the new era of campus life.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                   <Link
                      href="/users/signup"
                      tabIndex={-1}
                      aria-disabled="true"
                      className="pointer-events-none px-8 py-4 rounded-xl bg-gray-900 text-white font-bold text-lg hover:bg-black transition-all hover:-translate-y-1 flex items-center justify-center gap-2"
                   >
                      Try UniHub
                      <FiArrowRight />
                   </Link>
                </div>
                
                <div className="mt-12 flex items-center gap-8 text-gray-400 text-sm font-medium">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        System Operational
                    </div>
                </div>
             </div>

             {/* Right Column: Abstract Visual (Less AI, more Tech/Reef) */}
             <div className="relative h-[500px] w-full hidden lg:block">
                 {/* Main Card */}
                 <div className="absolute top-10 left-10 right-0 bottom-10 bg-gradient-to-br from-gray-900 to-black rounded-[2rem] shadow-2xl p-8 border border-gray-800 flex flex-col justify-between overflow-hidden group">
                     {/* Decorative Grid */}
                     <div className="absolute inset-0 bg-[url('/img/grid.svg')] opacity-10 bg-center" />
                     
                     {/* Top Bar */}
                     <div className="flex items-center justify-between mb-8 relative z-10">
                         <div className="flex items-center gap-2">
                             <div className="w-3 h-3 rounded-full bg-red-500" />
                             <div className="w-3 h-3 rounded-full bg-yellow-500" />
                             <div className="w-3 h-3 rounded-full bg-green-500" />
                         </div>
                         <div className="px-3 py-1 bg-white/10 rounded-full text-xs font-mono text-gray-300 backdrop-blur-md">
                             uni_hub_core
                         </div>
                     </div>

                     {/* Content Simulation */}
                     <div className="space-y-6 relative z-10">
                         <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors cursor-default">
                             <div className="w-12 h-12 rounded-lg bg-[color:var(--secondary-color)] flex items-center justify-center text-white">
                                 <FiLayers className="text-2xl" />
                             </div>
                             <div>
                                 <div className="text-white font-bold">Event Protocol</div>
                                 <div className="text-gray-400 text-sm">Managing 500+ active sessions</div>
                             </div>
                             <div className="ml-auto text-green-400 text-xs font-mono">ACTIVE</div>
                         </div>
                         
                         <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors cursor-default">
                             <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                                 <FiShield className="text-2xl" />
                             </div>
                             <div>
                                 <div className="text-white font-bold">Community Gov</div>
                                 <div className="text-gray-400 text-sm">Verification Logic Secure</div>
                             </div>
                             <div className="ml-auto text-green-400 text-xs font-mono">SECURE</div>
                         </div>

                          <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors cursor-default">
                             <div className="w-12 h-12 rounded-lg bg-purple-600 flex items-center justify-center text-white">
                                 <FiZap className="text-2xl" />
                             </div>
                             <div>
                                 <div className="text-white font-bold">Fast Pass</div>
                                 <div className="text-gray-400 text-sm">Ticketing Engine v2</div>
                             </div>
                             <div className="ml-auto text-green-400 text-xs font-mono">READY</div>
                         </div>
                     </div>
                 </div>
                 
                 {/* Floating Glass Element */}
                 <div className="absolute -bottom-6 -left-6 w-48 h-48 bg-gradient-to-br from-[color:var(--secondary-color)] to-purple-600 rounded-full blur-[80px] opacity-40 animate-pulse" />
             </div>
          </div>

        </div>
      </div>
    </section>
  );
}

export default HeroHome;
