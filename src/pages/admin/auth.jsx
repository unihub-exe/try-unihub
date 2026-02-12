import { setAdminToken } from "@/utils/setAdminToken";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { FiArrowLeft } from "react-icons/fi";
import Cookies from "universal-cookie";
import Image from "next/image";
import { API_URL } from "@/utils/config";
import BackButton from "@/components/BackButton";

export async function getServerSideProps(context) {
    const cookies = new Cookies(context.req.headers.cookie);
    const adminId = cookies.get("admin_token");
    if (!adminId) {
        return {
            props: { adminIdCookie: null },
        };
    }
    return {
        props: { adminIdCookie: adminId },
    };
}

export default function AdminAuth({ adminIdCookie }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [step, setStep] = useState(1);
    const [message, setMessage] = useState({ errorMsg: "", successMsg: "" });
    const router = useRouter();

    useEffect(() => {
        // If cookie found, Redirect to dashboard
        if (adminIdCookie) {
            setStep(2); // Skip auth steps

            setTimeout(() => {
                setMessage({
                    errorMsg: "",
                    successMsg: "Redirecting you ...",
                });
            }, 500);

            // Redirect to dashboard
            setTimeout(() => {
                router.push("/admin/dashboard");
            }, 800);
        }
    }, [router, adminIdCookie]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        const response = await fetch(
            `${API_URL}/admin/auth`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: email,
                    password: password,
                }),
            }
        );
        const data = await response.json();
        if (response.status === 200) {
            setMessage({ errorMsg: "", successMsg: data.msg });
            console.log(data);
            setStep(2); // Move to next step on the same page

            setAdminToken(data.admin_token); // set cookie when signed up
        } else {
            console.error(`Failed with status code ${response.status}`);
            setMessage({ errorMsg: data.msg, successMsg: "" });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 relative">
            <BackButton onClick={() => router.push("/")} className="!text-gray-800 !bg-white/80 !border-gray-200" />

            <div className="max-w-4xl mx-auto px-4 py-8 md:py-12 pt-24">
                <div className="text-center mb-10">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <Image src="/img/only_logo.png" alt="UniHub logo" width={40} height={40} className="drop-shadow-md" />
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">UniHub Admin</h1>
                    </div>
                    <p className="text-gray-500 font-medium">Restricted Access. Admin Authentication Required.</p>
                </div>

                {/* Steps Nav */}
                <div className="flex flex-col md:flex-row items-stretch justify-center gap-4 md:gap-0 mb-8 max-w-2xl mx-auto">
                    {/* Step 1 */}
                    <div className={`flex-1 transition-all duration-300 ${step === 1 ? 'scale-105 z-10' : 'opacity-70'}`}>
                        <div className={`h-full border rounded-xl md:rounded-r-none md:rounded-l-xl p-4 flex items-center gap-3 transition-colors ${
                            step >= 1
                                ? 'bg-[color:var(--secondary-color)] text-white border-[color:var(--secondary-color)] shadow-lg'
                                : 'bg-white text-gray-400 border-gray-200 border-dashed'
                        }`}>
                            <span className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                                step >= 1 ? 'bg-white/20' : 'bg-gray-100'
                            }`}>01</span>
                            <span className="font-semibold text-sm">Verify Credentials</span>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className={`flex-1 transition-all duration-300 ${step === 2 ? 'scale-105 z-10' : 'opacity-70'}`}>
                        <div className={`h-full border rounded-xl md:rounded-l-none md:rounded-r-xl p-4 flex items-center gap-3 transition-colors ${
                            step >= 2
                                ? 'bg-[color:var(--secondary-color)] text-white border-[color:var(--secondary-color)] shadow-lg'
                                : 'bg-white text-gray-400 border-gray-200 border-dashed'
                        }`}>
                            <span className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                                step >= 2 ? 'bg-white/20' : 'bg-gray-100'
                            }`}>02</span>
                            <span className="font-semibold text-sm">Dashboard</span>
                        </div>
                    </div>
                </div>

                {/* Messages */}
                {(message.errorMsg || message.successMsg) && (
                    <div className={`max-w-lg mx-auto mb-6 p-4 rounded-xl flex items-center justify-center text-center font-medium animate-pulse ${
                        message.errorMsg 
                        ? 'bg-red-50 text-red-600 border border-red-100' 
                        : 'bg-green-50 text-green-600 border border-green-100'
                    }`}>
                        {message.errorMsg || message.successMsg}
                    </div>
                )}

                {/* Form Content */}
                <div className="max-w-lg mx-auto">
                    <div className="bg-white rounded-3xl shadow-lg shadow-gray-200/50 p-8 border border-gray-100">
                        {step === 1 && (
                            <form onSubmit={handleSubmit} className="animate-fadeIn">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Admin Email</label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="admin@unihub.com"
                                            className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:border-[color:var(--secondary-color)] focus:ring-2 focus:ring-[color:var(--secondary-color)]/20 outline-none transition-all"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                                        <input
                                            type="password"
                                            id="password"
                                            name="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:border-[color:var(--secondary-color)] focus:ring-2 focus:ring-[color:var(--secondary-color)]/20 outline-none transition-all"
                                            required
                                        />
                                    </div>

                                    <div className="pt-2 space-y-3">
                                        <button
                                            type="submit"
                                            className="w-full py-3 bg-[color:var(--secondary-color)] hover:bg-[color:var(--darker-secondary-color)] text-white font-bold rounded-lg shadow-lg shadow-blue-900/10 transition-all hover:-translate-y-0.5"
                                        >
                                            Verify Credentials
                                        </button>
                                        
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEmail("invite.testing@gmail.com");
                                                setPassword("invite123");
                                            }}
                                            className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition-all"
                                        >
                                            Use Test Credentials
                                        </button>
                                    </div>

                                    <p className="text-center text-xs text-gray-500 mt-6">
                                        Review docs on{" "}
                                        <a
                                            href="https://github.com/Z10N-exe/unihubb"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[color:var(--secondary-color)] font-bold hover:underline"
                                        >
                                            GitHub repo
                                        </a>
                                    </p>
                                </div>
                            </form>
                        )}

                        {step === 2 && (
                            <div className="text-center animate-fadeIn py-4">
                                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Welcome Back!</h3>
                                <p className="text-gray-500 mb-6">Successfully authenticated. Accessing admin dashboard...</p>
                                <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden mb-6">
                                    <div className="h-full bg-green-500 animate-[loading_1s_ease-in-out_infinite]" style={{ width: '50%' }}></div>
                                </div>
                                <button
                                    onClick={() => router.push("/admin/dashboard")}
                                    className="text-[color:var(--secondary-color)] font-bold hover:underline"
                                >
                                    Go to Dashboard Now &rarr;
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <style jsx global>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.4s ease-out forwards;
                }
                @keyframes loading {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(200%); }
                }
            `}</style>
        </div>
    );
}
