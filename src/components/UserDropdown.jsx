import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
    FiUser,
    FiSettings,
    FiLogOut,
    FiLayout,
    FiCalendar,
    FiChevronDown,
    FiX,
} from "react-icons/fi";
import { useRouter } from "next/router";
import { removeUserToken } from "@/utils/removeUserToken";

export default function Dropdown({ userData }) {
    const router = useRouter();
    const [showDropdown, setShowDropdown] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [avatarError, setAvatarError] = useState(false);
    const dropdownRef = useRef(null);

    const toggleDropdown = () => {
        setShowDropdown(!showDropdown);
    };

    const handleLogout = () => {
        removeUserToken();
        window.location.href = "/";
    };

    const confirmLogout = () => {
        setShowDropdown(false);
        setShowLogoutModal(true);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);

    // Get user avatar - prioritize userData.avatar, then fall back to initials
    const userAvatar = userData?.avatar;
    const userInitials = userData?.username
        ? userData.username.charAt(0).toUpperCase()
        : userData?.displayName?.charAt(0)?.toUpperCase() || "U";
    
    // Check if avatar URL is valid (not a local /uploads/ path)
    const isValidAvatarUrl = userAvatar && !userAvatar.includes('/uploads/') && !avatarError;
    
    // Reset avatar error when userData changes
    useEffect(() => {
        setAvatarError(false);
    }, [userData?.avatar]);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={toggleDropdown}
                className="flex items-center gap-2 hover:bg-gray-100 rounded-full p-1 pr-3 transition-colors border border-transparent hover:border-gray-200"
            >
                <div className="relative h-8 w-8 rounded-full overflow-hidden bg-[color:var(--secondary-color)]">
                    {isValidAvatarUrl ? (
                        <Image 
                            src={userAvatar} 
                            alt="Avatar" 
                            fill 
                            className="object-cover"
                            onError={() => setAvatarError(true)}
                        />
                    ) : (
                        <div className="h-full w-full flex items-center justify-center text-white font-bold text-sm">
                            {userInitials}
                        </div>
                    )}
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-[100px] truncate">
                    {userData?.username || userData?.displayName || "User"}
                </span>
                <FiChevronDown
                    className={`text-gray-400 transition-transform duration-200 ${
                        showDropdown ? "rotate-180" : ""
                    }`}
                />
            </button>

            {showDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                        <div className="flex items-center gap-3">
                            <div className="relative h-12 w-12 rounded-full overflow-hidden bg-[color:var(--secondary-color)] shrink-0">
                                {isValidAvatarUrl ? (
                                    <Image 
                                        src={userAvatar} 
                                        alt="Avatar" 
                                        fill 
                                        className="object-cover"
                                        onError={() => setAvatarError(true)}
                                    />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center text-white font-bold">
                                        {userInitials}
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="font-bold text-gray-900 truncate">
                                    {userData?.username || userData?.displayName || "User"}
                                </p>
                                <p className="text-xs text-gray-500 truncate">{userData?.email}</p>
                                {userData?.role && (
                                    <span className="mt-1.5 inline-flex items-center px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase text-[color:var(--primary-color)] bg-[color:var(--primary-color)]/10 rounded-full">
                                        {userData.role}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="p-2 space-y-1">
                        <button
                            onClick={() => {
                                setShowDropdown(false);
                                router.push("/users/dashboard");
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                            <FiLayout className="text-gray-400" />
                            <span>Dashboard</span>
                        </button>
                        <button
                            onClick={() => {
                                setShowDropdown(false);
                                router.push("/users/profile");
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                            <FiUser className="text-gray-400" />
                            <span>My Profile</span>
                        </button>
                        <button
                            onClick={() => {
                                setShowDropdown(false);
                                router.push("/users/eventform");
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                            <FiCalendar className="text-gray-400" />
                            <span>Create Event</span>
                        </button>
                        <button
                            onClick={() => {
                                setShowDropdown(false);
                                router.push("/users/settings");
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                            <FiSettings className="text-gray-400" />
                            <span>Settings</span>
                        </button>
                    </div>

                    <div className="p-2 border-t border-gray-100">
                        <button
                            onClick={confirmLogout}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <FiLogOut />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Logout Confirmation Modal */}
            {showLogoutModal && (
                <div 
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    onClick={(e) => {
                        // Close modal if clicking the backdrop
                        if (e.target === e.currentTarget) {
                            setShowLogoutModal(false);
                        }
                    }}
                >
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                                <FiLogOut className="text-3xl text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Logout</h3>
                            <p className="text-gray-500 mb-6">
                                Are you sure you want to logout? You'll need to sign in again to access your account.
                            </p>
                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => setShowLogoutModal(false)}
                                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="flex-1 px-4 py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
