import UserNavBar from "@/components/UserNavBar";
import { useState, useEffect, useCallback } from "react";
import { FiCheck, FiSearch, FiList, FiUsers, FiUser, FiMail, FiHash, FiCheckCircle, FiXCircle, FiFilter } from "react-icons/fi";
import { useRouter } from "next/router";
import io from "socket.io-client";
import { API_URL } from "@/utils/config";
import Head from "next/head";
import Link from "next/link";

const Registration = () => {
    const router = useRouter();
    const eventId = router.query.eventId;
    const [showChecklist, setShowChecklist] = useState(false);
    const [users, setUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [eventName, setEventName] = useState("");
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '' }

    const fetchEvent = useCallback(async () => {
        if (!eventId) return;
        try {
            const response = await fetch(
                `${API_URL}/getevent`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        event_id: eventId,
                    }),
                }
            );
            if (response.ok) {
                const data = await response.json();
                setUsers(data.participants || []);
                setEventName(data.name || "Event");
            } else {
                throw new Error(`${response.status} ${response.statusText}`);
            }
        } catch (error) {
            console.error("Error fetching event data:", error.message);
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    useEffect(() => {
        fetchEvent();
    }, [fetchEvent]);

    useEffect(() => {
        if (!eventId) return;
        const socket = io(API_URL, {
            path: "/socket.io",
            transports: ["websocket", "polling"],
            withCredentials: true
        });

        socket.on("connect", () => {
            console.log("Connected to socket server");
        });

        socket.on("participant_updated", (data) => {
            if (data.eventId === eventId) {
                console.log("Real-time update received");
                fetchEvent();
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [eventId, fetchEvent]);

    function handleCheckboxChange(userId) {
        setUsers(
            users.map((user) => {
                if (user.id === userId) {
                    return {
                        ...user,
                        checked: !user.checked,
                    };
                }
                return user;
            })
        );
    }

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    const handleSubmit = async () => {
        const checkedUsers = users
            .filter((user) => user.checked)
            .map((user) => user.id);
        
        if (checkedUsers.length === 0) {
            showMessage("error", "No users selected");
            return;
        }

        try {
            const response = await fetch(
                `${API_URL}/event/checkin`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        event_id: eventId,
                        checkInList: checkedUsers,
                    }),
                }
            );
            if (response.ok) {
                const data = await response.json();
                if (data.msg == "success") {
                    fetchEvent();
                    showMessage("success", "Check-in successful");
                    // Uncheck all after success
                    setUsers(users.map(u => ({ ...u, checked: false })));
                }
            } else {
                throw new Error(`${response.status} ${response.statusText}`);
            }
        } catch (error) {
            console.error("Error updating check-in:", error.message);
            showMessage("error", "Error updating check-in");
        }
    };

    const filteredUsers = users.filter((user) =>
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.regno?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const checklistUsers = filteredUsers.filter(user => !user.entry); // Show only those not yet entered for checklist
    const displayUsers = showChecklist ? checklistUsers : filteredUsers;

    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-20">
            <UserNavBar />
            <Head>
                <title>Check-in Manager | UniHub</title>
            </Head>

            {/* Toast Notification */}
            {message && (
                <div className={`fixed top-24 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl border-l-4 flex items-center gap-3 animate-fade-in-up ${message.type === 'success' ? 'bg-white border-green-500 text-green-700' : 'bg-white border-red-500 text-red-700'}`}>
                    {message.type === 'success' ? <FiCheckCircle className="text-xl" /> : <FiXCircle className="text-xl" />}
                    <span className="font-bold">{message.text}</span>
                </div>
            )}

            <main className="pt-24 container mx-auto px-4 max-w-6xl">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 animate-fade-in">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                             <Link href={`/event/${eventId}/manage`} className="text-sm font-bold text-gray-400 hover:text-[color:var(--secondary-color)] transition-colors flex items-center gap-1">
                                ← Back to Management
                             </Link>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-2">Check-in Manager</h1>
                        <p className="text-gray-500 font-medium text-lg">Manage participants for <span className="text-[color:var(--secondary-color)] font-bold">{eventName}</span></p>
                    </div>
                    
                    <div className="bg-white p-1.5 rounded-xl shadow-sm border border-gray-200 flex">
                        <button
                            className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all ${
                                !showChecklist
                                    ? "bg-[color:var(--secondary-color)] text-white shadow-md shadow-blue-500/20"
                                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                            }`}
                            onClick={() => setShowChecklist(false)}
                        >
                            <FiUsers className="text-lg" /> All Participants
                        </button>
                        <button
                            className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all ${
                                showChecklist
                                    ? "bg-[color:var(--secondary-color)] text-white shadow-md shadow-blue-500/20"
                                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                            }`}
                            onClick={() => setShowChecklist(true)}
                        >
                            <FiList className="text-lg" /> Check-in Mode
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden flex flex-col min-h-[600px] animate-fade-in-up">
                    
                    {/* Toolbar */}
                    <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/30">
                        <div className="flex items-center gap-2 text-sm font-bold text-gray-500 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                            <FiFilter className="text-[color:var(--secondary-color)]" />
                            Showing {displayUsers.length} participants
                        </div>
                        <div className="relative w-full sm:w-96 group">
                            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[color:var(--secondary-color)] transition-colors" />
                            <input
                                type="text"
                                placeholder="Search by name, email, or reg no..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-[color:var(--secondary-color)] transition-all shadow-sm text-sm font-bold text-gray-700"
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto flex-grow">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                                <div className="w-12 h-12 border-4 border-[color:var(--secondary-color)] border-t-transparent rounded-full animate-spin mb-4"></div>
                                <p className="font-bold">Loading participants...</p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400 font-bold">
                                        <th className="px-6 py-5 w-16 text-center">#</th>
                                        <th className="px-6 py-5">Participant</th>
                                        <th className="px-6 py-5 hidden md:table-cell">Contact Info</th>
                                        <th className="px-6 py-5 text-center">Status</th>
                                        {showChecklist && <th className="px-6 py-5 text-center">Select</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {displayUsers.length > 0 ? (
                                        displayUsers.map((user, index) => (
                                            <tr 
                                                key={user.id} 
                                                className={`group transition-all duration-200 ${user.checked ? 'bg-blue-50/60' : 'hover:bg-gray-50'}`}
                                                onClick={showChecklist ? () => handleCheckboxChange(user.id) : undefined}
                                            >
                                                <td className="px-6 py-4 text-center text-gray-400 font-bold text-sm">
                                                    {index + 1}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 text-[color:var(--secondary-color)] flex items-center justify-center font-black text-lg shadow-sm border border-blue-100 group-hover:scale-110 transition-transform">
                                                            {user.name ? user.name.charAt(0).toUpperCase() : "?"}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-gray-900 text-base">{user.name}</div>
                                                            <div className="text-xs font-bold text-gray-400 md:hidden mt-1 bg-gray-100 inline-block px-2 py-0.5 rounded-md">{user.regno}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 hidden md:table-cell">
                                                    <div className="space-y-1.5">
                                                        <div className="text-sm text-gray-600 flex items-center gap-2 font-medium">
                                                            <FiMail className="text-gray-400" /> {user.email}
                                                        </div>
                                                        <div className="text-sm text-gray-600 flex items-center gap-2 font-medium">
                                                            <FiHash className="text-gray-400" /> {user.regno}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {user.entry ? (
                                                        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-green-100 text-green-700 text-xs font-bold shadow-sm shadow-green-100 border border-green-200">
                                                            <FiCheckCircle /> Checked In
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gray-100 text-gray-500 text-xs font-bold border border-gray-200">
                                                            Pending
                                                        </span>
                                                    )}
                                                </td>
                                                {showChecklist && (
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="relative inline-block w-6 h-6">
                                                            <input
                                                                type="checkbox"
                                                                checked={user.checked || false}
                                                                onChange={() => handleCheckboxChange(user.id)}
                                                                className="peer appearance-none w-6 h-6 border-2 border-gray-300 rounded-lg checked:bg-[color:var(--secondary-color)] checked:border-[color:var(--secondary-color)] transition-all cursor-pointer"
                                                            />
                                                            <FiCheck className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-sm pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" />
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={showChecklist ? 5 : 4} className="px-6 py-20 text-center text-gray-400">
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-3xl text-gray-300">
                                                        <FiSearch />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 text-lg">No participants found</p>
                                                        <p className="text-sm mt-1">Try adjusting your search query</p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Footer / Action Bar */}
                    {showChecklist && (
                        <div className="p-6 border-t border-gray-100 bg-white sticky bottom-0 z-10 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                            <div className="text-sm font-bold text-gray-600 bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
                                <span className="text-[color:var(--secondary-color)] text-lg mr-1">{users.filter(u => u.checked).length}</span> selected
                            </div>
                            <button
                                onClick={handleSubmit}
                                disabled={users.filter(u => u.checked).length === 0}
                                className="w-full sm:w-auto px-8 py-3.5 bg-[color:var(--secondary-color)] text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:-translate-y-1 hover:shadow-blue-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none flex items-center justify-center gap-2"
                            >
                                <FiCheckCircle className="text-xl" /> Confirm Check-in
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Registration;
