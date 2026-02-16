import { getAdminToken } from "@/utils/getAdminToken";
import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useState, useCallback } from "react";
import AdminDropdown from "@/components/AdminDropdown";
import { API_URL } from "@/utils/config";
import { FiGrid, FiUsers, FiDollarSign, FiAlertCircle, FiPlus, FiBell } from "react-icons/fi";

export default function NavBar() {
    const router = useRouter();

    const adminIdCookie = getAdminToken();
    const [adminData, setAdminData] = useState({});

    const fetchAdminData = useCallback(async () => {
        if (!adminIdCookie) {
            router.push("/admin/auth");
            return;
        }
        try {
            const response = await fetch(`${API_URL}/admin/details`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${adminIdCookie}`
                },
                body: JSON.stringify({ admin_id: adminIdCookie }),
            });
            if (response.ok) {
                const data = await response.json();
                setAdminData(data);
            } else if (response.status === 401) {
                // Token invalid, redirect to login
                router.push("/admin/auth");
            }
        } catch (error) {
            console.error("Fetch admin error:", error);
        }
    }, [adminIdCookie, router]);

    useEffect(() => {
        fetchAdminData();
    }, [fetchAdminData]);

    const isActive = (path) => router.pathname === path;

    return (
        <div className="mb-[10vh]">
            <header className="fixed top-0 z-50 w-full bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100">
                <div className="container mx-auto flex items-center justify-between py-3 px-4 md:px-6">
                    <div
                        onClick={() => router.push("/admin/dashboard")}
                        className="flex items-center gap-2 cursor-pointer"
                    >
                        <Image
                            src="/img/only_logo.png"
                            width={32}
                            height={32}
                            alt="UniHub"
                            className="h-8 w-8"
                        />
                        <h1 className="text-xl font-extrabold tracking-tight text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                            UniHub <span className="text-[color:var(--secondary-color)]">Admin</span>
                        </h1>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-1">
                        <button
                            onClick={() => router.push("/admin/dashboard")}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                                isActive("/admin/dashboard")
                                    ? "bg-gray-100 text-[color:var(--secondary-color)]"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            }`}
                        >
                            <FiGrid /> Events
                        </button>
                        <button
                            onClick={() => router.push("/admin/users")}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                                isActive("/admin/users")
                                    ? "bg-gray-100 text-[color:var(--secondary-color)]"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            }`}
                        >
                            <FiUsers /> Users
                        </button>
                        <button
                            onClick={() => router.push("/admin/payouts")}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                                isActive("/admin/payouts")
                                    ? "bg-gray-100 text-[color:var(--secondary-color)]"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            }`}
                        >
                            <FiDollarSign /> Payouts
                        </button>
                        <button
                            onClick={() => router.push("/admin/reports")}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                                isActive("/admin/reports")
                                    ? "bg-gray-100 text-[color:var(--secondary-color)]"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            }`}
                        >
                            <FiAlertCircle /> Reports
                        </button>
                        <button
                            onClick={() => router.push("/admin/announcements")}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                                isActive("/admin/announcements")
                                    ? "bg-gray-100 text-[color:var(--secondary-color)]"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            }`}
                        >
                            <FiBell /> Announcements
                        </button>
                    </nav>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.push("/admin/eventform")}
                            className="hidden md:flex items-center gap-2 bg-[color:var(--secondary-color)] text-white px-4 py-2 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
                        >
                            <FiPlus /> Create Event
                        </button>
                        <AdminDropdown adminData={adminData} />
                    </div>
                </div>
            </header>

            {/* Mobile Bottom Navigation Bar */}
            <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 z-50 px-6 py-3 flex justify-around items-center">
                <button
                    onClick={() => router.push("/admin/dashboard")}
                    className={`flex flex-col items-center gap-1 ${isActive("/admin/dashboard") ? "text-[color:var(--secondary-color)]" : "text-gray-500"}`}
                >
                    <FiGrid size={20} />
                    <span className="text-[10px] font-bold">Events</span>
                </button>
                <button
                    onClick={() => router.push("/admin/users")}
                    className={`flex flex-col items-center gap-1 ${isActive("/admin/users") ? "text-[color:var(--secondary-color)]" : "text-gray-500"}`}
                >
                    <FiUsers size={20} />
                    <span className="text-[10px] font-bold">Users</span>
                </button>
                <button
                    onClick={() => router.push("/admin/eventform")}
                    className="flex flex-col items-center gap-1 text-[color:var(--secondary-color)]"
                >
                    <div className="w-10 h-10 bg-[color:var(--secondary-color)] text-white rounded-full flex items-center justify-center shadow-lg -mt-6 border-4 border-gray-50">
                        <FiPlus size={24} />
                    </div>
                    <span className="text-[10px] font-bold">Create</span>
                </button>
                <button
                    onClick={() => router.push("/admin/payouts")}
                    className={`flex flex-col items-center gap-1 ${isActive("/admin/payouts") ? "text-[color:var(--secondary-color)]" : "text-gray-500"}`}
                >
                    <FiDollarSign size={20} />
                    <span className="text-[10px] font-bold">Payouts</span>
                </button>
                <button
                    onClick={() => router.push("/admin/reports")}
                    className={`flex flex-col items-center gap-1 ${isActive("/admin/reports") ? "text-[color:var(--secondary-color)]" : "text-gray-500"}`}
                >
                    <FiAlertCircle size={20} />
                    <span className="text-[10px] font-bold">Reports</span>
                </button>
                <button
                    onClick={() => router.push("/admin/announcements")}
                    className={`flex flex-col items-center gap-1 ${isActive("/admin/announcements") ? "text-[color:var(--secondary-color)]" : "text-gray-500"}`}
                >
                    <FiBell size={20} />
                    <span className="text-[10px] font-bold">Alerts</span>
                </button>
            </div>
        </div>
    );
}
