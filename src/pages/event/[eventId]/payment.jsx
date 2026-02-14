import NavBar from "@/components/UserNavBar";
import { getUserToken } from "@/utils/getUserToken";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { API_URL } from "@/utils/config";
import { FiCheckCircle, FiChevronRight, FiCreditCard, FiLock, FiShield, FiXCircle } from "react-icons/fi";

export default function Payment() {
    
    const router = useRouter();

    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [product, setProduct] = useState({
        name: "",
        price: "",
        description: "",
    });
    const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '' }

    const now = new Date();
    const future = new Date(now.getFullYear() + 2, now.getMonth());
    const month =
        future.getMonth() < 9
            ? `0${future.getMonth() + 1}`
            : future.getMonth() + 1;
    const year = future.getFullYear().toString().substr(-2);

    const [eventSettings, setEventSettings] = useState({});
    const [registrationCode, setRegistrationCode] = useState("");
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [currentStep, setCurrentStep] = useState('loading'); // loading, token, questions, payment

    // Get Event-Id from URL
    const event_id = router.query.eventId;
    
    useEffect(() => {
        const fetchEvent = async () => {
            try {
            const response = await fetch(
                `${API_URL}/event/getevent`,
                {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    event_id: event_id,
                }),
                }
            );
            if (response.ok) {
                const data = await response.json();
                setName(data.name);
                const queryPrice = router.query.price;
                setPrice(queryPrice !== undefined ? queryPrice : data.price);
                setEventSettings({
                    capacity: data.capacity,
                    participantsCount: data.participants ? data.participants.length : 0,
                    waitlistEnabled: data.waitlistEnabled,
                    requiresApproval: data.requiresApproval,
                    hasRegistrationToken: data.hasRegistrationToken
                });
                setQuestions(data.registrationQuestions || []);
                
                if (data.hasRegistrationToken) {
                    setCurrentStep('token');
                } else if (data.registrationQuestions && data.registrationQuestions.length > 0) {
                    setCurrentStep('questions');
                } else {
                    setCurrentStep('payment');
                }
            } else {
                throw new Error(`${response.status} ${response.statusText}`);
            }
            } catch (error) {
            console.error("Error fetching event data:", error.message);
            }
        };

        if (event_id) {
            fetchEvent();
        }
    }, [event_id, router.query.price]);

    const isFull = eventSettings.capacity && eventSettings.participantsCount >= eventSettings.capacity;
    const showWaitlist = isFull && eventSettings.waitlistEnabled;
    const showApproval = !isFull && eventSettings.requiresApproval;
    const isRequestFlow = showWaitlist || showApproval;

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 4000);
    };


    useEffect(() => {
    if (name && price !== "" && event_id) {
        const queryType = router.query.type ? decodeURIComponent(router.query.type) : "";
        setProduct({
        name: queryType ? `${name} - ${queryType}` : name,
        price: price,
        description: `Pay ₦${price} for ${queryType ? queryType : "ticket"} at ${name}`,
        });
    }
    }, [name, price, event_id, router.query.type]);

    const payWithPaystack = async () => {
        const user_id = getUserToken();
        const queryType = router.query.type ? decodeURIComponent(router.query.type) : "";
        
        try {
            // Get user email
            const userRes = await fetch(`${API_URL}/user/details`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_token: user_id }),
            });
            const userData = await userRes.json();
            
            if (!userData || !userData.email) {
                showMessage("error", "Unable to fetch user details");
                return;
            }

            // Initialize Paystack payment
            const response = await fetch(`${API_URL}/wallet/initialize`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${user_id}`
                },
                body: JSON.stringify({
                    email: userData.email,
                    amount: product.price,
                    user_token: user_id,
                    metadata: {
                        event_id,
                        ticketType: queryType,
                        answers: JSON.stringify(answers),
                        product: JSON.stringify(product)
                    }
                }),
            });

            const data = await response.json();
            
            if (data.authorizationUrl) {
                // Redirect to Paystack checkout
                window.location.href = data.authorizationUrl;
            } else {
                showMessage("error", data.msg || "Failed to initialize payment");
            }
        } catch (e) {
            console.error(e);
            showMessage("error", "Network error occurred.");
        }
    };

    const registerFree = async () => {
        const user_id = getUserToken();
        const queryType = router.query.type ? decodeURIComponent(router.query.type) : "";
        try {
            const response = await fetch(
                `${API_URL}/payment/free`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ user: { user_id }, event: { event_id }, ticketType: queryType }),
                }
            );
            const data = await response.json();
            if (data.status === "success") {
                shootConfetti();
                showMessage("success", data.msg || "Your free ticket has been issued. Check your email.");
                setTimeout(() => router.push("/users/dashboard"), 1500);
            } else if (data.status === "alreadyregistered") {
                showMessage("error", "You are already registered.");
                setTimeout(() => router.push("/users/dashboard"), 1500);
            } else if (data.status === "waitlisted") {
                showMessage("success", data.msg || "Added to waitlist.");
                setTimeout(() => router.push("/users/dashboard"), 1500);
            } else if (data.status === "pending") {
                showMessage("success", data.msg || "Registration pending approval.");
                setTimeout(() => router.push("/users/dashboard"), 1500);
            } else {
                showMessage("error", data.msg || "Registration failed");
            }
        } catch (e) {
            console.error(e);
            showMessage("error", "Network error occurred.");
        }
    };

    const payWithWallet = async () => {
        const user_id = getUserToken();
        const queryType = router.query.type ? decodeURIComponent(router.query.type) : "";
        try {
            const response = await fetch(`${API_URL}/payment`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    provider: "wallet",
                    product,
                    user: { user_id },
                    event: { event_id },
                    ticketType: queryType,
                    answers
                }),
            });
            const data = await response.json();
            if (data.status === "success") {
                shootConfetti();
                showMessage("success", "Payment Successful (Wallet). Your ticket has been issued.");
                setTimeout(() => router.push("/users/dashboard"), 1500);
            } else if (data.status === "alreadyregistered") {
                showMessage("error", "User is already registered.");
                setTimeout(() => router.push("/users/dashboard"), 1500);
            } else if (data.status === "insufficient_funds") {
                showMessage("error", "Insufficient wallet balance.");
            } else {
                showMessage("error", "Payment failed.");
            }
        } catch (e) {
            console.error(e);
            showMessage("error", "Network error occurred.");
        }
    };

    // Check for Paystack callback
    useEffect(() => {
        const reference = router.query.reference;
        if (reference && currentStep === 'payment') {
            verifyPaystackPayment(reference);
        }
    }, [router.query.reference, currentStep]);

    const verifyPaystackPayment = async (reference) => {
        const user_id = getUserToken();
        const queryType = router.query.type ? decodeURIComponent(router.query.type) : "";
        
        try {
            const response = await fetch(`${API_URL}/payment`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    provider: "paystack",
                    paystackReference: reference,
                    product,
                    user: { user_id },
                    event: { event_id },
                    ticketType: queryType,
                    answers
                }),
            });
            
            const data = await response.json();
            if (data.status === "success") {
                shootConfetti();
                showMessage("success", "Payment Successful. Your ticket has been issued.");
                setTimeout(() => router.push("/users/dashboard"), 1500);
            } else if (data.status === "alreadyregistered") {
                showMessage("error", "User is already registered.");
                setTimeout(() => router.push("/users/dashboard"), 1500);
            } else {
                showMessage("error", data.msg || "Payment verification failed.");
            }
        } catch (e) {
            console.error(e);
            showMessage("error", "Network error occurred.");
        }
    };

    const handleAnswerChange = (label, value) => {
        setAnswers(prev => ({ ...prev, [label]: value }));
    };

    const submitAnswers = () => {
        for (const q of questions) {
            if (q.required && !answers[q.label]) {
                showMessage("error", `Please answer "${q.label}"`);
                return;
            }
        }
        setCurrentStep('payment');
    };

    const submitToken = () => {
        if (!registrationCode.trim()) {
            showMessage("error", "Please enter the registration code.");
            return;
        }
        if (questions.length > 0) {
            setCurrentStep('questions');
        } else {
            setCurrentStep('payment');
        }
    };

    if (currentStep === 'loading') return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-pulse flex flex-col items-center">
                <div className="h-12 w-12 border-4 border-[color:var(--secondary-color)] border-t-transparent rounded-full animate-spin mb-4"></div>
                <div className="h-4 w-32 bg-gray-200 rounded"></div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-slate-900 pb-20">
            <Head>
                <title>Checkout - {name} | UniHub</title>
            </Head>
            <NavBar />

            {/* Toast Notification */}
            {message && (
                <div className={`fixed top-24 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl border-l-4 flex items-center gap-3 animate-fade-in-up ${message.type === 'success' ? 'bg-white border-green-500 text-green-700' : 'bg-white border-red-500 text-red-700'}`}>
                    {message.type === 'success' ? <FiCheckCircle className="text-xl" /> : <FiXCircle className="text-xl" />}
                    <span className="font-bold">{message.text}</span>
                </div>
            )}

            <div className="container mx-auto px-4 max-w-3xl pt-10 lg:pt-16">
                {/* Header */}
                <div className="mb-10 text-center animate-fade-in">
                    <h1 className="text-3xl lg:text-4xl font-black text-gray-900 mb-3 tracking-tight">
                        Complete Registration
                    </h1>
                    <p className="text-gray-500 text-lg">
                        You are registering for <span className="font-bold text-[color:var(--secondary-color)]">{name}</span>
                    </p>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/60 border border-gray-100 overflow-hidden relative animate-fade-in-up">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[color:var(--secondary-color)] to-blue-400"></div>

                    {/* Progress Stepper (Simplified) */}
                    <div className="bg-gray-50 px-8 py-4 border-b border-gray-100 flex justify-between items-center text-sm font-bold text-gray-400">
                        <div className={`flex items-center gap-2 transition-colors ${currentStep === 'token' || currentStep === 'questions' || currentStep === 'payment' ? 'text-[color:var(--secondary-color)]' : ''}`}>
                            <div className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-xs">1</div>
                            <span>Details</span>
                        </div>
                         <div className={`h-0.5 flex-1 mx-4 transition-colors ${currentStep === 'payment' ? 'bg-[color:var(--secondary-color)]' : 'bg-gray-200'}`}></div>
                        <div className={`flex items-center gap-2 transition-colors ${currentStep === 'payment' ? 'text-[color:var(--secondary-color)]' : ''}`}>
                             <div className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-xs">2</div>
                            <span>Payment</span>
                        </div>
                    </div>

                    <div className="p-8 lg:p-10">
                        {currentStep === 'loading' && (
                            <div className="flex flex-col items-center justify-center py-20">
                                <div className="w-10 h-10 border-4 border-[color:var(--secondary-color)] border-t-transparent rounded-full animate-spin mb-4"></div>
                                <p className="text-gray-500 font-medium">Loading event details...</p>
                            </div>
                        )}

                        {currentStep === 'token' && (
                            <div className="animate-fade-in space-y-6">
                                <div className="text-center mb-8">
                                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-[color:var(--secondary-color)]">
                                        <FiLock className="text-3xl" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900">Private Event</h2>
                                    <p className="text-gray-500 mt-2">Please enter the access code to continue.</p>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Registration Code</label>
                                    <input
                                        type="text"
                                        value={registrationCode}
                                        onChange={(e) => setRegistrationCode(e.target.value)}
                                        className="w-full px-5 py-3 rounded-xl border-2 border-gray-200 focus:border-[color:var(--secondary-color)] focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold text-lg text-center tracking-widest uppercase text-[color:var(--secondary-color)]"
                                        placeholder="ENTER CODE"
                                    />
                                </div>

                                <button
                                    onClick={submitToken}
                                    className="w-full py-4 bg-[color:var(--secondary-color)] text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 hover:shadow-xl hover:-translate-y-1 transition-all"
                                >
                                    Continue
                                </button>
                            </div>
                        )}

                        {currentStep === 'questions' && (
                            <div className="animate-fade-in space-y-6">
                                <div className="mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Additional Information</h2>
                                    <p className="text-gray-500">Please answer a few questions from the organizer.</p>
                                </div>

                                <div className="space-y-5">
                                    {questions.map((q, idx) => (
                                        <div key={idx} className="space-y-2">
                                            <label className="block text-sm font-bold text-gray-700">
                                                {q.label} {q.required && <span className="text-red-500">*</span>}
                                            </label>
                                            {q.type === 'text' ? (
                                                 <input
                                                    type="text"
                                                    required={q.required}
                                                    onChange={(e) => handleAnswerChange(q.label, e.target.value)}
                                                    className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:border-[color:var(--secondary-color)] focus:ring-2 focus:ring-blue-500/10 outline-none transition-all font-medium"
                                                    placeholder="Your answer"
                                                />
                                            ) : (
                                                <select
                                                    required={q.required}
                                                    onChange={(e) => handleAnswerChange(q.label, e.target.value)}
                                                    className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:border-[color:var(--secondary-color)] focus:ring-2 focus:ring-blue-500/10 outline-none transition-all bg-white font-medium"
                                                >
                                                    <option value="">Select an option</option>
                                                    {q.options.map((opt, i) => (
                                                        <option key={i} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={submitAnswers}
                                    className="w-full py-4 bg-[color:var(--secondary-color)] text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 hover:shadow-xl hover:-translate-y-1 transition-all mt-8"
                                >
                                    Continue to Payment
                                </button>
                            </div>
                        )}

                        {currentStep === 'payment' && (
                            <div className="animate-fade-in space-y-8">
                                {/* Ticket Summary */}
                                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Order Summary</h3>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-bold text-gray-900 text-lg">{product.name}</span>
                                        <span className="font-bold text-gray-900 text-lg">
                                             {Number(product.price) === 0 ? "Free" : `₦${Number(product.price).toLocaleString()}`}
                                        </span>
                                    </div>
                                    <div className="border-t border-gray-200 my-4"></div>
                                    <div className="flex justify-between items-center text-xl font-black text-gray-900">
                                        <span>Total</span>
                                        <span>{Number(product.price) === 0 ? "Free" : `₦${Number(product.price).toLocaleString()}`}</span>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                {Number(product.price) === 0 ? (
                                    <button
                                        onClick={registerFree}
                                        className="w-full py-4 bg-[color:var(--secondary-color)] text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                                    >
                                        <FiCheckCircle className="text-2xl" />
                                        {isRequestFlow ? "Request to Join" : "Confirm Registration"}
                                    </button>
                                ) : (
                                    <button 
                                        onClick={payWithPaystack}
                                        className="w-full py-4 bg-[color:var(--secondary-color)] text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                                    >
                                        <FiCreditCard className="text-2xl" />
                                        Pay ₦{Number(product.price).toLocaleString()} with Paystack
                                    </button>
                                )}
                                
                                <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
                                    <FiShield /> Secure SSL Encrypted Transaction
                                </p>
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="mt-8 text-center">
                    <button onClick={() => router.back()} className="text-gray-500 font-bold hover:text-gray-900 transition-colors text-sm">
                        Cancel and go back
                    </button>
                </div>
            </div>
        </div>
    );
}

function shootConfetti() {
    try {
        const style = document.createElement("style");
        style.textContent = "@keyframes confetti-fall{0%{transform:translateY(-100vh) rotate(0deg)}100%{transform:translateY(0) rotate(720deg)}}@keyframes confetti-fade{0%{opacity:1}100%{opacity:0}}";
        document.head.appendChild(style);
        const colors = ["#e57373","#64b5f6","#81c784","#ffd54f","#ba68c8","#4db6ac"]; 
        for (let i = 0; i < 120; i++) {
            const conf = document.createElement("div");
            conf.style.position = "fixed";
            conf.style.top = "-10px";
            conf.style.left = Math.random() * 100 + "vw";
            conf.style.width = "8px";
            conf.style.height = "14px";
            conf.style.background = colors[Math.floor(Math.random() * colors.length)];
            conf.style.transform = "translateY(-100vh)";
            conf.style.opacity = "0.9";
            conf.style.zIndex = "9999";
            conf.style.pointerEvents = "none";
            conf.style.animation = `confetti-fall ${0.8 + Math.random() * 1.2}s linear, confetti-fade 1.5s ease-out`;
            document.body.appendChild(conf);
            setTimeout(() => conf.remove(), 1500);
        }
    } catch (e) {}
}
