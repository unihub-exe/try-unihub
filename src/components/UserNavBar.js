import UserDropdown from "@/components/UserDropdown";
import UserAnnouncementsModal from "./UserAnnouncementsModal";
import { getUserToken } from "@/utils/getUserToken";
import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { FiBell } from "react-icons/fi";
import { API_URL } from "@/utils/config";

export default function NavBar() {
  const router = useRouter();

  const userIdCookie = getUserToken();
  const [userData, setUserData] = useState({});
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userIdCookie) {
        console.log("No user token found");
        return;
      }
      try {
        const response = await fetch(`${API_URL}/user/details`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_token: userIdCookie }),
        });
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            console.error("Authentication failed, clearing token");
            import("universal-cookie").then((Cookies) => {
              const cookies = new Cookies.default();
              cookies.remove("user_token", { path: "/" });
              // Add a small delay to ensure cookie is cleared
              setTimeout(() => {
                router.push("/users/signin");
              }, 100);
            });
            return;
          }
          // Don't redirect on other errors (500, network issues, etc.)
          console.error(`API error: ${response.status}`);
          return;
        }
        const data = await response.json();
        setUserData(data);
      } catch (error) {
        console.error("Fetch user data failed:", error);
        // Don't redirect on network errors
      }
    };

    const fetchAnnouncements = async () => {
      try {
        const res = await fetch(`${API_URL}/user/announcements`);
        if (res.ok) {
          const data = await res.json();
          const lastRead = localStorage.getItem("lastReadAnnouncementTime");
          const count = data.filter(
            (a) => !lastRead || new Date(a.createdAt) > new Date(lastRead)
          ).length;
          setUnreadCount(count);
        }
      } catch (e) {}
    };

    fetchUserData();
    fetchAnnouncements();
  }, [router, userIdCookie]);

  const handleShowAnnouncements = () => {
    setShowAnnouncements(true);
    setUnreadCount(0);
    localStorage.setItem("lastReadAnnouncementTime", new Date().toISOString());
  };

  return (
    <div className="mb-[10vh]">
      <header className="fixed top-0 z-50 w-full bg-white/90 backdrop-blur-md shadow-sm">
        <div className="container mx-auto flex items-center justify-between py-3 px-4 md:px-6">
          <div
            onClick={() => router.push("/users/dashboard")}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Image
              src="/img/unihub-logo.png"
              width={120}
              height={40}
              alt="UniHub"
              className="h-10 w-auto object-contain"
            />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center text-sm gap-6">
            <button
              onClick={() => router.push("/users/dashboard")}
              className={`font-medium transition-colors ${
                router.pathname.includes("/dashboard")
                  ? "text-[color:var(--secondary-color)]"
                  : "text-gray-600 hover:text-[color:var(--secondary-color)]"
              }`}
            >
              Dashboard
            </button>
            <button
            onClick={() => router.push("/users/community")}
            className={`font-medium transition-colors ${
              router.pathname.includes("/community")
                ? "text-[color:var(--secondary-color)]"
                : "text-gray-600 hover:text-[color:var(--secondary-color)]"
            }`}
          >
            Communities
          </button>
          <button
            onClick={() => router.push("/users/event-library")}
            className={`font-medium transition-colors ${
              router.pathname.includes("/event-library")
                ? "text-[color:var(--secondary-color)]"
                : "text-gray-600 hover:text-[color:var(--secondary-color)]"
            }`}
          >
            Library
          </button>
          <button
            onClick={() => router.push("/users/wallet")}
              className={`font-medium transition-colors ${
                router.pathname.includes("/wallet")
                  ? "text-[color:var(--secondary-color)]"
                  : "text-gray-600 hover:text-[color:var(--secondary-color)]"
              }`}
            >
              Wallet
            </button>
            <button
              onClick={handleShowAnnouncements}
              className="text-gray-600 hover:text-[color:var(--secondary-color)] transition-colors relative"
            >
              <FiBell className="text-xl" />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {unreadCount}
                </span>
              )}
            </button>
            <UserDropdown userData={userData || {}} />
          </nav>

          {/* Mobile Navigation */}
          <div className="flex items-center gap-4 md:hidden">
            <button
              onClick={handleShowAnnouncements}
              className="text-gray-600 hover:text-[color:var(--secondary-color)] transition-colors relative"
            >
              <FiBell className="text-xl" />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {unreadCount}
                </span>
              )}
            </button>
            <UserDropdown userData={userData || {}} />
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar - Floating & Modern */}
      <div className="md:hidden fixed bottom-6 left-4 right-4 bg-white/90 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl z-50 px-2 py-3 flex justify-around items-center ring-1 ring-black/5">
        <button
          onClick={() => router.push("/users/dashboard")}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 ${
            router.pathname.includes("/dashboard")
              ? "text-black bg-gray-100 scale-110"
              : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
          }`}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
            />
          </svg>
          {/* <span className="text-[10px] font-bold">Home</span> */}
        </button>
        <button
          onClick={() => router.push("/users/community")}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 ${
            router.pathname.includes("/community")
              ? "text-black bg-gray-100 scale-110"
              : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
          }`}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </button>
        <button
          onClick={() => router.push("/users/event-library")}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 ${
            router.pathname.includes("/event-library")
              ? "text-black bg-gray-100 scale-110"
              : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
          }`}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        </button>
        <button
          onClick={() => router.push("/users/wallet")}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 ${
            router.pathname.includes("/wallet")
              ? "text-black bg-gray-100 scale-110"
              : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
          }`}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M3 7a2 2 0 012-2h11a4 4 0 110 8H5a2 2 0 01-2-2V7zM16 9H7"
            />
          </svg>
        </button>
      </div>

      {showAnnouncements && (
        <UserAnnouncementsModal onClose={() => setShowAnnouncements(false)} />
      )}
    </div>
  );
}
