import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import UserNavBar from "@/components/UserNavBar";
import EventCard from "@/components/EventCard";
import TicketCard from "@/components/TicketCard";
import BackButton from "@/components/BackButton";
import { getUserToken } from "@/utils/getUserToken";
import { API_URL } from "@/utils/config";
import { FiCalendar, FiClock, FiArchive, FiRadio, FiGrid, FiCreditCard } from "react-icons/fi";

export default function EventLibrary() {
  const router = useRouter();
  const userId = getUserToken();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [viewMode, setViewMode] = useState("events"); // "events" or "tickets"
  const [events, setEvents] = useState({ upcoming: [], live: [], past: [] });
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [ticketFilter, setTicketFilter] = useState("all"); // "all", "free", "paid", or specific ticket type
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      router.push("/users/signin");
      return;
    }

    const fetchEvents = async () => {
      try {
        const res = await fetch(`${API_URL}/event/user-events`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_token: userId }),
        });
        if (res.ok) {
          const data = await res.json();
          setEvents(data);
          
          // Fetch tickets for upcoming and live events
          const allUpcomingEvents = [...(data.live || []), ...(data.upcoming || [])];
          fetchTicketsForEvents(allUpcomingEvents);
        }
      } catch (error) {
        console.error("Failed to fetch events", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchTicketsForEvents = async (eventsList) => {
      try {
        // Fetch user details to get registered events with ticket info
        const userRes = await fetch(`${API_URL}/user/details`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_token: userId }),
        });
        
        if (userRes.ok) {
          const userData = await userRes.json();
          const registeredEvents = userData.registeredEvents || [];
          
          // Match tickets with events
          const ticketsWithEvents = [];
          eventsList.forEach(event => {
            const registration = registeredEvents.find(reg => reg.event_id === event.event_id);
            if (registration && registration.participants) {
              registration.participants.forEach(participant => {
                ticketsWithEvents.push({
                  ...participant,
                  event: event,
                  eventId: event.event_id
                });
              });
            }
          });
          
          setTickets(ticketsWithEvents);
        }
      } catch (error) {
        console.error("Failed to fetch tickets", error);
      }
    };

    fetchEvents();
  }, [userId, router]);

  // Filter tickets when filter changes
  useEffect(() => {
    if (ticketFilter === "all") {
      setFilteredTickets(tickets);
    } else {
      setFilteredTickets(tickets.filter(ticket => {
        if (ticketFilter === "free") {
          return ticket.event.price === 0 || ticket.ticketType?.toLowerCase().includes("free");
        } else if (ticketFilter === "paid") {
          return ticket.event.price > 0;
        } else {
          return ticket.ticketType === ticketFilter;
        }
      }));
    }
  }, [tickets, ticketFilter]);

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

          {/* Tabs and View Toggle */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
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

            {/* View Mode Toggle - Only show for upcoming/live */}
            {activeTab === "upcoming" && (
              <div className="flex bg-gray-100 rounded-xl p-1 shadow-inner border border-gray-200">
                <button
                  onClick={() => setViewMode("events")}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                    viewMode === "events"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <FiGrid className="text-base" />
                  Events
                </button>
                <button
                  onClick={() => setViewMode("tickets")}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                    viewMode === "tickets"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <FiCreditCard className="text-base" />
                  Tickets ({tickets.length})
                </button>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="animate-fade-in">
            {activeTab === "upcoming" ? (
              viewMode === "tickets" ? (
                /* Tickets View */
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <FiCreditCard className="text-xl text-[color:var(--secondary-color)]" />
                      <h2 className="text-2xl font-bold text-gray-900">
                        Your Tickets
                      </h2>
                    </div>
                    
                    {/* Ticket Filter */}
                    {tickets.length > 0 && (
                      <select
                        value={ticketFilter}
                        onChange={(e) => setTicketFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-[color:var(--secondary-color)] focus:border-transparent outline-none"
                      >
                        <option value="all">All Tickets ({tickets.length})</option>
                        <option value="free">Free Tickets</option>
                        <option value="paid">Paid Tickets</option>
                        <option value="General Admission">General Admission</option>
                        <option value="VIP">VIP</option>
                        <option value="Premium">Premium</option>
                      </select>
                    )}
                  </div>
                  {filteredTickets.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredTickets.map((ticket, index) => (
                        <TicketCard
                          key={`${ticket.eventId}-${index}`}
                          ticket={ticket}
                          event={ticket.event}
                        />
                      ))}
                    </div>
                  ) : tickets.length > 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-2xl">
                      <FiCreditCard className="text-5xl text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-gray-900 mb-2">No tickets match this filter</h3>
                      <p className="text-gray-500 mb-6">Try selecting a different filter</p>
                      <button
                        onClick={() => setTicketFilter("all")}
                        className="px-6 py-2.5 bg-[color:var(--primary-color)] text-white font-bold rounded-full hover:shadow-lg transition-all"
                      >
                        Show All Tickets
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-20 bg-gray-50 rounded-2xl">
                      <FiCreditCard className="text-5xl text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-gray-900 mb-2">No Tickets Yet</h3>
                      <p className="text-gray-500 mb-6">Register for events to get your tickets here</p>
                      <button
                        onClick={() => router.push("/users/dashboard")}
                        className="px-6 py-2.5 bg-[color:var(--primary-color)] text-white font-bold rounded-full hover:shadow-lg transition-all"
                      >
                        Explore Events
                      </button>
                    </div>
                  )}
                </section>
              ) : (
                /* Events View */
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
              )
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
