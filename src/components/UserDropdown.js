import React, { useState, useRef, useEffect } from "react";
// Re-importing icons to fix stale cache
import Image from "next/image";
import {
  FiUser,
  FiSettings,
  FiLogOut,
  FiLayout,
  FiCalendar,
  FiChevronDown,
} from "react-icons/fi";
import { useRouter } from "next/router";
import { removeUserToken } from "@/utils/removeUserToken";

export default function Dropdown({ userData }) {
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const handleLogout = () => {
    removeUserToken();
    window.location.href = "/";
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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="flex items-center gap-2 hover:bg-gray-100 rounded-full p-1 pr-3 transition-colors border border-transparent hover:border-gray-200"
      >
        <div className="relative h-8 w-8 rounded-full overflow-hidden bg-gray-200">
          <Image
            src={userData?.avatar || "/img/assistant-avatar.png"}
            alt="Avatar"
            fill
            className="object-cover"
          />
        </div>
        <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-[100px] truncate">
          {userData?.username || "User"}
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
            <p className="font-bold text-gray-900 truncate">
              {userData?.username || "User"}
            </p>
            <p className="text-xs text-gray-500 truncate">{userData?.email}</p>
            {userData?.role && (
              <span className="mt-2 inline-block px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase text-[color:var(--primary-color)] bg-[color:var(--primary-color)]/10 rounded-full">
                {userData.role}
              </span>
            )}
          </div>

          <div className="p-2 space-y-1">
            <button
              onClick={() => router.push("/users/dashboard")}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <FiLayout className="text-gray-400" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => router.push("/users/profile")}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <FiUser className="text-gray-400" />
              <span>My Profile</span>
            </button>
            <button
              onClick={() => router.push("/users/eventform")}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <FiCalendar className="text-gray-400" />
              <span>Create Event</span>
            </button>
            <button
              onClick={() => router.push("/users/settings")}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <FiSettings className="text-gray-400" />
              <span>Settings</span>
            </button>
          </div>

          <div className="p-2 border-t border-gray-100">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <FiLogOut />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
