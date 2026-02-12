import Dashboard_Filter from "@/components/Dashboard_Filter";
import Popup_Filter from "@/components/Popup_Filter";
import UserNavBar from "@/components/UserNavBar";
import BackButton from "@/components/BackButton";
import { getUserToken } from "@/utils/getUserToken";
import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { FiCalendar, FiMapPin, FiImage, FiUsers, FiTrash2 } from "react-icons/fi";
import { RxHamburgerMenu } from "react-icons/rx";
import { API_URL } from "@/utils/config";

function UserDashboard() {
    const router = useRouter();
    const picRatio = 0.606;

    const userIdCookie = getUserToken();
    const [pastEvents, setPastEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingCancel, setLoadingCancel] = useState(false);

    useEffect(() => {
        const isPastOneDay = (dateStr) => {
            if (!dateStr) return false;
            try {
                const parts = String(dateStr).split("/"); // dd/mm/yyyy
                if (parts.length !== 3) return false;
                const dd = parseInt(parts[0], 10);
                const mm = parseInt(parts[1], 10) - 1;
                const yyyy = parseInt(parts[2], 10);
                const eventDate = new Date(yyyy, mm, dd);
                const cutoff = new Date(eventDate.getTime() + 24 * 60 * 60 * 1000);
                const now = new Date();
                return now >= cutoff;
            } catch (e) {
                return false;
            }
        };

        const fetchAllEvents = async () => {
            const response = await fetch(
                `${API_URL}/user/details`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        user_token: userIdCookie,
                    }),
                }
            );
            if (!response.ok) {
                throw new Error(`${response.status} ${response.statusText}`);
            }
            try {
                const data = await response.json();
                const past = (data.registeredEvents || []).filter((ev) => isPastOneDay(ev.date));
                setPastEvents(past);
            } catch (error) {
                console.error("Invalid JSON string:", error.message);
            } finally {
                setLoading(false);
            }
        };
        if (userIdCookie) {
            fetchAllEvents();
        } else {
            setLoading(false);
        }
    }, [userIdCookie]);

    const handleCancel = async (eventId) => {
        try {
            setLoadingCancel(true);
            const response = await fetch(
                `${API_URL}/payment/cancel`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        user: { user_id: userIdCookie },
                        event: { event_id: eventId },
                    }),
                }
            );
            const data = await response.json();
            if (data.status === "success") {
                setPastEvents((prev) => prev.filter((e) => e.event_id !== eventId));
            }
        } catch (e) {
        } finally {
            setLoadingCancel(false);
        }
    };

    const [popupFilterOpen, setPopupFilterOpen] = useState(false);
    const [filterOptions, setFilterOptions] = useState({
        keyword: "",
        category: "",
        dateRange: "",
        price: [10, 100],
    });

    const handleFilterApply = () => {
        // Perform the search/filter operation based on the filter options
        // ...
        console.log(filterOptions);
        setPopupFilterOpen(false); // Close the popup filter
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-slate-900 relative">
            <UserNavBar />
            <BackButton className="!text-gray-800 !bg-white/80 !border-gray-200" />
            
            <div className="pt-24 pb-12 container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Filter - Hidden on mobile, visible on desktop */}
                    <div className="hidden lg:block w-1/4 space-y-6">
                        <div className="bg-white p-6 rounded-3xl shadow-lg shadow-gray-200/50 border border-gray-100 sticky top-24">
                            <h3 className="font-bold text-gray-900 mb-4 text-lg">Filters</h3>
                            <Dashboard_Filter
                                filterOptions={filterOptions}
                                setFilterOptions={setFilterOptions}
                                handleFilterApply={handleFilterApply}
                            />
                        </div>
                    </div>

                    {/* Mobile Filter Button & Popup */}
                    {popupFilterOpen && (
                        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                            <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl animate-fade-in-up">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-bold text-xl text-gray-900">Filters</h3>
                                    <button 
                                        onClick={() => setPopupFilterOpen(false)}
                                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                    >
                                        ✕
                                    </button>
                                </div>
                                <Popup_Filter
                                    filterOptions={filterOptions}
                                    setFilterOptions={setFilterOptions}
                                    handleFilterApply={handleFilterApply}
                                    handleClose={() => setPopupFilterOpen(false)}
                                />
                            </div>
                        </div>
                    )}

                    {/* Main Content */}
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Past Events</h1>
                                <p className="text-gray-500 mt-2">Events you've attended or registered for in the past.</p>
                            </div>
                            <button
                                onClick={() => setPopupFilterOpen(true)}
                                className="lg:hidden p-3 bg-white text-gray-900 rounded-xl shadow-lg shadow-gray-200 border border-gray-100"
                            >
                                <RxHamburgerMenu className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {pastEvents.length === 0 ? (
                                <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-dashed border-gray-200">
                                    <div className="mx-auto h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-400 text-2xl">
                                        <FiCalendar />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">No past events found</h3>
                                    <p className="text-gray-500 mt-1">You haven't attended any events yet.</p>
                                </div>
                            ) : (
                                pastEvents.map((event) => (
                                    <div
                                        className="group bg-white rounded-3xl shadow-lg shadow-gray-200/50 border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-gray-200/50 transition-all flex flex-col h-full"
                                        key={event._id}
                                    >
                                        <div className="relative h-48 w-full overflow-hidden">
                                            {event.profile ? (
                                                <Image
                                                    fill
                                                    className="object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0"
                                                    src={event.profile}
                                                    alt={event.name}
                                                    sizes="(min-width: 640px) 100vw, 50vw"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                                                    <FiImage className="text-4xl" />
                                                </div>
                                            )}
                                            <div className="absolute top-4 right-4 bg-gray-900/80 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                                                Past
                                            </div>
                                        </div>
                                        
                                        <div className="p-6 flex flex-col flex-1">
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-2">
                                                    <p className="text-xs font-bold text-[color:var(--secondary-color)] uppercase tracking-wider">
                                                        {event.date}
                                                    </p>
                                                    <p className="font-bold text-gray-900">
                                                        ₦ {event.price}
                                                    </p>
                                                </div>
                                                
                                                <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 leading-tight group-hover:text-[color:var(--secondary-color)] transition-colors">
                                                    {event.name}
                                                </h3>
                                                
                                                <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                                                    <FiMapPin className="shrink-0" />
                                                    <span className="truncate">{event.venue}</span>
                                                </div>
                                            </div>

                                            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                                                    <FiUsers className="text-gray-400" />
                                                    <span>{(event.participants || []).length} Attendees</span>
                                                </div>
                                                
                                                <button
                                                    onClick={() => handleCancel(event.event_id)}
                                                    className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors flex items-center gap-1"
                                                    disabled={loadingCancel}
                                                >
                                                    {loadingCancel ? <div className="w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div> : <FiTrash2 />}
                                                    {loadingCancel ? "Processing..." : "Remove"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UserDashboard;
