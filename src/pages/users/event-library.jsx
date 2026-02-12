import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import UserNavBar from "@/components/UserNavBar";
import EventCard from "@/components/EventCard";
import BackButton from "@/components/BackButton";
import { getUserToken } from "@/utils/getUserToken";
import { API_URL } from "@/utils/config";
import { FiCalendar, FiClock, FiArchive, FiRadio } from "react-icons/fi";

export default function EventLibrary() {
  const router = useRouter();
  const userId = getUserToken();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [events, setEvents] = useState({ upcoming: [], live: [], past: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      router.push("/users/signin");
      return;
    }

    const fetchEvents = async () => {
      try {
        const res = await fetch(`${API_URL}/events/user-events`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_token: userId }),
        });
        if (res.ok) {
          const data = await res.json();
          setEvents(data);
        }
      } catch (error) {
        console.error("Failed to fetch events", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [userId, router]);

  const EmptyState = ({ type }) => (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
        {type === "past" ? (
          <FiArchive className="w-10 h-10 text-gray-300" />
        ) : (
          <FiCalendar className="w-10 h-10 text-gray-300" />
        )}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        No {type} events
      </h3>
      <p className="text-gray-500 max-w-sm">
        {type === "past"
          ? "You haven't attended any events yet."
          : "You haven't registered for any upcoming events."}
      </p>
      {type !== "past" && (
        <button
          onClick={() => router.push("/users/dashboard")}
          className="mt-6 px-6 py-2.5 bg-[color:var(--primary-color)] text-white font-bold rounded-full hover:shadow-lg transition-all"
        >
          Explore Events
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-white pb-20">
      <UserNavBar />
      
      <div className="container mx-auto px-4 pt-6 lg:pt-8 max-w-7xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 heading-font">
              Event Library
            </h1>
            <p className="text-gray-500 mt-1">
              Your personal collection of tickets and memories
            </p>
          </div>

          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1 shadow-inner border border-gray-200">
            <button
              onClick={() => setActiveTab("upcoming")}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === "upcoming"
                  ? "bg-[color:var(--secondary-color)] text-white shadow-md"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Upcoming & Live
            </button>
            <button
              onClick={() => setActiveTab("past")}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === "past"
                  ? "bg-[color:var(--secondary-color)] text-white shadow-md"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Past Events
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="animate-fade-in">
            {activeTab === "upcoming" ? (
              <div className="space-y-12">
                {/* Live Events Section */}
                {events.live && events.live.length > 0 && (
                  <section>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        Happening Now
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {events.live.map((event) => (
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
                          className="shadow-lg border-red-100 ring-1 ring-red-50"
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* Upcoming Events Section */}
                <section>
                  <div className="flex items-center gap-3 mb-6">
                    <FiClock className="text-xl text-[color:var(--secondary-color)]" />
                    <h2 className="text-2xl font-bold text-gray-900">
                      Upcoming
                    </h2>
                  </div>
                  {events.upcoming.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {events.upcoming.map((event) => (
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
                        />
                      ))}
                    </div>
                  ) : (
                    !events.live?.length && <EmptyState type="upcoming" />
                  )}
                </section>
              </div>
            ) : (
              /* Past Events Tab */
              <section>
                {events.past.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-75 hover:opacity-100 transition-opacity">
                    {events.past.map((event) => (
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
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState type="past" />
                )}
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
