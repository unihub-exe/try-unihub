import React, { useState, useRef, useEffect } from "react";
import { FiChevronDown, FiUser, FiMail, FiLogOut, FiSettings } from "react-icons/fi";
import { useRouter } from "next/router";
import { removeAdminToken } from "@/utils/removeAdminToken";

export default function Dropdown({ adminData }) {
    const router = useRouter();
    const [showDropdown, setShowDropdown] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const dropdownRef = useRef(null);

    // function to handle dropdown toggle
    const toggleDropdown = () => {
        setShowDropdown(!showDropdown);
    };

    // function to handle logout button click
    const handleLogout = () => {
        removeAdminToken();
        window.location.href = "/";
    };

    const confirmLogout = () => {
        setShowDropdown(false);
        setShowLogoutModal(true);
    };

    // Attaches an event listener for the 'mousedown' event to detect a click outside the dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);

    return (
        <li className="mr-4 cursor-pointer relative list-none" ref={dropdownRef}>
            <button
                onClick={toggleDropdown}
                className={`flex items-center justify-center gap-2 px-4 py-2 bg-[color:var(--darker-secondary-color)] hover:bg-[color:var(--secondary-color)] text-white text-sm font-bold rounded-lg shadow-md transition-all active:scale-95 ${showDropdown ? 'ring-2 ring-blue-200' : ''}`}
            >
                <span>Admin</span>
                <FiChevronDown
                    className={`h-3 w-3 transition-transform duration-300 ${
                        showDropdown ? "transform rotate-180" : ""
                    }`}
                />
            </button>
            {showDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl overflow-hidden shadow-2xl z-50 border border-gray-100 animate-fadeIn origin-top-right">
                    <div className="bg-gray-50 p-4 border-b border-gray-100">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Signed in as</h3>
                        <p className="font-bold text-gray-900 truncate" style={{ fontFamily: 'Outfit, sans-serif' }}>{adminData.name || 'Admin User'}</p>
                    </div>
                    
                    <div className="p-2">
                        <div className="px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                <FiMail size={10} />
                                Email
                            </div>
                            <div className="text-sm text-gray-700 font-medium truncate">
                                {adminData.email || 'No email provided'}
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-2 border-t border-gray-100">
                        <button
                            onClick={() => {
                                router.push("/admin/settings");
                                setShowDropdown(false);
                            }}
                            className="flex items-center gap-2 w-full px-3 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium text-sm mb-1"
                        >
                            <FiSettings size={14} />
                            Settings
                        </button>
                        <button
                            onClick={confirmLogout}
                            className="flex items-center gap-2 w-full px-3 py-2 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium text-sm"
                        >
                            <FiLogOut size={14} />
                            Logout
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
                                Are you sure you want to logout from admin panel? You'll need to sign in again to access the dashboard.
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

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.95) translateY(-10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.2s ease-out forwards;
                }
            `}</style>
        </li>
    );
}
