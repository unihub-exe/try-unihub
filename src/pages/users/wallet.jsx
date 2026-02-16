import UserNavBar from "@/components/UserNavBar";
import { getUserToken } from "@/utils/getUserToken";
import { API_URL } from "@/utils/config";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { FiCreditCard, FiArrowRight, FiTrendingUp, FiShield, FiPlus, FiDownload, FiDollarSign, FiSend, FiClock, FiCheck, FiX, FiAlertCircle } from "react-icons/fi";

const NIGERIAN_BANKS = [
    { code: "044", name: "Access Bank" },
    { code: "050", name: "EcoBank" },
    { code: "011", name: "First Bank of Nigeria" },
    { code: "082", name: "Keystone Bank" },
    { code: "214", name: "First City Monument Bank" },
    { code: "215", name: "Unity Bank" },
    { code: "221", name: "Stanbic IBTC Bank" },
    { code: "232", name: "Sterling Bank" },
    { code: "301", name: "Jaiz Bank" },
    { code: "302", name: "Union Bank of Nigeria" },
    { code: "303", name: "United Bank for Africa" },
    { code: "305", name: "Empire Trust Bank" },
    { code: "307", name: "Equity Bank" },
    { code: "308", name: "SunTrust Bank" },
    { code: "309", name: "Guaranty Trust Bank" },
    { code: "314", name: "Heritage Bank" },
    { code: "315", name: "Genesis Bank" },
    { code: "317", name: "Anchor Savings" },
    { code: "323", name: "Alpha Morgan" },
    { code: "324", name: "Fortis Bank" },
];

export default function WalletPage() {
    const router = useRouter();
    const userIdCookie = getUserToken();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState([]);
    const [withdrawals, setWithdrawals] = useState([]);
    const [amount, setAmount] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });
    const [activeTab, setActiveTab] = useState("wallet");
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [withdrawForm, setWithdrawForm] = useState({
        amount: "",
        accountNumber: "",
        bankCode: "",
        accountName: ""
    });

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

    const loadTransactions = async () => {
        try {
            const res = await fetch(`${API_URL}/transactions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getUserToken()}`,
                },
                body: JSON.stringify({ user_token: userIdCookie }),
            });
            if (res.ok) {
                const data = await res.json();
                setTransactions(data.transactions || []);
            }
        } catch (e) {
            console.error("Failed to load transactions:", e);
        }
    };

    const loadWithdrawals = async () => {
        try {
            const res = await fetch(`${API_URL}/withdrawal/history`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getUserToken()}`,
                },
                body: JSON.stringify({ user_token: userIdCookie }),
            });
            if (res.ok) {
                const data = await res.json();
                setWithdrawals(data.withdrawals || []);
            }
        } catch (e) {
            console.error("Failed to load withdrawals:", e);
        }
    };

    useEffect(() => {
        if (!userIdCookie) {
            router.push("/users/signin");
            return;
        }
        loadUser();
        loadTransactions();
        loadWithdrawals();
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const status = params.get("status");
        const reference = params.get("reference");
        
        if (status === "success" && reference) {
            const confirmFunding = async () => {
                try {
                    const res = await fetch(`${API_URL}/wallet/verify`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${getUserToken()}`,
                        },
                        body: JSON.stringify({ reference }),
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setUser((u) => ({ ...(u || {}), wallet: data.wallet }));
                        setAmount("");
                        setMessage({ type: "success", text: "Wallet funded successfully!" });
                        loadUser();
                        loadTransactions();
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

    const fundWallet = async () => {
        if (!amount || Number(amount) <= 0) {
            setMessage({ type: "error", text: "Enter a valid amount" });
            return;
        }
        
        const minAmount = 100;
        if (Number(amount) < minAmount) {
            setMessage({ type: "error", text: `Minimum amount is ₦${minAmount}` });
            return;
        }
        
        try {
            setSubmitting(true);
            const res = await fetch(`${API_URL}/wallet/initialize`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getUserToken()}`,
                },
                body: JSON.stringify({ 
                    amount: Number(amount), 
                    user_token: getUserToken(),
                    email: user?.email 
                }),
            });
            
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setMessage({ type: "error", text: data.msg || "Failed to start payment" });
                return;
            }
            
            const data = await res.json();
            if (data.authorizationUrl) {
                window.location.href = data.authorizationUrl;
            } else {
                setMessage({ type: "error", text: "Invalid payment session" });
            }
        } catch (e) {
            setMessage({ type: "error", text: "Network error" });
        } finally {
            setSubmitting(false);
        }
    };

    const handleWithdrawal = async () => {
        if (!withdrawForm.amount || Number(withdrawForm.amount) <= 0) {
            setMessage({ type: "error", text: "Enter a valid amount" });
            return;
        }
        
        if (!withdrawForm.accountNumber || !withdrawForm.bankCode || !withdrawForm.accountName) {
            setMessage({ type: "error", text: "Please fill in all bank details" });
            return;
        }
        
        if (withdrawForm.accountNumber.length !== 10) {
            setMessage({ type: "error", text: "Account number must be 10 digits" });
            return;
        }

        const minWithdrawal = 1000;
        if (Number(withdrawForm.amount) < minWithdrawal) {
            setMessage({ type: "error", text: `Minimum withdrawal is ₦${minWithdrawal}` });
            return;
        }
        
        const available = user?.wallet?.availableBalance || 0;
        if (Number(withdrawForm.amount) > available) {
            setMessage({ type: "error", text: "Insufficient balance for withdrawal" });
            return;
        }
        
        try {
            setSubmitting(true);
            const res = await fetch(`${API_URL}/withdrawal/request`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getUserToken()}`,
                },
                body: JSON.stringify({
                    amount: Number(withdrawForm.amount),
                    accountNumber: withdrawForm.accountNumber,
                    bankCode: withdrawForm.bankCode,
                    accountName: withdrawForm.accountName,
                    user_token: getUserToken()
                }),
            });
            
            const data = await res.json();
            
            if (res.ok) {
                setMessage({ type: "success", text: "Withdrawal initiated successfully!" });
                setShowWithdrawModal(false);
                setWithdrawForm({ amount: "", accountNumber: "", bankCode: "", accountName: "" });
                loadUser();
                loadWithdrawals();
            } else {
                setMessage({ type: "error", text: data.msg || "Withdrawal failed" });
            }
        } catch (e) {
            setMessage({ type: "error", text: "Network error" });
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-NG", { 
            day: "numeric", month: "short", year: "numeric", 
            hour: "2-digit", minute: "2-digit" 
        });
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "completed": return <FiCheck className="text-green-500" />;
            case "pending": return <FiClock className="text-yellow-500" />;
            case "processing": return <FiClock className="text-blue-500" />;
            case "failed": return <FiX className="text-red-500" />;
            default: return <FiAlertCircle className="text-gray-500" />;
        }
    };

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

    const isOrganizer = user?.role === "ORGANIZER" || user?.role === "ADMIN";
    const available = user?.wallet?.availableBalance || 0;
    const pending = user?.wallet?.pendingBalance || 0;
    const totalSpent = transactions
        .filter(t => t.type === "debit")
        .reduce((sum, t) => sum + (t.amount || 0), 0);

    return (
        <>
            <Head>
                <title>Wallet - UniHub</title>
                <meta name="description" content="Manage your UniHub wallet and transactions" />
            </Head>
            
            <div className="min-h-screen bg-gray-50 pb-32 md:pb-0 font-sans">
                <UserNavBar />
                
                <div className="flex m-auto relative z-10 pt-6 lg:pt-8">
                    <div className="flex mx-auto container px-4 lg:px-6 max-w-8xl">
                        <div className="flex flex-col w-full min-h-[calc(100vh-6rem)]">
                            
                            {/* Header Section */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 mt-2">
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
                                        {isOrganizer ? "Organizer Wallet" : "Transactions"}
                                    </h1>
                                    <p className="text-gray-500 mt-1 font-medium">
                                        {isOrganizer 
                                            ? "Manage your event earnings and withdrawals" 
                                            : "View your spending and transaction history"}
                                    </p>
                                </div>
                                <button
                                    onClick={() => router.push("/users/dashboard")}
                                    className="flex items-center gap-2 bg-white text-gray-700 border border-gray-200 px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:bg-gray-50 transition-colors"
                                >
                                    Back to Dashboard <FiArrowRight />
                                </button>
                            </div>

                            {message.text && (
                                <div className={`mb-6 p-4 rounded-xl text-sm font-bold ${message.type === "error" ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
                                    {message.text}
                                </div>
                            )}

                            {/* Tabs for Organizers */}
                            {isOrganizer && (
                                <div className="flex gap-4 mb-6">
                                    <button
                                        onClick={() => setActiveTab("wallet")}
                                        className={`px-6 py-3 rounded-xl font-bold transition-colors ${activeTab === "wallet" ? "bg-[color:var(--secondary-color)] text-white" : "bg-white text-gray-700 border border-gray-200"}`}
                                    >
                                        <FiDollarSign className="inline mr-2" />
                                        Wallet
                                    </button>
                                    <button
                                        onClick={() => setActiveTab("transactions")}
                                        className={`px-6 py-3 rounded-xl font-bold transition-colors ${activeTab === "transactions" ? "bg-[color:var(--secondary-color)] text-white" : "bg-white text-gray-700 border border-gray-200"}`}
                                    >
                                        <FiTrendingUp className="inline mr-2" />
                                        Transactions
                                    </button>
                                </div>
                            )}

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Main Content */}
                                <div className="lg:col-span-2 space-y-8">
                                    
                                    {/* Organizer Wallet View */}
                                    {isOrganizer && activeTab === "wallet" ? (
                                        <>
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
                                                        <FiClock className="text-xl" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-gray-500">Pending Balance</div>
                                                        <div className="text-xl font-black text-gray-900">₦{pending.toLocaleString()}</div>
                                                    </div>
                                                </div>
                                                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center">
                                                        <FiDollarSign className="text-xl" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-gray-500">Total Earnings</div>
                                                        <div className="text-xl font-black text-gray-900">₦{available.toLocaleString()}</div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Withdrawal History */}
                                            <div className="bg-white rounded-3xl border border-gray-100 shadow-lg p-6 lg:p-8">
                                                <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                                                    <FiSend className="text-[color:var(--secondary-color)]" />
                                                    Withdrawal History
                                                </h3>
                                                
                                                {withdrawals.length === 0 ? (
                                                    <p className="text-gray-500 text-center py-8">No withdrawals yet</p>
                                                ) : (
                                                    <div className="space-y-4">
                                                        {withdrawals.slice(0, 10).map((w, i) => (
                                                            <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                                                <div className="flex items-center gap-4">
                                                                    {getStatusIcon(w.status)}
                                                                    <div>
                                                                        <div className="font-bold text-gray-900">₦{Number(w.amount).toLocaleString()}</div>
                                                                        <div className="text-sm text-gray-500">{w.accountNumber} - {w.bankCode}</div>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="text-sm font-medium capitalize">{w.status}</div>
                                                                    <div className="text-xs text-gray-500">{formatDate(w.createdAt)}</div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        /* Transactions View for All Users */
                                        <div className="bg-white rounded-3xl border border-gray-100 shadow-lg p-6 lg:p-8">
                                            <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                                                <FiTrendingUp className="text-[color:var(--secondary-color)]" />
                                                Transaction History
                                            </h3>
                                            
                                            {/* Spending Summary for Regular Users */}
                                            {!isOrganizer && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                                    <div className="bg-gray-50 p-4 rounded-xl">
                                                        <div className="text-sm font-bold text-gray-500">Total Spent</div>
                                                        <div className="text-2xl font-black text-gray-900">₦{totalSpent.toLocaleString()}</div>
                                                    </div>
                                                    <div className="bg-gray-50 p-4 rounded-xl">
                                                        <div className="text-sm font-bold text-gray-500">Total Transactions</div>
                                                        <div className="text-2xl font-black text-gray-900">{transactions.length}</div>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {transactions.length === 0 ? (
                                                <p className="text-gray-500 text-center py-8">No transactions yet</p>
                                            ) : (
                                                <div className="space-y-3">
                                                    {transactions.slice(0, 20).map((t, i) => (
                                                        <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                                            <div className="flex items-center gap-4">
                                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                                                    t.type === "credit" ? "bg-green-100 text-green-600" : 
                                                                    t.type === "debit" ? "bg-red-100 text-red-600" : 
                                                                    "bg-gray-100 text-gray-600"
                                                                }`}>
                                                                    {t.type === "credit" ? <FiPlus /> : 
                                                                     t.type === "debit" ? <FiTrendingUp /> : 
                                                                     <FiClock />}
                                                                </div>
                                                                <div>
                                                                    <div className="font-bold text-gray-900">{t.description}</div>
                                                                    <div className="text-sm text-gray-500">
                                                                        {formatDate(t.createdAt)}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className={`font-bold ${t.type === "credit" ? "text-green-600" : "text-gray-900"}`}>
                                                                    {t.type === "credit" ? "+" : "-"}₦{Number(t.amount).toLocaleString()}
                                                                </div>
                                                                <div className="text-xs text-gray-500">{formatDate(t.date)}</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Actions Section */}
                                <div className="space-y-6">
                                    {/* Withdrawal for Organizers */}
                                    {isOrganizer && (
                                        <div className="bg-white rounded-3xl border border-gray-100 shadow-lg p-6 lg:p-8">
                                            <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                                                <FiSend className="text-[color:var(--secondary-color)]" />
                                                Withdraw Funds
                                            </h3>
                                            
                                            <div className="space-y-4">
                                                <div className="bg-gray-50 p-4 rounded-xl">
                                                    <div className="text-sm font-bold text-gray-500">Available for Withdrawal</div>
                                                    <div className="text-2xl font-black text-gray-900">₦{available.toLocaleString()}</div>
                                                </div>
                                                
                                                <button
                                                    onClick={() => setShowWithdrawModal(true)}
                                                    disabled={available < 1000}
                                                    className="w-full bg-[color:var(--secondary-color)] text-white py-4 rounded-xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-xl shadow-[color:var(--secondary-color)]/10 flex items-center justify-center gap-2"
                                                >
                                                    <FiDownload className="text-xl" />
                                                    Withdraw Funds
                                                </button>
                                                
                                                <p className="text-xs text-gray-400 text-center font-medium">
                                                    Minimum withdrawal: ₦1,000. Funds are transferred to your bank account within 24-48 hours.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Withdrawal Modal */}
            {showWithdrawModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-gray-900">Withdraw Funds</h3>
                            <button 
                                onClick={() => setShowWithdrawModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-full"
                            >
                                <FiX className="text-xl" />
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Amount (₦)</label>
                                <input
                                    type="number"
                                    value={withdrawForm.amount}
                                    onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black font-bold"
                                    placeholder="Enter amount"
                                />
                                <p className="text-xs text-gray-400 mt-1">Minimum: ₦1,000</p>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Bank</label>
                                <select
                                    value={withdrawForm.bankCode}
                                    onChange={(e) => setWithdrawForm({ ...withdrawForm, bankCode: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black"
                                >
                                    <option value="">Select Bank</option>
                                    {NIGERIAN_BANKS.map(bank => (
                                        <option key={bank.code} value={bank.code}>{bank.name}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Account Number</label>
                                <input
                                    type="text"
                                    value={withdrawForm.accountNumber}
                                    onChange={(e) => setWithdrawForm({ ...withdrawForm, accountNumber: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black"
                                    placeholder="10-digit account number"
                                    maxLength={10}
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Account Name</label>
                                <input
                                    type="text"
                                    value={withdrawForm.accountName}
                                    onChange={(e) => setWithdrawForm({ ...withdrawForm, accountName: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black"
                                    placeholder="Account holder name"
                                />
                            </div>
                            
                            <button
                                onClick={handleWithdrawal}
                                disabled={submitting}
                                className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <FiSend className="text-xl" /> Withdraw ₦{Number(withdrawForm.amount).toLocaleString()}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
