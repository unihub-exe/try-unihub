import FeaturesBento from "@/components/Landing_Page_partials/FeaturesBento";
import Header from "@/components/Landing_Page_partials/Header";
import HeroHome from "@/components/Landing_Page_partials/HeroHome";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { io } from "socket.io-client";
import LiquidFooter from "@/components/Landing_Page_partials/LiquidFooter";
import LiquidGlass from "@/components/LiquidGlass";
import { FiStar } from "react-icons/fi";
import { API_URL } from "@/utils/config";

function LandingPage() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [testimonials, setTestimonials] = useState([]);

  const [stats, setStats] = useState({
    events: "0",
    users: "0",
    tickets: "0",
  });

  useEffect(() => {
    // Set target date to Jan 21, 2026
    const targetDate = new Date("2026-01-21T00:00:00").getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // run the server when a user enters the site
  const fetchAllEvents = async () => {
    const base = API_URL;
    if (!base) return; // skip in preview when API URL is not set
    try {
      const response = await fetch(`${base}/event/getallevents`);
      const statsRes = await fetch(`${base}/admin/stats`);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats({
          events: data.events !== undefined ? data.events.toString() : "0",
          users: data.users !== undefined ? data.users.toString() : "0",
          tickets: data.tickets !== undefined ? data.tickets.toString() : "0",
        });
      }

      const testRes = await fetch(`${base}/admin/testimonials`);
      if (testRes.ok) {
        const data = await testRes.json();
        setTestimonials(data);
      }

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }
    } catch (e) {
      // swallow errors during preview when API is not available
    }
  };

  useEffect(() => {
    fetchAllEvents();

    // Socket connection disabled during build
    if (typeof window === 'undefined' || process.env.NODE_ENV === 'production') return;

    let socket;
    try {
      socket = io(API_URL, {
        transports: ["websocket", "polling"],
        withCredentials: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 3,
      });

      const handleUpdate = () => {
        fetchAllEvents();
      };

      socket.on("participant_updated", handleUpdate);
      socket.on("event_created", handleUpdate);

      socket.on("connect_error", (error) => {
        console.log("Socket connection error:", error.message);
      });

      return () => {
        if (socket) {
          socket.off("participant_updated", handleUpdate);
          socket.off("event_created", handleUpdate);
          socket.disconnect();
        }
      };
    } catch (error) {
      console.log("Socket initialization error:", error.message);
    }
  }, []);

  return (
    <div className="overflow-x-hidden">
      <div className="flex flex-col min-h-screen overflow-x-hidden ">
        <Header className="overflow-x-hidden" />

        <main className="grow">
          <HeroHome />

          {/* Trusted By Section - Minimalist */}
          <section
            id="trusted"
            className="max-w-6xl mx-auto px-4 sm:px-6 py-12 border-b border-gray-100"
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 opacity-60 hover:opacity-100 transition-opacity duration-500">
              <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                Trusted by students at
              </div>
              <div className="flex items-center gap-12 grayscale hover:grayscale-0 transition-all">
                <Image
                  src="/img/trusted/ust.png"
                  alt="University Of Science And Technology"
                  width={40}
                  height={40}
                  className="object-contain"
                />
                <Image
                  src="/img/trusted/uniport.png"
                  alt="University of Port-Harcourt"
                  width={50}
                  height={50}
                  className="object-contain"
                />
                <Image
                  src="/img/trusted/unilag.png"
                  alt="Universoty Of Lagos"
                  width={50}
                  height={50}
                  className="object-contain"
                />
              </div>
            </div>
          </section>

          {/* New FeaturesBento (replaces old features section and zigzag) */}
          <FeaturesBento />

          {/* Stats Section - Clean Cards */}
          <section className="bg-gray-900 py-20 text-white">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-gray-800">
                <div>
                  <div className="text-5xl font-bold mb-2 text-[color:var(--secondary-color)]">
                    {stats.events}
                  </div>
                  <div className="text-gray-400 text-sm uppercase tracking-wider">
                    Active Events
                  </div>
                </div>
                <div>
                  <div className="text-5xl font-bold mb-2 text-blue-400">
                    {stats.users}
                  </div>
                  <div className="text-gray-400 text-sm uppercase tracking-wider">
                    Total Users
                  </div>
                </div>
                <div>
                  <div className="text-5xl font-bold mb-2 text-purple-400">
                    {stats.tickets}
                  </div>
                  <div className="text-gray-400 text-sm uppercase tracking-wider">
                    Tickets Issued
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section
            className="max-w-6xl mx-auto px-4 sm:px-6 py-24"
            id="countdown"
          >
            <div className="rounded-[2rem] bg-gradient-to-br from-gray-100 to-white border border-gray-200 p-12 md:p-16 text-center relative overflow-hidden shadow-sm">
              <div className="relative z-10">
                <h3 className="text-3xl font-bold text-gray-900 mb-6">
                  Launching in
                </h3>
                <div className="text-5xl md:text-8xl font-black text-gray-900 mb-8 tracking-tighter tabular-nums">
                  {timeLeft.days}d : {timeLeft.hours}h : {timeLeft.minutes}m
                </div>
                <p className="text-xl text-gray-500 max-w-2xl mx-auto">
                  Join the first wave of users and experience the future of
                  campus life.
                </p>
              </div>
            </div>
          </section>

          <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12" id="faqs">
            <h3 className="subhead-syne mb-8 text-center">
              Frequently Asked Questions
            </h3>
            <div className="space-y-4">
              {[
                {
                  q: "How do I create an event on UniHub?",
                  a: "Simply sign up or log in, go to your dashboard, and click 'Create Event'. You can customize tickets, venue, and more.",
                },
                {
                  q: "Is UniHub free to use?",
                  a: "Yes! Creating an account and browsing events is completely free. Some events may have ticket prices set by the organizer.",
                },
                {
                  q: "How can I verify my student status?",
                  a: "We use your university email address or registration number during sign-up to verify your status within the campus community.",
                },
              ].map((x, i) => (
                <details
                  key={i}
                  className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md"
                >
                  <summary className="cursor-pointer p-6 font-bold text-lg flex items-center justify-between select-none">
                    {x.q}
                    <span className="transform transition-transform group-open:rotate-180">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-indigo-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </span>
                  </summary>
                  <div className="px-6 pb-6 text-gray-600 leading-relaxed animate-fadeIn">
                    {x.a}
                  </div>
                </details>
              ))}
            </div>
          </section>

          {testimonials.length > 0 && (
            <section
              className="max-w-6xl mx-auto px-4 sm:px-6 py-12"
              id="testimonials"
            >
              <h3 className="subhead-syne mb-10 text-center">Campus Vibes</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {testimonials.map((x, i) => (
                  <div
                    key={i}
                    className="relative bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:-translate-y-1 transition-transform duration-300"
                  >
                    <div className="absolute -top-4 -right-4 bg-yellow-400 text-white p-2 rounded-full shadow-lg">
                      <FiStar className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-1 text-yellow-400 mb-4">
                      {Array.from({ length: x.r }).map((_, s) => (
                        <FiStar key={s} />
                      ))}
                    </div>
                    <p className="text-gray-700 italic mb-6 leading-relaxed">
                      "{x.q}"
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[color:var(--secondary-color)] to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                        {x.n.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{x.n}</div>
                        <div className="text-xs text-[color:var(--secondary-color)] font-medium uppercase tracking-wide">
                          {x.u}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="py-20" id="join">
            <div className="max-w-5xl mx-auto px-4 sm:px-2">
              <div className="relative rounded-3xl overflow-hidden bg-indigo-900 shadow-2xl">
                <div className="absolute inset-0">
                  <div className="absolute inset-0 bg-[url('/img/landing_page_images/features-01.png')] opacity-10 bg-cover bg-center mix-blend-overlay"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900 opacity-90"></div>
                </div>

                <div className="relative z-10 p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-10">
                  <div className="md:w-1/2 text-left">
                    <h3 className="text-3xl md:text-4xl font-extrabold text-white mb-4 heading-font leading-tight">
                      Ready to join the{" "}
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-pink-500">
                        hype?
                      </span>
                    </h3>
                    <p className="text-indigo-100 text-lg opacity-90 leading-relaxed">
                      Don't miss out on the next big campus event. Join 5,000+
                      students already using UniHub.
                    </p>
                  </div>

                  <div className="md:w-1/2 w-full">
                    <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
                      <form className="flex flex-col gap-4">
                        <input
                          type="email"
                          placeholder="university@email.edu"
                          className="w-full px-5 py-4 rounded-xl bg-white/90 border-0 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-yellow-400 transition-all font-medium"
                        />
                        <Link
                          href="/users/signup"
                          className="w-full btn bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold py-4 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all text-center uppercase tracking-wide"
                        >
                          Get Early Access
                        </Link>
                      </form>
                      <p className="text-center text-gray-400 text-xs mt-4">
                        No spam, just vibes. Unsubscribe anytime.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <LiquidFooter />
        </main>
      </div>
    </div>
  );
}

export default LandingPage;
