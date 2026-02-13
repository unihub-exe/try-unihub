import AdminNavBar from "@/components/AdminNavBar";
import Dashboard_Filter from "@/components/Dashboard_Filter";
import Popup_Filter from "@/components/Popup_Filter";
import { getAdminToken } from "@/utils/getAdminToken";
import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { AiOutlinePlus } from "react-icons/ai";
import {
  FiUsers,
  FiMapPin,
  FiCalendar,
} from "react-icons/fi";
import { RxHamburgerMenu } from "react-icons/rx";
import { API_URL } from "@/utils/config";

function AdminDashboard() {
  const router = useRouter();

  const [allEvents, setAllEvents] = useState([]);
  const adminIdCookie = getAdminToken();
  const [popupFilterOpen, setPopupFilterOpen] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState(null);
  const [filterOptions, setFilterOptions] = useState({
    keyword: "",
    category: "",
    dateRange: "",
    price: [0, 20000000],
  });
  const [originalEvents, setOriginalEvents] = useState([]);

  const fetchAllEvents = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/events`);
      if (!response.ok)
        throw new Error(`${response.status} ${response.statusText}`);
      const data = await response.json();
      setAllEvents(data);
      setOriginalEvents(data);
    } catch (error) {
      console.error("Error fetching events:", error.message);
    }
  };

  useEffect(() => {
    fetchAllEvents();
  }, [adminIdCookie]);

  useEffect(() => {
    const socket = io(API_URL, {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    socket.on("event_created", () => {
      console.log("Real-time update: Event created");
      fetchAllEvents();
    });

    socket.on("event_deleted", () => {
      console.log("Real-time update: Event deleted");
      fetchAllEvents();
    });

    socket.on("participant_updated", () => {
      console.log("Real-time update: Participant updated");
      fetchAllEvents();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleDeleteEvent = async (e, eventId) => {
    e.stopPropagation();
    if (
      !confirm(
        "Are you sure you want to delete this event? This action cannot be undone."
      )
    )
      return;

    setDeletingEvent(eventId);
    try {
      const response = await fetch(`${API_URL}/admin/events/${eventId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const updatedEvents = allEvents.filter((ev) => ev.event_id !== eventId);
        setAllEvents(updatedEvents);
        setOriginalEvents(updatedEvents);
      } else {
        alert("Failed to delete event");
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("Error deleting event");
    } finally {
      setDeletingEvent(null);
    }
  };

  // dont move this state becoz it needs allevents
  const [filteredEvents, setFilteredEvents] = useState(allEvents);

  // Update filteredEvents state whenever allEvents or filterOptions change
  useEffect(() => {
    const newFilteredEvents = allEvents.filter((event) => {
      // Check if keyword filter matches
      if (
        filterOptions.keyword.toLowerCase() &&
        !event.name.toLowerCase().includes(filterOptions.keyword.toLowerCase())
      ) {
        return false;
      }

      // Check if date range filter matches
      if (filterOptions.dateRange) {
        const date = filterOptions.dateRange;
        // Split the date string into an array of substrings
        const dateParts = event.date.split("/");
        // Rearrange the array elements to get yyyy-mm-dd format
        const formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
        if (formattedDate < date) {
          return false;
        }
      }

      // Check if price filter matches
      if (
        event.price < filterOptions.price[0] ||
        event.price > filterOptions.price[1]
      ) {
        return false;
      }

      return true;
    });

    setFilteredEvents(newFilteredEvents);
  }, [allEvents, filterOptions]);

  const handleFilterClear = () => {
    setFilterOptions({
      keyword: "",
      category: "",
      dateRange: "",
      price: [0, 20000000],
    });
    setFilteredEvents(allEvents);
    setPopupFilterOpen(false);
  };

  return (
    <div
      className="pt-6 lg:pt-8 overflow-y-hidden bg-gray-50/50 min-h-screen"
      style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
    >
      <AdminNavBar />

      <div className="flex m-auto relative z-10">
        <div className="flex mx-auto container px-4">
            <div className="flex m-auto gap-4 lg:gap-8 w-full h-[calc(90vh)]">
              {/* Render the regular filter for medium screens and above */}
              <div className="hidden md:flex flex-col sticky top-0 w-1/6 md:w-1/4 h-fit mt-4">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                  <div className="">
                    <h3
                      className="text-lg font-bold text-gray-900 mb-4"
                      style={{ fontFamily: "Outfit, sans-serif" }}
                    >
                      Filters
                    </h3>
                    <Dashboard_Filter
                      filterOptions={filterOptions}
                      setFilterOptions={setFilterOptions}
                      handleFilterClear={handleFilterClear}
                    />
                  </div>
                </div>
              </div>

              {/* Render the popup filter for small screens */}
              {popupFilterOpen && (
                <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-fadeIn relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[color:var(--secondary-color)] to-[color:var(--darker-secondary-color)]"></div>
                    <div className="flex justify-between items-center mb-4">
                      <h3
                        className="text-xl font-bold text-gray-900"
                        style={{ fontFamily: "Outfit, sans-serif" }}
                      >
                        Filter Events
                      </h3>
                      <button
                        onClick={() => setPopupFilterOpen(false)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                    <Popup_Filter
                      filterOptions={filterOptions}
                      setFilterOptions={setFilterOptions}
                      handleFilterClear={handleFilterClear}
                      handleClose={() => setPopupFilterOpen(false)}
                    />
                  </div>
                </div>
              )}

              {/* Render the main content of the dashboard */}
              <div className="flex w-full md:w-3/4 mx-auto justify-between container">
                <div className="p-2 overflow-y-auto w-full h-full scrollbar-hide">
                  <div className="flex justify-between items-end mb-6">
                    <div>
                      <h2
                        className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight"
                        style={{ fontFamily: "Outfit, sans-serif" }}
                      >
                        My Events
                      </h2>
                      <p className="text-gray-500 mt-1 font-medium">
                        Manage and track your events
                      </p>
                    </div>
                    <span className="bg-[color:var(--secondary-color)]/10 text-[color:var(--secondary-color)] px-4 py-1.5 rounded-full text-sm font-bold shadow-sm">
                      {filteredEvents.length} Events
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                    {filteredEvents.length === 0 ? (
                      <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <FiCalendar size={32} className="opacity-50" />
                        </div>
                        <p
                          className="text-xl font-bold mb-1"
                          style={{ fontFamily: "Outfit, sans-serif" }}
                        >
                          No events found
                        </p>
                        <p className="text-sm opacity-80">
                          Try adjusting your filters or create a new event
                        </p>
                      </div>
                    ) : (
                      filteredEvents.map((event) => (
                        <div
                          onClick={() => {
                            router.push(`/event/${event.event_id}/adminevents`);
                          }}
                          className="group relative bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border border-gray-100 hover:-translate-y-1"
                          key={event._id}
                        >
                          <div className="relative h-48 w-full overflow-hidden">
                            {event.profile ? (
                              <Image
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                                src={event.profile}
                                alt={event.name}
                                sizes="(min-width: 640px) 100vw, 50vw"
                                priority
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                                <FiCalendar size={32} className="opacity-20" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl text-sm font-bold text-gray-900 shadow-lg flex items-center gap-1">
                              <span className="text-[color:var(--secondary-color)]">
                                ₦
                              </span>
                              {event.price}
                            </div>
                          </div>

                          <div className="p-5">
                            <h3
                              className="text-lg font-bold text-gray-900 leading-tight mb-3 line-clamp-2 group-hover:text-[color:var(--secondary-color)] transition-colors"
                              style={{ fontFamily: "Outfit, sans-serif" }}
                            >
                              {event.name}
                            </h3>

                            <div className="space-y-2.5 text-sm text-gray-600 mb-5">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-500">
                                  <FiMapPin size={14} />
                                </div>
                                <span className="truncate font-medium">
                                  {event.venue}
                                </span>
                              </div>
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0 text-purple-500">
                                  <FiCalendar size={14} />
                                </div>
                                <span className="font-medium">
                                  {event.date}
                                </span>
                              </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                              <div className="flex items-center gap-2 text-gray-600 text-sm bg-gray-50 px-3 py-1 rounded-lg">
                                <FiUsers className="text-[color:var(--secondary-color)]" />
                                <span className="font-bold">
                                  {(event.participants || []).length}
                                </span>
                                <span className="text-xs font-medium opacity-80">
                                  Registered
                                </span>
                              </div>
                              <span className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-[color:var(--secondary-color)] group-hover:bg-[color:var(--secondary-color)] group-hover:text-white transition-all transform group-hover:rotate-45">
                                <AiOutlinePlus size={16} />
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom buttons */}
              <div className="fixed bottom-6 right-6 flex flex-col gap-4 z-40">
                {/* Button to open the popup filter */}
                <button
                  onClick={() => setPopupFilterOpen(true)}
                  className="md:hidden flex items-center justify-center w-14 h-14 text-white rounded-full bg-[color:var(--secondary-color)] hover:bg-[color:var(--secondary-color)]/90 shadow-lg shadow-blue-900/30 cursor-pointer transition-all hover:scale-110 active:scale-95 hover:-translate-y-1"
                  title="Filter Events"
                >
                  <RxHamburgerMenu className="w-6 h-6" />
                </button>
                {/* Button to open the event form */}
                <button
                  onClick={() => router.push("/admin/eventform")}
                  className="flex items-center justify-center w-14 h-14 text-white rounded-full bg-[color:var(--darker-secondary-color)] hover:bg-[color:var(--secondary-color)] shadow-lg shadow-blue-900/30 cursor-pointer transition-all hover:scale-110 active:scale-95 hover:-translate-y-1"
                  title="Create New Event"
                >
                  <AiOutlinePlus className="w-6 h-6" />
                </button>
              </div>
            </div>
        </div>
      </div>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

export default AdminDashboard;
