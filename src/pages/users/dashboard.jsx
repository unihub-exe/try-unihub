import Dashboard_Filter from "@/components/Dashboard_Filter";
import UserNavBar from "@/components/UserNavBar";
import OnboardingGuide from "@/components/OnboardingGuide";
import EventCard from "@/components/EventCard";
import InstallAppButton from "@/components/InstallAppButton";
import Image from "next/image";
import { useRouter } from "next/router";
import Link from "next/link";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { FiPlus, FiMapPin } from "react-icons/fi";
import { getUserToken } from "@/utils/getUserToken";
import { API_URL } from "@/utils/config";

function UserDashboard() {
  const router = useRouter();

  const [allEvents, setAllEvents] = useState([]);
  const [showInlineFilter, setShowInlineFilter] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    keyword: "",
    category: "",
    dateRange: "",
    price: [0, 100000],
    isPremium: false,
  });
  const [showGuide, setShowGuide] = useState(false);
  const [userName, setUserName] = useState("Explorer");
  const [successMessage, setSuccessMessage] = useState("");

  // Handle premium payment success
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    const reference = params.get("reference");
    
    if (status === "success" && reference) {
      // Check if this is from premium payment
      const premiumEventId = sessionStorage.getItem('premium_event_id');
      if (premiumEventId) {
        setSuccessMessage("🎉 Your event has been upgraded to Premium!");
        sessionStorage.removeItem('premium_event_id');
        sessionStorage.removeItem('premium_redirect');
        
        // Clear URL params
        window.history.replaceState({}, '', '/users/dashboard');
        
        // Clear message after 5 seconds
        setTimeout(() => setSuccessMessage(""), 5000);
      }
    }
  }, []);

  // Fix: Handle 400 errors gracefully
  const fetchAllEvents = async () => {
    try {
      const response = await fetch(`${API_URL}/event/getallevents`);
      if (!response.ok) {
        console.warn("Backend error:", response.status);
        setAllEvents([]); 
        return;
      }
      const data = await response.json();
      setAllEvents(data);
    } catch (error) {
      console.error("Network error:", error);
      setAllEvents([]);
    }
  };

  useEffect(() => {
    fetchAllEvents();
    const socket = io(API_URL, { transports: ["websocket"] });
    const handleUpdate = () => fetchAllEvents();
    socket.on("event_created", handleUpdate);
    socket.on("event_deleted", handleUpdate);
    socket.on("event_updated", handleUpdate);
    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    const initUser = async () => {
      try {
        const userId = getUserToken();
        if (!userId) return;
        
        const res = await fetch(`${API_URL}/user/details`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_token: userId }),
        });
        
        if (res.ok) {
           const user = await res.json();
           if (user.firstName) setUserName(user.firstName);
           
           if (typeof window !== "undefined" && localStorage.getItem("unihub_guide_dismissed") !== "1") {
              const isNew = (!user.eventCreated || user.eventCreated.length === 0) &&
                            (!user.registeredEvents || user.registeredEvents.length === 0);
              if (isNew) setShowGuide(true);
           }
        }
      } catch {}
    };
    initUser();
  }, []);

  const [filteredEvents, setFilteredEvents] = useState(allEvents);

  useEffect(() => {
    const newFilteredEvents = allEvents.filter((event) => {
      if (filterOptions.keyword.toLowerCase() && !event.name.toLowerCase().includes(filterOptions.keyword.toLowerCase())) return false;
      
      if (filterOptions.dateRange) {
        const dateParts = event.date.split("/");
        const formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
        if (formattedDate < filterOptions.dateRange) return false;
      }

      if (filterOptions.category && event.category && event.category !== filterOptions.category) return false;
      if (filterOptions.isPremium && !event.isPremium) return false;
      
      if (!filterOptions.keyword) {
        if (event.price < filterOptions.price[0] || event.price > filterOptions.price[1]) return false;
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
      price: [0, 200000],
      isPremium: false,
    });
    setShowInlineFilter(false);
  };

  const resolveTimezone = () => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return tz || "Africa/Lagos";
    } catch {
      return "Africa/Lagos";
    }
  };

  const getHourInTimezone = (tz) => {
    try {
      const hourStr = new Date().toLocaleString("en-GB", {
        timeZone: tz,
        hour: "2-digit",
        hour12: false,
      });
      return parseInt(hourStr, 10);
    } catch {
      return new Date().getHours();
    }
  };

  const getGreeting = () => {
    const hour = getHourInTimezone(resolveTimezone());
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const premiumEvents = allEvents.filter(e => e.isPremium);

  const now = new Date();

  // Helper function to parse event date and time
  const parseEventDateTime = (dateStr, timeStr, isEndTime = false) => {
    if (!dateStr || !timeStr) return null;
    
    const dateParts = dateStr.split('/');
    if (dateParts.length !== 3) return null;
    
    const timeStrTrimmed = timeStr.trim();
    let hours = 0, minutes = 0;
    
    // Handle 12-hour format (3:00 PM)
    if (timeStrTrimmed.includes('AM') || timeStrTrimmed.includes('PM')) {
      const [time, period] = timeStrTrimmed.split(' ');
      const [h, m] = time.split(':').map(Number);
      hours = period === 'PM' && h !== 12 ? h + 12 : (period === 'AM' && h === 12 ? 0 : h);
      minutes = m || 0;
    } else {
      // Handle 24-hour format
      const [h, m] = timeStrTrimmed.split(':').map(Number);
      hours = h;
      minutes = m || 0;
    }
    
    return new Date(dateParts[2], dateParts[1] - 1, dateParts[0], hours, minutes);
  };

  // Categorize events based on actual start and end times
  const liveEvents = filteredEvents.filter(e => {
    const eventStart = parseEventDateTime(e.date, e.time);
    if (!eventStart) return false;
    
    let eventEnd;
    if (e.endDate && e.endTime) {
      eventEnd = parseEventDateTime(e.endDate, e.endTime, true);
    } else {
      // If no end time, assume event lasts 3 hours
      eventEnd = new Date(eventStart.getTime() + 3 * 60 * 60 * 1000);
    }
    
    // Event is live if current time is between start and end
    return now >= eventStart && now <= eventEnd;
  });

  const upcomingEvents = filteredEvents.filter(e => {
    const eventStart = parseEventDateTime(e.date, e.time);
    if (!eventStart) return false;
    
    // Event is upcoming if it hasn't started yet
    return now < eventStart;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-32 md:pb-0 font-sans">
       <UserNavBar />
       <OnboardingGuide visible={showGuide} onDismiss={() => setShowGuide(false)} />
       
       {/* Success Message Toast */}
       {successMessage && (
         <div className="fixed top-20 right-6 z-50 animate-fadeIn">
           <div className="px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 bg-green-50 text-green-700 border-2 border-green-200">
             <span className="font-bold">{successMessage}</span>
             <button onClick={() => setSuccessMessage("")} className="p-1 hover:bg-black/5 rounded-full">
               ✕
             </button>
           </div>
         </div>
       )}
       
       <div className="flex m-auto relative z-10 pt-6 lg:pt-8">
        <div className="flex mx-auto container px-4 lg:px-6 max-w-8xl">
          <div className="flex flex-col md:flex-row m-auto gap-6 lg:gap-8 w-full min-h-[calc(100vh-6rem)]">
            
            

            {/* Main Content Area */}
            <div className="flex flex-col w-full flex-1">
              
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 mt-2">
                 <div>
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
                        {getGreeting()}, <span className="text-gray-500">{userName}</span>
                    </h1>
                 </div>
                 <div className="flex items-center gap-3">
                    <button 
                        onClick={() => router.push("/users/eventform")}
                        className="flex items-center gap-2 bg-[color:var(--secondary-color)] text-white px-4 py-2 rounded-xl font-bold text-xs md:text-sm shadow-md hover:scale-105 transition-transform"
                    >
                        <FiPlus className="text-base" /> Create Event
                    </button>
                    {/* <button 
                        onClick={() => window.open("https://www.google.com/maps/search/events+near+me", "_blank")}
                        className="flex items-center gap-2 bg-white text-gray-700 border border-gray-200 px-4 py-2 rounded-xl font-bold text-xs md:text-sm shadow-sm hover:bg-gray-50 transition-colors"
                    >
                        <FiMapPin className="text-base" /> Map
                    </button> */}
                 </div>
              </div>

              
              <div className="mb-6">
                <div className="relative">
                  <input
                    type="text"
                    value={filterOptions.keyword}
                    onChange={(e) =>
                      setFilterOptions({ ...filterOptions, keyword: e.target.value })
                    }
                    onFocus={() => setShowInlineFilter(true)}
                    placeholder="Search events, categories, organizers..."
                    className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-200 shadow-sm focus:border-black focus:ring-2 focus:ring-black/10 outline-none text-sm md:text-base"
                  />
                </div>
                <div
                  className={`transition-all duration-300 ease-out overflow-hidden ${
                    showInlineFilter ? "max-h-[1000px] opacity-100 translate-y-0" : "max-h-0 opacity-0 -translate-y-1"
                  }`}
                >
                  <div className="mt-3 bg-white border border-gray-200 rounded-2xl shadow-sm p-4">
                    <Dashboard_Filter
                      filterOptions={filterOptions}
                      setFilterOptions={setFilterOptions}
                      handleFilterClear={handleFilterClear}
                    />
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => setShowInlineFilter(false)}
                        className="px-4 py-2 text-xs md:text-sm font-bold bg-black text-white rounded-xl shadow-sm"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Premium Picks */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                   <div className="w-1 h-4 bg-amber-400 rounded-full" />
                   <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide">Premium Picks</h2>
                </div>
                
                {premiumEvents.length === 0 ? (
                  <div className="bg-white border border-dashed border-amber-200 rounded-2xl p-6 text-center text-sm text-gray-500">
                    No premium events yet.
                  </div>
                ) : (
                  <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                      {premiumEvents.map((event) => (
                        <div key={event.event_id} className="min-w-[220px] md:min-w-[240px] snap-center">
                          <EventCard
                            title={event.name}
                            date={event.date}
                            time={event.time}
                            location={event.venue}
                            imageSrc={event.profile}
                            eventId={event.event_id}
                            organizer={event.organizer}
                            price={event.price}
                            category={event.category}
                            isPremium={true}
                            className="h-full shadow-sm hover:shadow-md border-amber-50"
                          />
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Live Events */}
              {liveEvents.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </div>
                    <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide">Live Now</h2>
                  </div>
                  
                  <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                      {liveEvents.map((event) => (
                        <div key={event.event_id} className="min-w-[220px] md:min-w-[240px] snap-center">
                          <EventCard
                            title={event.name}
                            date={event.date}
                            time={event.time}
                            location={event.venue}
                            imageSrc={event.profile}
                            eventId={event.event_id}
                            organizer={event.organizer}
                            price={event.price}
                            category={event.category}
                            isPremium={event.isPremium}
                            className="h-full shadow-sm hover:shadow-md border-red-50 ring-1 ring-red-100"
                          />
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* All Events */}
              <div>
                <div className="flex items-center justify-between mb-4">
                   <div className="flex items-center gap-2">
                        <div className="w-1 h-4 bg-gray-900 rounded-full" />
                        <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide">
                            Upcoming Events
                        </h2>
                   </div>
                   <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                     {upcomingEvents.length} results
                   </span>
                </div>

                {upcomingEvents.length === 0 ? (
                    <div className="py-20 text-center bg-white border border-dashed border-gray-200 rounded-2xl">
                      <div className="text-4xl mb-4">🔍</div>
                      <p className="text-gray-900 font-bold mb-1">No events found</p>
                      <p className="text-gray-500 text-sm mb-4">Try changing your filters.</p>
                      <button
                        onClick={handleFilterClear}
                        className="text-sm font-bold text-[color:var(--secondary-color)] hover:underline"
                      >
                        Clear all filters
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                      {upcomingEvents.map((event) => (
                        <EventCard
                          key={event.event_id}
                          title={event.name}
                          date={event.date}
                          time={event.time}
                          location={event.venue}
                          imageSrc={event.profile}
                          eventId={event.event_id}
                          organizer={event.organizer}
                          price={event.price}
                          category={event.category}
                          isPremium={event.isPremium}
                          className="hover:shadow-md transition-shadow bg-white"
                        />
                      ))}
                    </div>
                  )}
              </div>
            </div>

            {/* Mobile Filter Button removed in favor of inline dropdown */}

          </div>
        </div>
      </div>
      
      {/* PWA Install Banner */}
      <InstallAppButton variant="banner" />
    </div>
  );
}

export default UserDashboard;
