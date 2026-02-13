import React, { useState } from "react";
import { FiFlag, FiX } from "react-icons/fi";
import { API_URL } from "@/utils/config";
import { getUserToken } from "@/utils/getUserToken";

export default function ReportButton({ reportType, reportedId, reportedName }) {
    const [showModal, setShowModal] = useState(false);
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!reason.trim()) {
            setMessage({ type: "error", text: "Please provide a reason" });
            return;
        }

        setSubmitting(true);
        
        try {
            const userToken = getUserToken();
            
            // Get user details for reporter name
            const userRes = await fetch(`${API_URL}/user/details`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_token: userToken }),
            });
            
            const userData = await userRes.json();
            const reporterName = userData.displayName || userData.username || "Anonymous";

            const response = await fetch(`${API_URL}/reports/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${userToken}`,
                },
                body: JSON.stringify({
                    reportType,
                    reportedId,
                    reportedName,
                    reason: reason.trim(),
                    reporterId: userToken,
                    reporterName,
                }),
            });

            if (response.ok) {
                setMessage({ type: "success", text: "Report submitted successfully. We'll review it shortly." });
                setTimeout(() => {
                    setShowModal(false);
                    setReason("");
                    setMessage(null);
                }, 2000);
            } else {
                const data = await response.json();
                setMessage({ type: "error", text: data.msg || "Failed to submit report" });
            }
        } catch (error) {
            console.error("Report error:", error);
            setMessage({ type: "error", text: "Network error occurred" });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                title="Report this content"
            >
                <FiFlag /> Report
            </button>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-fade-in-up">
                        <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white relative">
                            <button
                                onClick={() => setShowModal(false)}
                                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <FiX size={20} />
                            </button>
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                    <FiFlag size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black">Report Content</h2>
                                    <p className="text-red-100 text-sm">Help us keep UniHub safe</p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {message && (
                                <div className={`p-4 rounded-xl text-sm font-bold ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                                    {message.text}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Reporting: <span className="text-[color:var(--secondary-color)]">{reportedName}</span>
                                </label>
                                <p className="text-xs text-gray-500 mb-3">
                                    Type: {reportType.charAt(0).toUpperCase() + reportType.slice(1)}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Reason for reporting <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/10 outline-none resize-none font-medium"
                                    rows={4}
                                    placeholder="Please describe why you're reporting this content..."
                                    required
                                />
                            </div>

                            <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-600">
                                <p className="font-bold mb-1">⚠️ False reports may result in account suspension</p>
                                <p>Reports are reviewed by our moderation team. You'll be notified of the outcome.</p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={submitting}
                                >
                                    {submitting ? "Submitting..." : "Submit Report"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.2s ease-out;
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.3s ease-out;
                }
            `}</style>
        </>
    );
}
