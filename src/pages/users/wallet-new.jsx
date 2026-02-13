import UserNavBar from "@/components/UserNavBar";
import { getUserToken } from "@/utils/getUserToken";
import { API_URL } from "@/utils/config";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { 
    FiCreditCard, FiArrowRight, FiTrendingUp, FiTrendingDown, FiDollarSign, 
    FiSend, FiClock, FiCheck, FiX, FiAlertCircle, FiLock, FiUnlock,
    FiPieChart, FiBarChart2, FiShoppingCart, FiDownload
} from "react-icons/fi";

const NIGERIAN_BANKS = [
    { code: "044", name: "Access Bank" },
    { code: "050", name: "EcoBank" },
    { code: "011", name: "First Bank of Nigeria" },
    { code: "214", name: "First City Monument Bank" },
    { code: "058", name: "Guaranty Trust Bank" },
    { code: "030", name: "Heritage Bank" },
    { code: "082", name: "Keystone Bank" },
    { code: "076", name: "Polaris Bank" },
    { code: "101", name: "Providus Bank" },
    { code: "221", name: "Stanbic IBTC Bank" },
    { code: "232", name: "Sterling Bank" },
    { code: "032", name: "Union Bank of Nigeria" },
    { code: "033", name: "United Bank for Africa" },
    { code: "215", name: "Unity Bank" },
    { code: "035", name: "Wema Bank" },
    { code: "057", name: "Zenith Bank" },
];

export default function WalletPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [wallet, setWallet] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [message, setMessage] = useState({ type: "", text: "" });
    const [showBankModal, setShowBankModal] = useState(false);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    
    const [bankForm, setBankForm] = useState({
        accountNumber: "",
        accountName: "",
        bankCode: "",
        bankName: ""
    });
    
    const [withdrawAmount, setWithdrawAmount] = useState("");

    const loadWalletData = async () => {
        try {
            const res = await fetch(`${API_URL}/wallet/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${getUserToken()}`
                },
                body: JSON.stringify({ user_token: getUserToken() })
            });
            
            if (!res.ok) {
                if (res.status === 401) {
                    router.push("/users/signin");
                    return;
                }
                throw new Error("Failed to load wallet");
            }
            
            const data = await res.json();
            setWallet(data.wallet);
            setTransactions(data.transactions);
            setAnalytics(data.analytics);
            
            // Load user details
            const userRes = await fetch(`${API_URL}/user/details`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_token: getUserToken() })
            });
            
            if (userRes.ok) {
                const userData = await userRes.json();
                setUser(userData);
                
                // Pre-fill bank details if they exist
                if (userData.wallet?.bankDetails) {
                    setBankForm(userData.wallet.bankDetails);
                }
            }
        } catch (error) {
            console.error("Load wallet error:", error);
            setMessage({ type: "error", text: "Failed to load wallet data" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!getUserToken()) {
            router.push("/users/signin");
            return;
        }
        loadWalletData();
    }, []);

    const handleUpdateBankDetails = async () => {
        if (!bankForm.accountNumber || !bankForm.accountName || !bankForm.bankCode) {
            setMessage({ type: "error", text: "Please fill all bank details" });
            return;
        }
        
        if (bankForm.accountNumber.length !== 10) {
            setMessage({ type: "error", text: "Account number must be 10 digits" });
            return;
        }
        
        try {
            setSubmitting(true);
            const res = await fetch(`${API_URL}/wallet/bank-details`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${getUserToken()}`
                },
                body: JSON.stringify({
                    ...bankForm,
                    user_token: getUserToken()
                })
            });
            
            const data = await res.json();
            
            if (res.ok) {
                setMessage({ type: "success", text: "Bank details updated successfully" });
                setShowBankModal(false);
                loadWalletData();
            } else {
                setMessage({ type: "error", text: data.msg || "Failed to update bank details" });
            }
        } catch (error) {
            setMessage({ type: "error", text: "Network error" });
        } finally {
            setSubmitting(false);
        }
    };

    const handleWithdraw = async () => {
        if (!withdrawAmount || Number(withdrawAmount) <= 0) {
            setMessage({ type: "error", text: "Enter a valid amount" });
            return;
        }
        
        if (Number(withdrawAmount) < 1000) {
            setMessage({ type: "error", text: "Minimum withdrawal is ₦1,000" });
            return;
        }
        
        if (Number(withdrawAmount) > (wallet?.availableBalance || 0)) {
            setMessage({ type: "error", text: "Insufficient available balance" });
            return;
        }
        
        if (!bankForm.accountNumber) {
            setMessage({ type: "error", text: "Please add your bank details first" });
            setShowWithdrawModal(false);
            setShowBankModal(true);
            return;
        }
        
        try {
            setSubmitting(true);
            const res = await fetch(`${API_URL}/wallet/payout`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${getUserToken()}`
                },
                body: JSON.stringify({
                    amount: Number(withdrawAmount),
                    user_token: getUserToken()
                })
            });
            
            const data = await res.json();
            
            if (res.ok) {
                setMessage({ type: "success", text: "Withdrawal request submitted! You'll receive payment within 48 hours." });
                setShowWithdrawModal(false);
                setWithdrawAmount("");
                loadWalletData();
            } else {
                setMessage({ type: "error", text: data.msg || "Withdrawal failed" });
            }
        } catch (error) {
            setMessage({ type: "error", text: "Network error" });
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-NG", { 
            day: "numeric", month: "short", year: "numeric"
        });
    };

    const getTransactionIcon = (type) => {
        switch (type) {
            case "ticket_sale": return <FiTrendingUp className="text-green-500" />;
            case "ticket_purchase": return <FiShoppingCart className="text-blue-500" />;
            case "withdrawal": return <FiSend className="text-orange-500" />;
            case "refund_received": return <FiCheck className="text-green-500" />;
            case "refund_sent": return <FiX className="text-red-500" />;
            case "premium_payment": return <FiCreditCard className="text-purple-500" />;
            default: return <FiDollarSign className="text-gray-500" />;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-12 w-12 border-4 border-[color:var(--secondary-color)] border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-500">Loading wallet...</p>
                </div>
            </div>
        );
    }

    const isOrganizer = user?.role === "ORGANIZER" || user?.role === "ADMIN";
    const availableBalance = wallet?.availableBalance || 0;
    const lockedBalance = wallet?.lockedBalance || 0;
    const pendingBalance = wallet?.pendingBalance || 0;
    const totalEarnings = wallet?.totalEarnings || 0;

    return (
        <>
            <Head>
                <title>Wallet - UniHub</title>
            </Head>
            
            <div className="min-h-screen bg-gray-50 pb-32 md:pb-0">
                <UserNavBar />
                
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-black text-gray-900">
                                {isOrganizer ? "Organizer Wallet" : "My Wallet"}
                            </h1>
                            <p className="text-gray-500 mt-1">
                                {isOrganizer ? "Manage earnings and withdrawals" : "Track your spending"}
                            </p>
                        </div>
                        <button
                            onClick={() => router.push("/users/dashboard")}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            <span>Dashboard</span>
                            <FiArrowRight />
                        </button>
                    </div>

                    {message.text && (
                        <div className={`mb-6 p-4 rounded-xl ${message.type === "error" ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
                            {message.text}
                        </div>
                    )}

                    {/* Organizer View */}
                    {isOrganizer ? (
                        <div className="space-y-6">
                            {/* Balance Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Available Balance */}
                                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
                                    <div className="flex items-center justify-between mb-4">
                                        <FiUnlock className="text-2xl opacity-80" />
                                        <span className="text-xs font-bold opacity-80">AVAILABLE</span>
                                    </div>
                                    <div className="text-3xl font-black mb-1">₦{availableBalance.toLocaleString()}</div>
                                    <div className="text-sm opacity-80">Ready to withdraw</div>
                                </div>

                                {/* Locked Balance */}
                                <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white shadow-lg">
                                    <div className="flex items-center justify-between mb-4">
                                        <FiLock className="text-2xl opacity-80" />
                                        <span className="text-xs font-bold opacity-80">LOCKED</span>
                                    </div>
                                    <div className="text-3xl font-black mb-1">₦{lockedBalance.toLocaleString()}</div>
                                    <div className="text-sm opacity-80">From recent events</div>
                                </div>

                                {/* Pending Balance */}
                                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
                                    <div className="flex items-center justify-between mb-4">
                                        <FiClock className="text-2xl opacity-80" />
                                        <span className="text-xs font-bold opacity-80">PENDING</span>
                                    </div>
                                    <div className="text-3xl font-black mb-1">₦{pendingBalance.toLocaleString()}</div>
                                    <div className="text-sm opacity-80">Withdrawal processing</div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <button
                                    onClick={() => setShowWithdrawModal(true)}
                                    disabled={availableBalance < 1000}
                                    className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:border-[color:var(--secondary-color)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <FiSend className="text-3xl text-[color:var(--secondary-color)] mb-3" />
                                    <div className="text-lg font-bold text-gray-900">Request Withdrawal</div>
                                    <div className="text-sm text-gray-500 mt-1">Min. ₦1,000</div>
                                </button>

                                <button
                                    onClick={() => setShowBankModal(true)}
                                    className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:border-[color:var(--secondary-color)] transition-all"
                                >
                                    <FiCreditCard className="text-3xl text-[color:var(--secondary-color)] mb-3" />
                                    <div className="text-lg font-bold text-gray-900">
                                        {bankForm.accountNumber ? "Update" : "Add"} Bank Details
                                    </div>
                                    <div className="text-sm text-gray-500 mt-1">
                                        {bankForm.accountNumber ? bankForm.bankName : "Required for withdrawals"}
                                    </div>
                                </button>
                            </div>

                            {/* Analytics */}
                            {analytics && (
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                        <FiBarChart2 className="text-[color:var(--secondary-color)]" />
                                        Last 30 Days
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <div className="text-sm text-gray-500 mb-1">Income</div>
                                            <div className="text-2xl font-bold text-green-600">₦{analytics.totalIncome.toLocaleString()}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-500 mb-1">Expenses</div>
                                            <div className="text-2xl font-bold text-red-600">₦{analytics.totalExpenses.toLocaleString()}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-500 mb-1">Tickets Sold</div>
                                            <div className="text-2xl font-bold text-gray-900">{analytics.ticketSales}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-500 mb-1">Tickets Bought</div>
                                            <div className="text-2xl font-bold text-gray-900">{analytics.ticketPurchases}</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Regular User View */
                        <div className="space-y-6">
                            {analytics && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                        <div className="flex items-center gap-3 mb-2">
                                            <FiTrendingDown className="text-2xl text-red-500" />
                                            <div className="text-sm text-gray-500">Total Spent</div>
                                        </div>
                                        <div className="text-3xl font-black text-gray-900">₦{analytics.totalExpenses.toLocaleString()}</div>
                                    </div>
                                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                        <div className="flex items-center gap-3 mb-2">
                                            <FiShoppingCart className="text-2xl text-blue-500" />
                                            <div className="text-sm text-gray-500">Tickets Purchased</div>
                                        </div>
                                        <div className="text-3xl font-black text-gray-900">{analytics.ticketPurchases}</div>
                                    </div>
                                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                        <div className="flex items-center gap-3 mb-2">
                                            <FiPieChart className="text-2xl text-purple-500" />
                                            <div className="text-sm text-gray-500">Transactions</div>
                                        </div>
                                        <div className="text-3xl font-black text-gray-900">{transactions.length}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Transactions */}
                    <div className="mt-8 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-xl font-bold mb-6">Transaction History</h3>
                        {transactions.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <FiDollarSign className="text-5xl mx-auto mb-4 opacity-20" />
                                <p>No transactions yet</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {transactions.map((t, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                                                {getTransactionIcon(t.type)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900">{t.description}</div>
                                                <div className="text-sm text-gray-500">{formatDate(t.createdAt)}</div>
                                            </div>
                                        </div>
                                        <div className={`text-lg font-bold ${t.amount > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                                            {t.amount > 0 ? '+' : ''}₦{Math.abs(t.amount).toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Bank Details Modal */}
                {showBankModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl max-w-md w-full p-6">
                            <h3 className="text-2xl font-bold mb-6">Bank Details</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Bank</label>
                                    <select
                                        value={bankForm.bankCode}
                                        onChange={(e) => {
                                            const bank = NIGERIAN_BANKS.find(b => b.code === e.target.value);
                                            setBankForm({ ...bankForm, bankCode: e.target.value, bankName: bank?.name || "" });
                                        }}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[color:var(--secondary-color)] focus:border-transparent"
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
                                        maxLength={10}
                                        value={bankForm.accountNumber}
                                        onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value.replace(/\D/g, '') })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[color:var(--secondary-color)] focus:border-transparent"
                                        placeholder="0123456789"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Account Name</label>
                                    <input
                                        type="text"
                                        value={bankForm.accountName}
                                        onChange={(e) => setBankForm({ ...bankForm, accountName: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[color:var(--secondary-color)] focus:border-transparent"
                                        placeholder="John Doe"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowBankModal(false)}
                                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdateBankDetails}
                                    disabled={submitting}
                                    className="flex-1 px-4 py-3 bg-[color:var(--secondary-color)] text-white rounded-xl hover:bg-[color:var(--darker-secondary-color)] transition-colors disabled:opacity-50"
                                >
                                    {submitting ? "Saving..." : "Save"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Withdraw Modal */}
                {showWithdrawModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl max-w-md w-full p-6">
                            <h3 className="text-2xl font-bold mb-6">Request Withdrawal</h3>
                            <div className="bg-gray-50 rounded-xl p-4 mb-6">
                                <div className="text-sm text-gray-500 mb-1">Available Balance</div>
                                <div className="text-3xl font-black text-gray-900">₦{availableBalance.toLocaleString()}</div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Amount (₦)</label>
                                    <input
                                        type="number"
                                        value={withdrawAmount}
                                        onChange={(e) => setWithdrawAmount(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[color:var(--secondary-color)] focus:border-transparent"
                                        placeholder="1000"
                                        min="1000"
                                        max={availableBalance}
                                    />
                                    <p className="text-xs text-gray-500 mt-2">Minimum: ₦1,000 | Processing time: Up to 48 hours</p>
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowWithdrawModal(false)}
                                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleWithdraw}
                                    disabled={submitting}
                                    className="flex-1 px-4 py-3 bg-[color:var(--secondary-color)] text-white rounded-xl hover:bg-[color:var(--darker-secondary-color)] transition-colors disabled:opacity-50"
                                >
                                    {submitting ? "Processing..." : "Withdraw"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
