import { setUserToken } from "@/utils/setUserToken";
import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Cookies from "universal-cookie";
import { API_URL } from "@/utils/config";
import {
  FiMail,
  FiLock,
  FiCheck,
  FiAlertCircle,
  FiLoader,
  FiArrowRight,
  FiSmile,
  FiKey,
  FiGlobe,
  FiTrendingUp,
  FiShield,
  FiSmartphone,
  FiWifi,
  FiActivity,
  FiBarChart2,
  FiPieChart,
  FiRadio,
} from "react-icons/fi";
import BackButton from "@/components/BackButton";
import Confetti from "react-confetti";

// Custom Illustrations - X Dark Mode (Grayscale)
const WelcomeIllustration = () => (
  <div className="relative w-64 h-64 md:w-72 md:h-72 flex items-center justify-center">
    <div className="absolute inset-0 bg-white/5 rounded-full animate-pulse blur-xl"></div>
    {/* Floating Keys */}
    <div className="absolute top-0 left-10 animate-bounce delay-100">
      <FiKey className="text-3xl md:text-4xl text-gray-500 rotate-45" />
    </div>
    <div className="absolute bottom-10 right-10 animate-bounce delay-300">
      <FiKey className="text-3xl md:text-4xl text-gray-600 -rotate-45" />
    </div>

    <FiLock className="text-[6rem] md:text-9xl text-gray-200 relative z-10 drop-shadow-2xl transform transition-transform hover:scale-110 duration-500" />

    <div className="absolute -top-4 right-10 w-16 h-16 bg-gray-800 rounded-full blur-md animate-ping"></div>
    <FiShield className="absolute bottom-0 left-0 text-5xl md:text-6xl text-gray-400 animate-pulse delay-500 rotate-[-10deg]" />
    <FiSmile className="absolute top-1/2 -right-8 text-4xl md:text-5xl text-gray-600 animate-spin-slow" />
  </div>
);

const ConnectIllustration = () => (
  <div className="relative w-64 h-64 md:w-72 md:h-72 flex items-center justify-center">
    <div className="absolute inset-0 bg-gradient-to-tr from-gray-800 to-gray-900 rounded-full animate-spin-slow blur-xl"></div>
    <FiGlobe className="text-[6rem] md:text-9xl text-gray-300 relative z-10 drop-shadow-2xl animate-pulse" />

    {/* Orbiting Elements */}
    <div className="absolute inset-0 animate-spin-slow">
      <FiSmartphone className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-6 text-3xl md:text-4xl text-gray-500" />
      <FiWifi className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-6 text-3xl md:text-4xl text-gray-400" />
    </div>

    <FiRadio className="absolute top-10 right-0 text-4xl md:text-5xl text-gray-600 animate-ping delay-1000" />
    <div className="absolute bottom-10 left-4 w-4 h-4 bg-gray-200 rounded-full animate-ping"></div>
  </div>
);

const ProgressIllustration = () => (
  <div className="relative w-64 h-64 md:w-72 md:h-72 flex items-center justify-center">
    <div className="absolute inset-0 bg-white/5 rounded-xl rotate-45 animate-pulse blur-lg"></div>
    <FiTrendingUp className="text-[6rem] md:text-9xl text-gray-200 relative z-10 drop-shadow-2xl" />

    <FiBarChart2 className="absolute top-4 -left-8 text-5xl md:text-7xl text-gray-500 animate-bounce" />
    <FiPieChart className="absolute -bottom-4 right-0 text-5xl md:text-6xl text-gray-400 animate-pulse delay-200" />
    <FiActivity className="absolute top-0 right-0 text-4xl md:text-5xl text-gray-600 animate-ping delay-700" />

    <div className="absolute bottom-10 left-10 w-20 h-2 bg-gray-700 rounded-full animate-pulse"></div>
    <div className="absolute top-20 right-20 w-12 h-2 bg-gray-600 rounded-full animate-pulse delay-300"></div>
  </div>
);

export async function getServerSideProps(context) {
  const cookies = new Cookies(context.req.headers.cookie);
  const userId = cookies.get("user_token");
  if (!userId || userId === "undefined" || userId === "null") {
    return {
      props: { userIdCookie: null },
    };
  }
  return {
    props: { userIdCookie: userId },
  };
}

export default function Signin({ userIdCookie }) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState({ errorMsg: "", successMsg: "" });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Slider State
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    {
      component: <WelcomeIllustration />,
      title: "Welcome Back",
      desc: "Securely access your account and manage your university experience.",
      color: "bg-black",
      accent: "text-white",
    },
    {
      component: <ConnectIllustration />,
      title: "Stay Connected",
      desc: "Keep up with the latest events and community updates in real-time.",
      color: "bg-black",
      accent: "text-gray-200",
    },
    {
      component: <ProgressIllustration />,
      title: "Track Progress",
      desc: "Monitor your event registrations and ticket sales from your dashboard.",
      color: "bg-black",
      accent: "text-gray-300",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  useEffect(() => {
    if (
      userIdCookie &&
      userIdCookie !== "undefined" &&
      userIdCookie !== "null"
    ) {
      setStep(3);
      setTimeout(() => {
        router.push("/users/dashboard");
      }, 800);
    }
  }, [router, userIdCookie]);

  const handleVerifyEmail = async (event) => {
    event.preventDefault();
    setMessage({ errorMsg: "", successMsg: "" });

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage({
        errorMsg: "Please enter a valid email address.",
        successMsg: "",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email }),
      });

      const data = await response.json();

      if (response.status === 502) {
        setMessage({
          errorMsg: "Server Error (502). Please try again later.",
          successMsg: "",
        });
        return;
      }

      if (response.ok) {
        setMessage({
          errorMsg: "",
          successMsg: data.msg || "Verification code sent!",
        });
        setStep(2);
      } else {
        setMessage({
          errorMsg: data.msg || "Failed to sign in",
          successMsg: "",
        });
        if (data.msg?.toLowerCase().includes("not found")) {
          setTimeout(() => {
            setMessage({
              errorMsg: "Redirecting you to SignUp ...",
              successMsg: "",
            });
          }, 1500);
          setTimeout(() => {
            router.push("/users/signup");
          }, 2000);
        }
      }
    } catch (error) {
      setMessage({
        errorMsg: "Network error. Please try again.",
        successMsg: "",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage({ errorMsg: "", successMsg: "" });
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/signin/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, otp: otp }),
      });

      const data = await response.json();
      console.log("Signin response:", data);

      if (response.ok) {
        // IMPORTANT: Use user.user_token (permanent DB token), NOT accessToken (temporary JWT)
        // The accessToken is for API auth, but the cookie needs the permanent user_token
        const token = data.user?.user_token;
        
        if (!token) {
          console.error("No user_token in response:", data);
          setMessage({ 
            errorMsg: "Authentication error. Please try again.", 
            successMsg: "" 
          });
          setLoading(false);
          return;
        }
        
        console.log("Setting user token (permanent DB token):", token);
        setUserToken(token);
        
        // Verify token was set
        const cookies = new Cookies();
        const savedToken = cookies.get("user_token");
        console.log("Token saved in cookie:", savedToken);
        
        if (savedToken !== token) {
          console.error("Token mismatch! Set:", token, "Got:", savedToken);
        }
        
        setMessage({
          errorMsg: "",
          successMsg: data.msg || "Verified successfully!",
        });
        setStep(3);
        
        // Use router.push for better Next.js handling
        setTimeout(() => {
          router.push("/users/dashboard");
        }, 1500);
      } else {
        setMessage({ errorMsg: data.msg || "Invalid code", successMsg: "" });
      }
    } catch (error) {
      console.error("Signin error:", error);
      setMessage({
        errorMsg: "Something went wrong. Please try again.",
        successMsg: "",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col overflow-hidden">
      <BackButton className="lg:hidden" />
      {/* Left Side - Slider (Hidden on Mobile) */}
      <div className="hidden lg:flex w-1/2 fixed inset-y-0 left-0 bg-black items-center justify-center p-12 text-white overflow-hidden z-10">
        {/* Abstract Background */}
        <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white blur-[150px] rounded-full mix-blend-overlay animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gray-500 blur-[150px] rounded-full mix-blend-overlay animate-pulse animation-delay-2000"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-lg text-center">
          <div className="h-96 flex flex-col items-center justify-center">
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
          <div className="flex justify-center gap-3 mt-8">
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
        {/* Desktop Back Button */}
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
                  ? "Welcome Back"
                  : step === 2
                  ? "Verify Login"
                  : "Success!"}
              </h2>
              <p className="text-gray-500 text-base lg:text-lg">
                {step === 1
                  ? "Enter your email to access your account."
                  : step === 2
                  ? "We sent a code to your email."
                  : "Redirecting you..."}
              </p>
            </div>

            {message.errorMsg && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl flex items-center gap-3 text-red-700 animate-shake">
                <FiAlertCircle className="text-xl flex-shrink-0" />
                <span className="font-medium">{message.errorMsg}</span>
              </div>
            )}

            {message.successMsg && (
              <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-xl flex items-center gap-3 text-green-700 animate-fade-in">
                <FiCheck className="text-xl flex-shrink-0" />
                <span className="font-medium">{message.successMsg}</span>
              </div>
            )}

            {step === 1 && (
              <form onSubmit={handleVerifyEmail} className="space-y-6">
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
                      placeholder="you@example.com"
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
                      <span>Sending Code...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue</span>
                      <FiArrowRight />
                    </>
                  )}
                </button>

                <p className="text-center text-gray-500 font-medium mt-6">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => router.push("/users/signup")}
                    className="text-purple-600 font-bold hover:underline"
                  >
                    Create Account
                  </button>
                </p>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2 ml-1">
                    <label className="block text-sm font-bold text-gray-700">
                      Verification Code
                    </label>
                    <button
                      type="button"
                      onClick={handleVerifyEmail}
                      className="text-xs font-bold text-purple-600 hover:text-purple-700 hover:underline"
                    >
                      Resend Code
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="block w-full px-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-gray-900 placeholder-gray-300 focus:outline-none focus:bg-white focus:border-purple-600 transition-all font-mono text-xl tracking-[0.5em] text-center font-bold"
                    placeholder="000000"
                    maxLength={6}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 px-6 bg-black hover:bg-gray-800 text-white font-bold rounded-2xl shadow-xl shadow-gray-200 transform transition-all hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-gray-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3 text-lg"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </form>
            )}

            {step === 3 && (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                  <FiCheck className="text-5xl" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">
                  Verified!
                </h3>
                <p className="text-gray-500">Redirecting you...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
