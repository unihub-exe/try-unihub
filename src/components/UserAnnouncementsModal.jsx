import React, { useEffect, useState } from "react";
import { FiBell, FiX, FiCheck } from "react-icons/fi";
import { API_URL } from "@/utils/config";
import { getUserToken } from "@/utils/getUserToken";
import { io } from "socket.io-client";

export default function UserAnnouncementsModal({ onClose }) {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const fetchAnnouncements = async () => {
            try {
                const userToken = getUserToken();
                const response = await fetch(`${API_URL}/notifications`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${userToken}`,
                    },
                    body: JSON.stringify({ user_token: userToken }),
                });
                if (response.ok) {
                    const data = await response.json();
                    setAnnouncements(data.notifications || []);
                    setUnreadCount(data.unreadCount || 0);
                }
            } catch (error) {
                console.error("Error fetching announcements:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAnnouncements();

        // Setup real-time socket connection
        const userToken = getUserToken();
        if (userToken) {
            const socket = io(API_URL, {
                transports: ["websocket", "polling"],
                withCredentials: true,
                auth: { token: userToken }
            });

            socket.on("new_notification", (notification) => {
                setAnnouncements(prev => [notification, ...prev]);
                setUnreadCount(prev => prev + 1);
            });

            return () => socket.disconnect();
        }
    }, []);

    const markAsRead = async (notificationId) => {
        try {
            const userToken = getUserToken();
            await fetch(`${API_URL}/notifications/${notificationId}/read`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${userToken}`,
                },
            });
            
            setAnnouncements(prev => 
                prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Error marking as read:", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const userToken = getUserToken();
            await fetch(`${API_URL}/notifications/read-all`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${userToken}`,
                },
                body: JSON.stringify({ user_token: userToken }),
            });
            
            setAnnouncements(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error("Error marking all as read:", error);
        }
    };

    const deleteNotification = async (notificationId) => {
        try {
            const userToken = getUserToken();
            await fetch(`${API_URL}/notifications/${notificationId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${userToken}`,
                },
            });
            
            setAnnouncements(prev => prev.filter(n => n._id !== notificationId));
        } catch (error) {
            console.error("Error deleting notification:", error);
        }
    };

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
                        {unreadCount > 0 && (
                            <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </h3>
                    <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-xs font-bold text-[color:var(--secondary-color)] hover:underline"
                            >
                                Mark all read
                            </button>
                        )}
                        <button 
                            onClick={onClose}
                            className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-all"
                        >
                            <FiX size={14} />
                        </button>
                    </div>
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
                            <div 
                                key={item._id} 
                                className={`group relative bg-white rounded-xl p-3 hover:bg-gray-50 transition-colors cursor-pointer border ${item.read ? 'border-transparent' : 'border-blue-100 bg-blue-50/30'}`}
                                onClick={() => !item.read && markAsRead(item._id)}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-bold text-gray-900 text-sm leading-tight flex items-center gap-2">
                                        {item.title}
                                        {!item.read && (
                                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                        )}
                                    </h4>
                                    <div className="flex items-center gap-1">
                                        <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                            {new Date(item.createdAt).toLocaleDateString()}
                                        </span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteNotification(item._id);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded text-red-500 transition-all"
                                            title="Delete"
                                        >
                                            <FiX size={12} />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                                    {item.message}
                                </p>
                                {item.link && (
                                    <a
                                        href={item.link}
                                        className="text-xs text-[color:var(--secondary-color)] hover:underline mt-2 inline-block"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        View details →
                                    </a>
                                )}
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
