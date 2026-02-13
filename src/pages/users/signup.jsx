import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import Cookies from "universal-cookie";
import {
  FiMail,
  FiUser,
  FiCheck,
  FiAlertCircle,
  FiBriefcase,
  FiArrowRight,
  FiSmile,
  FiStar,
  FiCalendar,
  FiUsers,
  FiMapPin,
  FiMusic,
  FiHeart,
  FiMessageCircle,
  FiZap,
  FiAward,
  FiTrendingUp,
} from "react-icons/fi";
import { setUserToken } from "@/utils/setUserToken";
import { API_URL } from "@/utils/config";
import BackButton from "@/components/BackButton";
import Confetti from "react-confetti";

// Custom Illustrations - X Dark Mode (Grayscale)
const EventIllustration = () => (
  <div className="relative w-64 h-64 md:w-72 md:h-72 pb-4 mb:py-0 flex items-center justify-center">
    <div className="absolute inset-0 bg-white/5 rounded-full animate-pulse blur-xl"></div>
    <FiCalendar className="text-[6rem] md:text-[8rem] text-gray-200 relative z-10 drop-shadow-2xl transform rotate-[-5deg]" />
    <FiMusic className="absolute top-10 right-10 text-5xl md:text-6xl text-gray-500 animate-bounce delay-100" />
    <FiMapPin className="absolute bottom-10 left-10 text-5xl md:text-6xl text-gray-400 animate-bounce delay-700" />
    <div className="absolute top-20 left-0 w-12 h-12 bg-gray-800 rounded-full opacity-50 blur-md animate-ping"></div>
  </div>
);

const ConnectIllustration = () => (
  <div className="relative w-64 h-64 md:w-72 md:h-72 flex items-center justify-center">
    <div className="absolute inset-0 bg-white/5 rounded-full animate-pulse blur-xl"></div>
    <FiUsers className="text-[6rem] md:text-[8rem] text-gray-300 relative z-10 drop-shadow-2xl" />
    <FiMessageCircle className="absolute -top-4 -left-4 text-6xl md:text-7xl text-gray-500 animate-bounce delay-300" />
    <FiHeart className="absolute bottom-10 right-10 text-5xl md:text-6xl text-gray-600 animate-pulse delay-500" />
    <div className="absolute bottom-20 left-10 w-10 h-10 bg-gray-700 rounded-full opacity-60 animate-ping"></div>
  </div>
);

const HostIllustration = () => (
  <div className="relative w-64 h-64 md:w-72 md:h-72 flex items-center justify-center">
    <div className="absolute inset-0 bg-white/5 rounded-full animate-pulse blur-xl"></div>
    <FiStar className="text-[6rem] md:text-[8rem] text-gray-100 relative z-10 drop-shadow-2xl transform rotate-[10deg]" />
    <FiZap className="absolute top-10 left-0 text-6xl md:text-7xl text-gray-500 animate-bounce delay-200" />
    <FiTrendingUp className="absolute bottom-10 right-10 text-5xl md:text-6xl text-gray-400 animate-pulse" />
    <FiAward className="absolute -bottom-6 -left-4 text-5xl md:text-6xl text-gray-600 rotate-[-15deg]" />
  </div>
);

export async function getServerSideProps(context) {
  const cookies = new Cookies(context.req.headers.cookie);
  const userId = cookies.get("user_token");
  if (!userId) {
    return { props: { userIdCookie: null } };
  }
  return { props: { userIdCookie: userId } };
}

export default function Signup({ userIdCookie }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form States
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [isOrganization, setIsOrganization] = useState(false);

  // Feedback States
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [cooldown, setCooldown] = useState(0);

  // Onboarding Slider State
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    {
      component: <EventIllustration />,
      title: "Discover Events",
      desc: "Find the hottest parties, workshops, and meetups happening around you.",
      color: "bg-zinc-900",
      accent: "text-gray-200",
    },
    {
      component: <ConnectIllustration />,
      title: "Connect with Peers",
      desc: "Meet like-minded students and grow your network on campus.",
      color: "bg-neutral-900",
      accent: "text-gray-300",
    },
    {
      component: <HostIllustration />,
      title: "Host Your Own",
      desc: "Easily organize and manage your own events with powerful tools.",
      color: "bg-stone-900",
      accent: "text-gray-200",
    },
  ];

  // Auto-rotate slides
  useEffect(() => {
    // If user selects organization, switch to the "Host" slide (index 2)
    if (isOrganization) {
      setActiveSlide(2);
      return;
    }

    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length, isOrganization]);

  // Reactive Title for Slide 2 (Connect) based on name
  const getConnectTitle = () => {
    if (name && step === 2) return `Connect as ${name.split(" ")[0]}`;
    return "Connect with Peers";
  };

  // Update slide content dynamically
  slides[1].title = getConnectTitle();

  // Redirect if already logged in
  useEffect(() => {
    if (userIdCookie) {
      setStep(3);
      setTimeout(() => router.push("/users/dashboard"), 1500);
    }
  }, [userIdCookie, router]);

  // Cooldown timer
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleSendOtp = async (e) => {
    e?.preventDefault();
    clearMessages();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess(data.msg || "Verification code sent!");
        setStep(2);
        setCooldown(60);
      } else if (
        res.status === 400 &&
        data.msg?.includes("already registered")
      ) {
        setError(data.msg);
        setTimeout(() => {
          setError("Redirecting to login...");
          setTimeout(() => router.push("/users/signin"), 2000);
        }, 2000);
      } else {
        setError(data.msg || "Failed to send code");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndSignup = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!otp.trim()) {
      setError("Please enter the verification code.");
      return;
    }

    setLoading(true);

    const verifyPayload = {
      email,
      otp,
      name,
      isOrganization,
    };

    try {
      const res = await fetch(`${API_URL}/auth/signup/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(verifyPayload),
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess(data.msg || "Account created successfully!");
        setStep(3);
        const token = data.user?.user_token || data.accessToken;
        setUserToken(token);
        setTimeout(() => router.push("/users/dashboard"), 2500);
      } else {
        setError(data.msg || "Verification failed. Please check your code.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 lg:bg-white font-sans flex flex-col lg:flex-row">
      {step === 3 && (
        <Confetti
          numberOfPieces={200}
          recycle={false}
          colors={["#333", "#666", "#999", "#ccc"]}
        />
      )}

      {/* DESKTOP: Left Panel (Dark Mode Art) */}
      <div
        className={`hidden lg:flex w-1/2 fixed inset-y-0 left-0 transition-colors duration-1000 ${slides[activeSlide].color} items-center justify-center p-12 text-white overflow-hidden z-10`}
      >
        {/* Animated Background Patterns - Greyscale */}
        <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
          <div className="absolute inset-0 bg-[url('/img/pattern.png')] opacity-10 mix-blend-overlay grayscale"></div>
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/10 blur-3xl animate-blob"></div>
          <div className="absolute top-1/2 left-1/2 w-80 h-80 rounded-full bg-gray-500/20 blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-black/20 blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative z-10 max-w-lg text-center w-full">
          <div className="h-96 flex flex-col items-center justify-center transition-all duration-500 transform">
            <div
              key={activeSlide}
              className="animate-fade-in-up flex flex-col items-center"
            >
              <div className="mb-8 transform hover:scale-110 transition-transform duration-300">
                {slides[activeSlide].component}
              </div>
              <h1
                className={`text-5xl font-black mb-6 tracking-tight leading-tight ${slides[activeSlide].accent} drop-shadow-md`}
              >
                {slides[activeSlide].title}
              </h1>
              <p className="text-xl font-medium opacity-90 leading-relaxed max-w-sm mx-auto">
                {slides[activeSlide].desc}
              </p>
            </div>
          </div>

          {/* Slider Indicators */}
          <div className="flex justify-center gap-3 mt-8 relative z-20">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveSlide(idx)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  idx === activeSlide
                    ? "bg-white w-8"
                    : "bg-white/30 hover:bg-white/50"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="absolute bottom-8 left-12 text-sm font-medium opacity-50">
          © 2025 UniHub Inc.
        </div>
      </div>

      {/* MOBILE: Top Onboarding (Light Mode) */}
      <div className="lg:hidden w-full bg-white pt-8 pb-6 px-6 flex flex-col items-center justify-center relative z-0">
        <div className="mb-6">
          <Image
            src="/img/unihub-logo.png"
            width={80}
            height={80}
            alt="UniHub Logo"
            className="object-contain"
          />
        </div>

        {/* Mobile Text Slider */}
        <div className="text-center max-w-xs h-24">
          <div key={activeSlide} className="animate-fade-in">
            <h2 className="text-2xl font-black text-gray-900 mb-2">
              {slides[activeSlide].title}
            </h2>
            <p className="text-sm text-gray-500 font-medium leading-relaxed">
              {slides[activeSlide].desc}
            </p>
          </div>
        </div>

        {/* Mobile Indicators */}
        <div className="flex justify-center gap-2 mt-4">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveSlide(idx)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                idx === activeSlide ? "bg-black w-6" : "bg-gray-300"
              }`}
            />
          ))}
        </div>
      </div>

      {/* RIGHT PANEL / FORM CONTAINER */}
      <div className="w-full lg:w-1/2 lg:ml-auto flex flex-col relative z-10">
        {/* Desktop Back Button Position */}
        <div className="hidden lg:block absolute top-6 left-6 z-20">
          {step === 2 ? (
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-all text-sm"
            >
              <FiArrowRight className="rotate-180" /> Back
            </button>
          ) : (
            <BackButton fixed={false} className="bg-gray-100 text-gray-900 border-transparent hover:bg-gray-200 shadow-none" />
          )}
        </div>

        {/* Form Area */}
        <div className="flex-grow flex flex-col justify-start lg:justify-center p-4 sm:p-6 lg:p-24">
          <div className="w-full max-w-md mx-auto bg-white rounded-3xl p-6 lg:p-0 shadow-xl lg:shadow-none border border-gray-100 lg:border-none">
            {/* Mobile Header in Card */}
            <div className="lg:hidden mb-6 flex items-center justify-between">
              {step === 2 && (
                <button
                  onClick={() => setStep(1)}
                  className="p-2 -ml-2 text-gray-500 hover:text-black"
                >
                  <FiArrowRight className="rotate-180 text-xl" />
                </button>
              )}
              {!step === 2 && <div className="w-8"></div>}
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                {step === 1 ? "Step 1 of 2" : "Step 2 of 2"}
              </span>
            </div>

            <div className="mb-8 lg:mb-10 text-center lg:text-left">
              <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-2 lg:mb-3 tracking-tight">
                {step === 1
                  ? "Create Account"
                  : step === 2
                  ? "Finish Up"
                  : "Welcome!"}
              </h2>
              <p className="text-gray-500 text-base lg:text-lg">
                {step === 1
                  ? "Start your journey with us today."
                  : "We just need a few more details."}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl flex items-center gap-3 text-red-700 animate-shake">
                <FiAlertCircle className="text-xl flex-shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-xl flex items-center gap-3 text-green-700 animate-fade-in">
                <FiCheck className="text-xl flex-shrink-0" />
                <span className="font-medium">{success}</span>
              </div>
            )}

            {step === 1 && (
              <form onSubmit={handleSendOtp} className="space-y-6">
                <div className="group">
                  <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FiMail className="text-gray-400 text-lg group-focus-within:text-[color:var(--secondary-color)] transition-colors" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[color:var(--secondary-color)] transition-all font-medium"
                      placeholder="student@university.edu"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 px-6 bg-[color:var(--secondary-color)] hover:bg-[color:var(--darker-secondary-color)] text-white font-bold rounded-2xl shadow-xl shadow-blue-200/50 transform transition-all hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3 text-lg"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue</span>
                      <FiArrowRight />
                    </>
                  )}
                </button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleVerifyAndSignup} className="space-y-6">
                <div className="group">
                  <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FiUser className="text-gray-400 text-lg group-focus-within:text-[color:var(--secondary-color)] transition-colors" />
                    </div>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="block w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[color:var(--secondary-color)] transition-all font-medium"
                      placeholder="What should we call you?"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2 ml-1">
                    <label className="block text-sm font-bold text-gray-700">
                      Verification Code
                    </label>
                    {cooldown > 0 ? (
                      <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-md">
                        Resend in {cooldown}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="text-xs font-bold text-[color:var(--secondary-color)] hover:text-[color:var(--darker-secondary-color)] hover:underline"
                      >
                        Resend Code
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="block w-full px-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-gray-900 placeholder-gray-300 focus:outline-none focus:bg-white focus:border-[color:var(--secondary-color)] transition-all font-mono text-xl tracking-[0.5em] text-center font-bold"
                    placeholder="000000"
                    maxLength={6}
                  />
                </div>

                {/* Custom Checkbox Card */}
                <div
                  onClick={() => setIsOrganization(!isOrganization)}
                  className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                    isOrganization
                      ? "border-[color:var(--secondary-color)] bg-blue-50/50"
                      : "border-gray-100 bg-white hover:border-gray-200"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isOrganization
                          ? "bg-[color:var(--secondary-color)] border-[color:var(--secondary-color)]"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      {isOrganization && (
                        <FiCheck className="text-white text-xs" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4
                        className={`font-bold text-lg mb-1 ${
                          isOrganization
                            ? "text-[color:var(--darker-secondary-color)]"
                            : "text-gray-900"
                        }`}
                      >
                        I'm an Organizer
                      </h4>
                      <p className="text-sm text-gray-500 leading-relaxed">
                        Select this if you plan to host events, manage tickets,
                        and grow a community.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 px-6 bg-[color:var(--secondary-color)] hover:bg-[color:var(--darker-secondary-color)] text-white font-bold rounded-2xl shadow-xl shadow-blue-200/50 transform transition-all hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3 text-lg"
                >
                  {loading ? "Creating Account..." : "Complete Signup"}
                </button>
              </form>
            )}

            {step === 3 && (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                  <FiSmile className="text-5xl" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">
                  You're In!
                </h3>
                <p className="text-gray-500">
                  Redirecting you to your dashboard...
                </p>
              </div>
            )}

            <div className="mt-10 text-center">
              <p className="text-gray-500 font-medium">
                Already have an account?{" "}
                <button
                  onClick={() => router.push("/users/signin")}
                  className="text-black font-bold hover:underline"
                >
                  Sign In
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
