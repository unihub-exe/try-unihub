import AdminNavBar from "@/components/AdminNavBar";
import { getAdminToken } from "@/utils/getAdminToken";
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { FiShare2, FiTrash2, FiUsers, FiClock, FiMapPin, FiCalendar } from "react-icons/fi";
import { API_URL } from "@/utils/config";

function AdminEventPage() {
    const router = useRouter();
    const eventId = router.query.eventId;
    const [eventData, setEventData] = useState([]);
    const createdAt = eventData.createdAt;
    const date = new Date(createdAt);
    const adminId = getAdminToken();

    const dateString = date.toLocaleDateString();
    const timeString = date.toLocaleTimeString("en-US", { hour12: false });

    // function to handle share button click
    const share = () => {
        if (navigator.share) {
            navigator
                .share({
                    title: eventData.name,
                    text: "Check out this event!",
                    url: window.location.href,
                })
                .then(() => console.log("Successful share"))
                .catch((error) => console.log("Error sharing", error));
        }
    };

    // function to handle delete event button click
    const deleteEvent = async () => {
        const confirmDelete = window.confirm(
            "This action will permanently delete the event and all associated data. Do you want to continue?"
        );
        if (!confirmDelete) {
            return;
        }
        try {
            const response = await fetch(
                `${API_URL}/event/delete`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        event_id: eventId,
                        admin_id: adminId,
                    }),
                }
            );
            if (response.ok) {
                const data = await response.json();
                if(data.msg == "success"){
                    router.push("/admin/dashboard");
                }
            } else {
                throw new Error(`${response.status} ${response.statusText}`);
            }
        } catch (error) {
            console.error("Error fetching event data:", error.message);
        }
    };

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const response = await fetch(
                    `${API_URL}/event/getevent`,
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
                    setEventData(data);
                } else {
                    throw new Error(`${response.status} ${response.statusText}`);
                }
            } catch (error) {
                console.error("Error fetching event data:", error.message);
            }
        };
        if (eventId) fetchEvent();
    }, [eventId]);

    if (!eventData || !eventData.cover)
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                 <div className="animate-pulse flex flex-col items-center">
                     <div className="h-12 w-12 border-4 border-[color:var(--secondary-color)] border-t-transparent rounded-full animate-spin mb-4"></div>
                     <div className="h-4 w-32 bg-gray-200 rounded"></div>
                 </div>
            </div>
        );
    else
        return (
            <div className="min-h-screen bg-gray-50 font-sans">
                <AdminNavBar />
                <Head>
                    <title>{eventData.name} | Admin</title>
                </Head>

                <main className="pt-24 pb-12 container mx-auto px-4 max-w-6xl">
                    
                    {/* Header / Cover */}
                    <div className="relative h-64 sm:h-96 w-full rounded-3xl overflow-hidden shadow-xl shadow-gray-200/50 mb-8 group border border-gray-100">
                        <Image
                            src={eventData.cover}
                            alt={eventData.name}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                            priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 p-6 sm:p-10 text-white max-w-4xl">
                            <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-xs font-bold mb-3 border border-white/30 uppercase tracking-wider">
                                {eventData.organizer}
                            </span>
                            <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-4 leading-tight">{eventData.name}</h1>
                            <div className="flex flex-wrap items-center gap-6 text-sm sm:text-base font-medium opacity-90">
                                <span className="flex items-center gap-2"><FiCalendar className="text-lg" /> {dateString}</span>
                                <span className="flex items-center gap-2"><FiClock className="text-lg" /> {timeString}</span>
                                <span className="flex items-center gap-2"><FiMapPin className="text-lg" /> {eventData.venue}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* About */}
                            <div className="bg-white rounded-3xl p-8 shadow-lg shadow-gray-200/50 border border-gray-100">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">About the Event</h2>
                                <p className="text-gray-600 leading-relaxed text-lg whitespace-pre-line">{eventData.description}</p>
                            </div>

                            {/* Stats/Details */}
                            <div className="bg-white rounded-3xl p-8 shadow-lg shadow-gray-200/50 border border-gray-100">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">Event Overview</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 transition-all hover:bg-blue-50 hover:border-blue-100 group">
                                        <div className="text-sm text-gray-500 mb-2 group-hover:text-blue-600 font-medium">Total Registrations</div>
                                        <div className="text-3xl font-black text-gray-900 group-hover:text-blue-700">
                                            {eventData.participants?.length || 0}
                                        </div>
                                    </div>
                                    <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 transition-all hover:bg-green-50 hover:border-green-100 group">
                                        <div className="text-sm text-gray-500 mb-2 group-hover:text-green-600 font-medium">Ticket Price</div>
                                        <div className="text-3xl font-black text-gray-900 group-hover:text-green-700">
                                            ₦{eventData.price}
                                        </div>
                                    </div>
                                    <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 sm:col-span-2">
                                        <div className="text-sm text-gray-500 mb-2 font-medium">Created At</div>
                                        <div className="font-bold text-gray-900 text-lg">
                                            {dateString} <span className="text-gray-400 font-normal">at</span> {timeString}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Actions */}
                            <div className="bg-white rounded-3xl p-6 shadow-lg shadow-gray-200/50 border border-gray-100 sticky top-24">
                                <h3 className="font-bold text-gray-900 mb-6 text-xl">Admin Actions</h3>
                                <div className="space-y-3">
                                    <button 
                                        onClick={() => router.push(`/event/${eventData.event_id}/registration`)} 
                                        className="w-full py-4 bg-[color:var(--secondary-color)] text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2"
                                    >
                                        <FiUsers className="text-xl" />
                                        View Registrations
                                    </button>
                                    <button 
                                        onClick={share} 
                                        className="w-full py-4 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                                    >
                                        <FiShare2 className="text-xl" />
                                        Share Event
                                    </button>
                                    
                                    <div className="pt-6 mt-6 border-t border-gray-100">
                                        <button 
                                            onClick={deleteEvent} 
                                            className="w-full py-4 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-all border border-red-100 flex items-center justify-center gap-2"
                                        >
                                            <FiTrash2 className="text-xl" />
                                            Delete Event
                                        </button>
                                        <p className="text-xs text-red-400 mt-3 text-center px-4 leading-relaxed">
                                            Warning: This action is permanent and cannot be undone.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        );
}

export default AdminEventPage;
