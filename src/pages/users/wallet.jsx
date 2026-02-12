import UserNavBar from "@/components/UserNavBar";
import { getUserToken } from "@/utils/getUserToken";
import { API_URL } from "@/utils/config";
import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { FiCreditCard, FiArrowRight, FiTrendingUp, FiShield, FiPlus } from "react-icons/fi";
import LiquidGlass from "@/components/LiquidGlass";

export default function WalletPage() {
  const router = useRouter();
  const userIdCookie = getUserToken();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const loadUser = async () => {
    try {
      const res = await fetch(`${API_URL}/user/details`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_token: userIdCookie }),
      });
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/users/signin");
          return;
        }
        throw new Error("Failed");
      }
      const data = await res.json();
      setUser(data);
    } catch (e) {
      setMessage({ type: "error", text: "Failed to load wallet" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userIdCookie) {
      router.push("/users/signin");
      return;
    }
    loadUser();
  }, []);

  const fundWallet = async () => {
    if (!amount || Number(amount) <= 0) {
      setMessage({ type: "error", text: "Enter a valid amount" });
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch(`${API_URL}/wallet/fund/session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getUserToken()}`,
        },
        body: JSON.stringify({ amount: Number(amount), user_token: getUserToken() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMessage({ type: "error", text: data.msg || "Failed to start payment" });
        return;
      }
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setMessage({ type: "error", text: "Invalid payment session" });
      }
    } catch (e) {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    const sessionId = params.get("session_id");
    if (status === "success" && sessionId) {
      const confirmFunding = async () => {
        try {
          const res = await fetch(`${API_URL}/wallet/fund/confirm`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${getUserToken()}`,
            },
            body: JSON.stringify({ session_id: sessionId }),
          });
          if (res.ok) {
            const data = await res.json();
            setUser((u) => ({ ...(u || {}), wallet: data.wallet }));
            setAmount("");
            setMessage({ type: "success", text: "Wallet funded successfully" });
          } else {
            const data = await res.json().catch(() => ({}));
            setMessage({ type: "error", text: data.msg || "Payment verification failed" });
          }
        } catch (e) {
          setMessage({ type: "error", text: "Network error" });
        }
      };
      confirmFunding();
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 border-4 border-[color:var(--secondary-color)] border-t-transparent rounded-full animate-spin mb-4"></div>
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const available = user?.wallet?.availableBalance || 0;
  const pending = user?.wallet?.pendingBalance || 0;
  const threshold = user?.wallet?.payout?.minimumThreshold || 0;
  const payoutStatus = user?.wallet?.payout?.status || "pending";

  return (
    <div className="min-h-screen bg-gray-50 pb-32 md:pb-0 font-sans">
      <UserNavBar />
      
      <div className="flex m-auto relative z-10 pt-6 lg:pt-8">
        <div className="flex mx-auto container px-4 lg:px-6 max-w-8xl">
            <div className="flex flex-col w-full min-h-[calc(100vh-6rem)]">
                
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 mt-2">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Wallet</h1>
                        <p className="text-gray-500 mt-1 font-medium">Manage your funds and payouts</p>
                    </div>
                    <button
                        onClick={() => router.push("/users/dashboard")}
                        className="flex items-center gap-2 bg-white text-gray-700 border border-gray-200 px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:bg-gray-50 transition-colors"
                    >
                        Back to Dashboard <FiArrowRight />
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Card Section */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Metal Card */}
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden transform hover:scale-[1.01] transition-transform duration-500">
                            <div className="relative p-8 text-white overflow-hidden min-h-[240px] flex flex-col justify-between">
                                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black"></div>
                                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10"></div>
                                
                                <div className="relative z-10 flex justify-between items-start">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
                                            <FiCreditCard className="text-2xl" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-gray-400">Available Balance</div>
                                            <div className="text-3xl font-black tracking-tight">₦{available.toLocaleString()}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">UNIHUB</div>
                                        <div className="px-2 py-1 bg-white/10 rounded text-[10px] font-bold border border-white/10">DEBIT</div>
                                    </div>
                                </div>

                                <div className="relative z-10 mt-8">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Card Holder</div>
                                            <div className="font-bold text-lg tracking-wide">{user?.displayName || user?.username || "User"}</div>
                                        </div>
                                        <div className="text-xl font-mono opacity-50">•••• •••• •••• 4920</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
                                    <FiTrendingUp className="text-xl" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-gray-500">Pending Balance</div>
                                    <div className="text-xl font-black text-gray-900">₦{pending.toLocaleString()}</div>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                    <FiShield className="text-xl" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-gray-500">Payout Status</div>
                                    <div className="text-xl font-black text-gray-900 capitalize">{payoutStatus}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions Section */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-lg p-6 lg:p-8 h-fit sticky top-24">
                        <h3 className="text-xl font-black text-gray-900 mb-6">Fund Wallet</h3>
                        
                        {message.text && (
                            <div className={`mb-6 p-4 rounded-xl text-sm font-bold ${message.type === "error" ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
                                {message.text}
                            </div>
                        )}

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Amount (₦)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₦</span>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full pl-10 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent font-bold text-lg transition-all"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={fundWallet}
                                disabled={submitting}
                                className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-xl shadow-black/10 flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <FiPlus className="text-xl" /> Add Funds
                                    </>
                                )}
                            </button>

                            <p className="text-xs text-gray-400 text-center font-medium px-4">
                                Secure payments processed by Paystack. Funds are available immediately.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
