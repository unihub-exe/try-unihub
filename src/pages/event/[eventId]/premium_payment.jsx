import NavBar from "@/components/UserNavBar";
import { getUserToken } from "@/utils/getUserToken";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { FiStar, FiCheck, FiAlertCircle } from "react-icons/fi";
import { API_URL } from "@/utils/config";

export default function PremiumPayment() {
    const router = useRouter();
    const event_id = router.query.eventId;
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [email, setEmail] = useState("");
    const [days, setDays] = useState(7);
    const [maxDays, setMaxDays] = useState(30);
    const [pricePerDay, setPricePerDay] = useState(100);
    const [totalPrice, setTotalPrice] = useState(700);

    useEffect(() => {
        const token = getUserToken();
        if (token) {
            setUser(token);
            // Get user email for Paystack
            fetch(`${API_URL}/user/details`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_token: token }),
            })
            .then(res => res.json())
            .then(data => {
                if (data.email) setEmail(data.email);
            })
            .catch(() => {});
        }

        // Fetch premium pricing settings from public endpoint
        fetch(`${API_URL}/admin/public/settings`)
            .then(res => res.json())
            .then(data => {
                if (data.premiumPricePerDay) {
                    setPricePerDay(data.premiumPricePerDay);
                    setTotalPrice(data.premiumPricePerDay * days);
                }
            })
            .catch((err) => {
                console.error("Failed to fetch settings:", err);
                // Keep default value of 100
            });
    }, []);

    useEffect(() => {
        setTotalPrice(pricePerDay * days);
    }, [days, pricePerDay]);

    useEffect(() => {
        if (!event_id) return;

        const fetchEvent = async () => {
            try {
                const response = await fetch(`${API_URL}/event/getevent`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ event_id }),
                });
                if (response.ok) {
                    const data = await response.json();
                    setEvent(data);
                    
                    // Calculate max days based on event date
                    if (data.date) {
                        const parts = data.date.split('/');
                        if (parts.length === 3) {
                            const eventDate = new Date(parts[2], parts[1] - 1, parts[0]);
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const daysUntilEvent = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
                            const calculatedMaxDays = Math.max(1, Math.min(daysUntilEvent, 30));
                            setMaxDays(calculatedMaxDays);
                            setDays(Math.min(days, calculatedMaxDays));
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching event:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchEvent();
    }, [event_id]);

    const initializePaystackPayment = async () => {
        if (!email) {
            setError("Please sign in to continue");
            return;
        }

        setProcessing(true);
        setError("");

        try {
            // Initialize Paystack payment
            const response = await fetch(`${API_URL}/wallet/initialize`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getUserToken()}`,
                },
                body: JSON.stringify({
                    amount: totalPrice,
                    user_token: user,
                    email: email,
                    metadata: {
                        event_id: event_id,
                        purpose: "premium_upgrade",
                        days: days,
                        event_name: event.name
                    }
                }),
            });

            const data = await response.json();

            if (data.authorizationUrl) {
                // Store event_id and redirect path in sessionStorage
                sessionStorage.setItem('premium_event_id', event_id);
                sessionStorage.setItem('premium_redirect', 'dashboard');
                // Redirect to Paystack
                window.location.href = data.authorizationUrl;
            } else {
                setError(data.msg || "Failed to initialize payment");
                setProcessing(false);
            }
        } catch (error) {
            console.error("Payment error:", error);
            setError("An error occurred. Please try again.");
            setProcessing(false);
        }
    };

    // Handle return from Paystack
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const status = params.get("status");
        const reference = params.get("reference");

        if (status === "success" && reference) {
            verifyPremiumPayment(reference);
        }
    }, []);

    const verifyPremiumPayment = async (reference) => {
        setProcessing(true);
        setError("");
        setSuccess("");
        
        try {
            const response = await fetch(`${API_URL}/wallet/verify`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getUserToken()}`,
                },
                body: JSON.stringify({ reference }),
            });

            const data = await response.json();

            if (response.ok) {
                // Clear the stored event_id
                sessionStorage.removeItem('premium_event_id');
                sessionStorage.removeItem('premium_redirect');
                
                // Show success message
                setSuccess("🎉 Congratulations! Your event is now Premium and will appear in Premium Picks!");
                
                // Redirect to dashboard after 3 seconds
                setTimeout(() => {
                    router.push('/users/dashboard');
                }, 3000);
            } else {
                setError(data.msg || "Payment verification failed");
            }
        } catch (error) {
            console.error("Verification error:", error);
            setError("An error occurred during verification.");
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center">
                <div className="h-12 w-12 border-4 border-[color:var(--secondary-color)] border-t-transparent rounded-full animate-spin mb-4"></div>
                <div className="h-4 w-32 bg-gray-200 rounded"></div>
            </div>
        </div>
    );

    if (!event) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Event not found</h2>
                <button onClick={() => router.back()} className="text-[color:var(--secondary-color)] font-bold hover:underline">
                    Go Back
                </button>
            </div>
        </div>
    );

    return (
        <>
            <Head>
                <title>Upgrade to Premium - UniHub</title>
                <meta name="description" content="Upgrade your event to premium for better visibility" />
            </Head>

            <div className="min-h-screen bg-gray-50 font-sans text-slate-900 pb-20">
                <NavBar />
                <div className="max-w-4xl mx-auto pt-24 px-4 pb-12">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-600 animate-fade-in-up">
                            <FiAlertCircle />
                            <span>{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-600 animate-fade-in-up">
                            <FiCheck />
                            <span>{success}</span>
                        </div>
                    )}

                    <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/60 border border-gray-100 overflow-hidden animate-fade-in-up">
                        <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 p-10 text-white text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-full bg-white/10 opacity-20"></div>
                            <div className="relative z-10">
                                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                                    <FiStar className="text-4xl fill-current" />
                                </div>
                                <h1 className="text-4xl font-black mb-3 tracking-tight">Upgrade to Premium</h1>
                                <p className="text-lg opacity-90 font-medium max-w-xl mx-auto">
                                    Boost your event visibility, reach more attendees, and unlock exclusive features.
                                </p>
                            </div>
                        </div>

                        <div className="p-8 md:p-12">
                            <div className="grid md:grid-cols-2 gap-12 items-center">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                        Why go Premium?
                                    </h2>
                                    <ul className="space-y-4">
                                        {[
                                            "Top placement in search results",
                                            "Highlighted 'Premium' badge",
                                            "Featured on the home page",
                                            "Custom email notifications to followers",
                                            "Priority support from our team"
                                        ].map((benefit, i) => (
                                            <li key={i} className="flex items-start gap-3 text-gray-700">
                                                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0 mt-0.5">
                                                    <FiCheck size={14} />
                                                </div>
                                                <span className="font-medium">{benefit}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100 text-center relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                                    
                                    <p className="text-gray-500 font-bold uppercase tracking-wider text-xs mb-2">Premium Duration</p>
                                    
                                    {/* Days Selector */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-bold text-gray-700 mb-3">Select Number of Days</label>
                                        <input
                                            type="range"
                                            min="1"
                                            max={maxDays}
                                            value={days}
                                            onChange={(e) => setDays(parseInt(e.target.value))}
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                                        />
                                        <div className="flex justify-between text-xs text-gray-500 mt-2">
                                            <span>1 day</span>
                                            <span className="font-bold text-yellow-600 text-2xl">{days} {days === 1 ? 'day' : 'days'}</span>
                                            <span>{maxDays} days</span>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-2">
                                            Maximum {maxDays} days (until event date)
                                        </p>
                                    </div>
                                    
                                    <div className="text-6xl font-black text-gray-900 mb-8 tracking-tight">
                                        ₦{totalPrice.toLocaleString()}<span className="text-2xl text-gray-400 font-bold">.00</span>
                                    </div>
                                    <p className="text-sm text-gray-500 mb-6">₦{pricePerDay} per day × {days} {days === 1 ? 'day' : 'days'}</p>
                                    
                                    <div className="mb-8 p-4 bg-white rounded-2xl border border-gray-200 text-left shadow-sm flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-2xl">🎉</div>
                                        <div className="overflow-hidden">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Upgrading Event</p>
                                            <p className="font-bold text-gray-900 truncate text-lg leading-tight">{event.name}</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={initializePaystackPayment}
                                        disabled={processing || !email}
                                        className="w-full py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-yellow-500/30 hover:shadow-xl hover:-translate-y-1 text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {processing ? (
                                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <FiStar className="fill-current" /> Pay & Upgrade Now
                                            </>
                                        )}
                                    </button>
                                    <p className="text-xs text-gray-400 mt-4 font-medium flex items-center justify-center gap-1">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/>
                                        </svg>
                                        Secured by Paystack
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
