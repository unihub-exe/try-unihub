import Link from "next/link";
import Image from "next/image";

export default function LiquidFooter() {
  const ripples = Array.from({ length: 6 });
  const drops = Array.from({ length: 8 });

  return (
    <footer className="relative mt-20 pt-32 pb-12 overflow-hidden bg-slate-900">
      {/* Background Liquid Effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-900 to-slate-900"></div>

        {/* Animated Elements */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          {ripples.map((_, i) => (
            <span
              key={i}
              className="absolute rounded-full border border-indigo-500/30"
              style={{
                top: `${20 + i * 15}%`,
                left: `${-10 + i * 10}%`,
                width: `${300 + i * 100}px`,
                height: `${300 + i * 100}px`,
                animation: `ripple ${15 + i * 2}s ease-in-out infinite`,
                animationDelay: `${i * 2}s`,
              }}
            />
          ))}
          {drops.map((_, i) => (
            <span
              key={`d${i}`}
              className="absolute bg-indigo-400/20 blur-md rounded-full"
              style={{
                top: `${(i * 15) % 100}%`,
                right: `${(i * 12) % 40}%`,
                width: `${10 + (i % 4) * 8}px`,
                height: `${10 + (i % 4) * 8}px`,
                animation: `drop ${8 + i}s linear infinite`,
                animationDelay: `${i * 1.5}s`,
              }}
            />
          ))}
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 z-10">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          {/* Brand Column */}
          <div className="md:col-span-5 space-y-6">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="relative w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 group-hover:border-[color:var(--secondary-color)]/50 transition-colors backdrop-blur-sm">
                <Image
                  src="/img/only_logo.png"
                  alt="UniHub logo"
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </div>
              <span className="text-3xl font-extrabold text-white tracking-tight">
                UniHub
              </span>
            </Link>
            <p className="text-slate-400 text-lg leading-relaxed max-w-md">
              Revolutionizing campus life, one event at a time. Join the network
              that brings students together.
            </p>

            {/* Newsletter Mini-Form */}
            <div className="flex gap-2 max-w-sm mt-6">
              <input
                type="email"
                placeholder="Enter your email"
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-[color:var(--secondary-color)] w-full transition-colors"
              />
              <button className="bg-[color:var(--secondary-color)] hover:bg-[color:var(--secondary-color)]/90 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                Go
              </button>
            </div>
          </div>

          {/* Links Columns */}
          <div className="md:col-span-2 md:col-start-7">
            <h4 className="text-white font-bold text-lg mb-6">Discover</h4>
            <ul className="space-y-4">
              <li>
                <Link
                  href="/users/dashboard"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Events
                </Link>
              </li>
              <li>
                <Link
                  href="/#features"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="/#join"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Get Started
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-white font-bold text-lg mb-6">Account</h4>
            <ul className="space-y-4">
              <li>
                <Link
                  href="/users/signin"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
              </li>
              <li>
                <Link
                  href="/users/signup"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Sign Up
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/auth"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Admin Access
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="text-white font-bold text-lg mb-6">Resources</h4>
            <ul className="space-y-4">
              <li>
                <Link
                  href="/#faqs"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  FAQs
                </Link>
              </li>
              <li>
                <Link
                  href="/#testimonials"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  Testimonials
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-sm">
            © 2025 UniHub Inc. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a
              href="#"
              className="text-slate-400 hover:text-white transition-colors"
            >
              <span className="sr-only">Twitter</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </a>
            <a
              href="#"
              className="text-slate-400 hover:text-white transition-colors"
            >
              <span className="sr-only">GitHub</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes ripple {
          0% {
            transform: scale(1);
            opacity: 0.2;
          }
          50% {
            transform: scale(1.5);
            opacity: 0.1;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        @keyframes drop {
          0% {
            transform: translateY(-20px);
            opacity: 0;
          }
          20% {
            opacity: 0.5;
          }
          100% {
            transform: translateY(100px);
            opacity: 0;
          }
        }
      `}</style>
    </footer>
  );
}
