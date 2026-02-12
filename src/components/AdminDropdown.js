import React, { useState, useRef, useEffect } from "react";
import { FiChevronDown, FiUser, FiMail, FiLogOut } from "react-icons/fi";
import { useRouter } from "next/router";
import { removeAdminToken } from "@/utils/removeAdminToken";

export default function Dropdown({ adminData }) {
    const router = useRouter();
    const [showDropdown, setShowDropdown] = useState(false);
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
                            onClick={handleLogout}
                            className="flex items-center gap-2 w-full px-3 py-2 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium text-sm"
                        >
                            <FiLogOut size={14} />
                            Logout
                        </button>
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
