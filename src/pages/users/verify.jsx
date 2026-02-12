import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Header from "@/components/Landing_Page_partials/Header";
import Link from "next/link";
import { FiCheckCircle, FiAlertCircle, FiLoader } from "react-icons/fi";
import { API_URL } from "@/utils/config";

export default function VerifyEmail() {
  const router = useRouter();
  const { token } = router.query;
  const [status, setStatus] = useState("loading"); // loading, success, error
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    if (!router.isReady) return;
    
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link. Token is missing.");
      return;
    }

    const verifyToken = async () => {
      try {
        const apiUrl = API_URL;
        const res = await fetch(`${apiUrl}/user/verify-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (res.ok) {
          setStatus("success");
          setMessage(data.msg || "Email verified successfully!");
        } else {
          setStatus("error");
          setMessage(data.msg || "Verification failed. Token may be invalid or expired.");
        }
      } catch (error) {
        console.error("Verification error:", error);
        setStatus("error");
        setMessage("Something went wrong. Please try again later.");
      }
    };

    verifyToken();
  }, [router.isReady, token]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="pt-32 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex items-center justify-center min-h-[80vh]">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden p-8 text-center">
          
          <div className="flex justify-center mb-6">
            {status === "loading" && (
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
                <FiLoader className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            )}
            {status === "success" && (
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
                <FiCheckCircle className="w-8 h-8 text-green-500" />
              </div>
            )}
            {status === "error" && (
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                <FiAlertCircle className="w-8 h-8 text-red-500" />
              </div>
            )}
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {status === "loading" && "Verifying..."}
            {status === "success" && "Email Verified!"}
            {status === "error" && "Verification Failed"}
          </h2>
          
          <p className="text-gray-600 mb-8">
            {message}
          </p>

          <div className="space-y-4">
            {status === "success" && (
              <Link href="/users/signin" className="block w-full py-3 px-4 bg-[color:var(--secondary-color)] hover:bg-[color:var(--secondary-color)]/90 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                Continue to Sign In
              </Link>
            )}
            
            {status === "error" && (
              <Link href="/" className="block w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all">
                Return Home
              </Link>
            )}

            {status === "loading" && (
               <div className="h-12 w-full bg-gray-100 rounded-xl animate-pulse"></div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
