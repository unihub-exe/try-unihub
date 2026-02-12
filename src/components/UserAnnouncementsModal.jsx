import React, { useEffect, useState } from "react";
import { FiBell, FiX } from "react-icons/fi";
import { API_URL } from "@/utils/config";

export default function UserAnnouncementsModal({ onClose }) {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnnouncements = async () => {
            try {
                const response = await fetch(`${API_URL}/user/announcements`);
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
        fetchAnnouncements();
    }, []);

    return (
        <div className="fixed inset-0 z-[60] flex justify-end items-start p-4 sm:p-6 lg:p-8">
            {/* Backdrop with Blur */}
            <div 
                className="absolute inset-0 bg-black/10 backdrop-blur-sm transition-opacity duration-300" 
                onClick={onClose}
            />

            {/* Dropdown Container */}
            <div className="relative mt-12 w-full max-w-sm bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh] border border-white/20 animate-slideDown origin-top-right">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white/50">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        <FiBell className="text-black" /> Notifications
                    </h3>
                    <button 
                        onClick={onClose}
                        className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-all"
                    >
                        <FiX size={14} />
                    </button>
                </div>

                <div className="overflow-y-auto p-2 space-y-2 scrollbar-hide">
                    {loading ? (
                        <div className="text-center py-8 text-gray-400 text-sm">Loading...</div>
                    ) : announcements.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 flex flex-col items-center">
                            <FiBell className="text-2xl mb-2 opacity-20" />
                            <p className="text-sm">No new notifications</p>
                        </div>
                    ) : (
                        announcements.map((item) => (
                            <div key={item._id} className="group bg-white rounded-xl p-3 hover:bg-gray-50 transition-colors cursor-default border border-transparent hover:border-gray-100">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-bold text-gray-900 text-sm leading-tight">{item.title}</h4>
                                    <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                                        {new Date(item.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                                    {item.message}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </div>
            <style jsx>{`
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-10px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .animate-slideDown {
                    animation: slideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}
