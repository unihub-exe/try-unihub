import React, { useEffect, useState } from "react";
import { FiBell, FiSend, FiClock } from "react-icons/fi";
import { getAdminToken } from "@/utils/getAdminToken";
import { io } from "socket.io-client";
import { API_URL } from "@/utils/config";

export default function AdminAnnouncements() {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [sendEmail, setSendEmail] = useState(true);
    const [sending, setSending] = useState(false);
    const [status, setStatus] = useState({ type: "", msg: "" });

    const fetchAnnouncements = async () => {
        try {
            const response = await fetch(`${API_URL}/admin/announcements`);
            if (response.ok) {
                const data = await response.json();
                setAnnouncements(data);
            }
        } catch (error) {
            console.error("Error fetching announcements:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnnouncements();

        const socket = io(API_URL);
        socket.on("announcement_created", () => {
             console.log("Real-time update: Announcement created");
             fetchAnnouncements();
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSending(true);
        setStatus({ type: "", msg: "" });

        const adminId = getAdminToken();

        try {
            const response = await fetch(`${API_URL}/admin/announcements`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, message, admin_id: adminId, sendEmail }),
            });

            if (response.ok) {
                setStatus({ type: "success", msg: "Announcement sent successfully!" });
                setTitle("");
                setMessage("");
                fetchAnnouncements();
            } else {
                setStatus({ type: "error", msg: "Failed to send announcement." });
            }
        } catch (error) {
            setStatus({ type: "error", msg: "Error sending announcement." });
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Create Announcement */}
            <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-[color:var(--darker-secondary-color)]/10 flex items-center justify-center text-[color:var(--darker-secondary-color)]">
                            <FiBell />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                            New Announcement
                        </h2>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[color:var(--secondary-color)] focus:ring-2 focus:ring-[color:var(--secondary-color)]/20 outline-none transition-all"
                                placeholder="Announcement Title"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Message</label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[color:var(--secondary-color)] focus:ring-2 focus:ring-[color:var(--secondary-color)]/20 outline-none transition-all h-32 resize-none"
                                placeholder="Write your message here..."
                            required
                        />
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                        <input
                            type="checkbox"
                            id="sendEmail"
                            checked={sendEmail}
                            onChange={(e) => setSendEmail(e.target.checked)}
                            className="w-4 h-4 text-[color:var(--secondary-color)] rounded border-gray-300 focus:ring-[color:var(--secondary-color)]"
                        />
                        <label htmlFor="sendEmail" className="text-sm font-medium text-gray-700 select-none cursor-pointer">
                            Also send via Email
                        </label>
                    </div>
                    <p className="text-xs text-gray-500 mb-4">
                        {sendEmail ? "Users will receive both in-app notification and email" : "Users will only receive in-app notification"}
                    </p>

                    {status.msg && (
                            <div className={`p-3 rounded-lg text-sm font-medium ${status.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                {status.msg}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={sending}
                            className="w-full py-3 bg-[color:var(--darker-secondary-color)] hover:bg-[color:var(--secondary-color)] text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {sending ? (
                                <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></div>
                            ) : (
                                <>
                                    <FiSend /> Post Announcement
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>

            {/* History */}
            <div className="lg:col-span-2 space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    <FiClock className="text-gray-400" /> Recent Announcements
                </h2>

                {loading ? (
                    <div className="text-center py-10 text-gray-500">Loading history...</div>
                ) : announcements.length === 0 ? (
                    <div className="bg-gray-50 rounded-2xl p-10 text-center text-gray-500 border border-dashed border-gray-200">
                        No announcements yet.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {announcements.map((item) => (
                            <div key={item._id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
                                    <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                                        {new Date(item.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-gray-600 whitespace-pre-wrap">{item.message}</p>
                                <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center text-xs text-gray-400">
                                    <span>Posted by: {item.createdBy}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
