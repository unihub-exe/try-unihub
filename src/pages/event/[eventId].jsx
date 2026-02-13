import UserNavBar from "@/components/UserNavBar";
import EventChat from "@/components/EventChat";
import ReportButton from "@/components/ReportButton";
import { getUserToken } from "@/utils/getUserToken";
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import {
  FiCalendar,
  FiClock,
  FiMapPin,
  FiUser,
  FiShare2,
  FiArrowLeft,
  FiCheckCircle,
  FiAlertCircle,
  FiShield,
  FiCopy,
  FiMessageCircle,
  FiArrowRight,
  FiInfo,
  FiLock,
} from "react-icons/fi";
import { LuWallet } from "react-icons/lu";
import { API_URL } from "@/utils/config";

function EventPage() {
  const router = useRouter();
  const eventId = router.query.eventId;
  const userId = getUserToken();
  const [eventData, setEventData] = useState(null);
  const [isUserRegistered, setIsUserRegistered] = useState(false);
  const [isWaitlisted, setIsWaitlisted] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [loadingCancel, setLoadingCancel] = useState(false);
  const [cancelMsg, setCancelMsg] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    if (router.query.feedback === "true") {
      setShowFeedback(true);
    }
  }, [router.query]);

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
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const ref =
          urlParams.get("ref") ||
          (document.referrer ? new URL(document.referrer).hostname : null);

        const response = await fetch(`${API_URL}/event/getevent`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            event_id: eventId,
            referral: ref,
          }),
        });
        if (response.ok) {
          const data = await response.json();
          setEventData(data);
          setIsUserRegistered(
            data.participants &&
              data.participants.some((participant) => participant.id === userId)
          );
          setIsWaitlisted(
            data.waitlist && data.waitlist.some((p) => p.userId === userId)
          );
          setIsPending(
            data.pendingParticipants &&
              data.pendingParticipants.some((p) => p.userId === userId)
          );
        } else {
          throw new Error(`${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.error("Error fetching event data:", error.message);
      }
    };
    if (eventId) fetchEvent();
  }, [eventId, userId]);

  const isFull =
    eventData?.capacity &&
    eventData?.participants &&
    eventData.participants.length >= eventData.capacity;

  const cancelRegistration = async () => {
    try {
      setLoadingCancel(true);
      const response = await fetch(`${API_URL}/payment/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: { user_id: userId },
          event: { event_id: eventId },
        }),
      });
      const data = await response.json();
      if (data.status === "success") {
        setIsUserRegistered(false);
        setEventData((prev) => ({
          ...prev,
          participants: (prev.participants || []).filter(
            (p) => p.id !== userId
          ),
        }));
        setCancelMsg("Registration cancelled.");
        setTimeout(() => setCancelMsg(""), 2500);
      } else if (data.status === "notregistered") {
        setCancelMsg("You are not registered for this event.");
        setTimeout(() => setCancelMsg(""), 2500);
      } else {
        setCancelMsg("Could not cancel. Please try again.");
        setTimeout(() => setCancelMsg(""), 2500);
      }
    } catch (e) {
      setCancelMsg("Network error. Please try again.");
      setTimeout(() => setCancelMsg(""), 2500);
    } finally {
      setLoadingCancel(false);
    }
  };

  if (!eventData || !eventData.cover)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 border-4 border-[color:var(--secondary-color)] border-t-transparent rounded-full animate-spin mb-4"></div>
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-slate-900 pb-20">
      <Head>
        <title>{eventData.name} | UniHub</title>
      </Head>
      <UserNavBar />

      {/* Hero Section */}
      <div className="relative h-[50vh] lg:h-[65vh] w-full bg-slate-900 overflow-hidden group">
        <Image
          src={eventData.cover}
          alt={eventData.name}
          fill
          className="object-cover opacity-80 group-hover:scale-105 transition-transform duration-1000"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-gray-900/20"></div>

        <div className="absolute inset-0 container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl flex flex-col justify-end pb-12 lg:pb-20">
          <button
            onClick={() => router.back()}
            className="absolute top-7 lg:top-12 left-4 sm:left-6 lg:left-8 px-5 py-2.5 bg-white/10 backdrop-blur-md text-white rounded-full text-sm font-bold hover:bg-white/20 transition-all flex items-center gap-2 border border-white/10 shadow-lg group-hover:-translate-x-1"
          >
            <FiArrowLeft /> Back
          </button>

          <div className="max-w-4xl animate-fade-in-up">
            <div className="flex flex-wrap gap-3 mb-6">
              <span className="px-4 py-1.5 bg-[color:var(--secondary-color)] text-white text-xs font-bold rounded-full uppercase tracking-wide shadow-lg shadow-blue-500/30 ring-2 ring-blue-400/20">
                {eventData.eventType || "Event"}
              </span>
              {isFull && (
                <span className="px-4 py-1.5 bg-red-500 text-white text-xs font-bold rounded-full uppercase tracking-wide shadow-lg shadow-red-500/30">
                  Sold Out
                </span>
              )}
              {eventData.category && (
                <span className="px-4 py-1.5 bg-white/10 backdrop-blur-md text-white text-xs font-bold rounded-full uppercase tracking-wide border border-white/20 hover:bg-white/20 transition-colors">
                  {eventData.category}
                </span>
              )}
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white tracking-tight mb-6 leading-none heading-font drop-shadow-sm">
              {eventData.name}
            </h1>

            <div className="flex flex-wrap gap-x-8 gap-y-4 text-white/90 text-sm sm:text-base font-medium">
              <div className="flex items-center gap-3 group/item">
                <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md border border-white/10 group-hover/item:bg-[color:var(--secondary-color)] transition-colors">
                  <FiCalendar className="text-white w-5 h-5" />
                </div>
                <span className="tracking-wide">{eventData.date}</span>
              </div>
              <div className="flex items-center gap-3 group/item">
                <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md border border-white/10 group-hover/item:bg-[color:var(--secondary-color)] transition-colors">
                  <FiClock className="text-white w-5 h-5" />
                </div>
                <span className="tracking-wide">{eventData.time}</span>
              </div>
              <div className="flex items-center gap-3 group/item">
                <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md border border-white/10 group-hover/item:bg-[color:var(--secondary-color)] transition-colors">
                  <FiMapPin className="text-white w-5 h-5" />
                </div>
                <span className="tracking-wide">
                  {eventData.hideLocation && !isUserRegistered
                    ? "Hidden Location"
                    : eventData.venue}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl -mt-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Column - Content */}
          <div className="lg:col-span-8 space-y-8">
            {/* Organizer Card */}
            <div className="flex items-center gap-5 p-6 bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:shadow-gray-200/40 transition-all transform hover:-translate-y-1">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center text-[color:var(--secondary-color)] text-3xl border border-blue-100 shadow-inner">
                <FiUser />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">
                  Organized by
                </p>
                <p className="text-xl font-bold text-gray-900 leading-none font-heading">
                  {eventData.organizer}
                </p>
              </div>
              {userId && eventData.ownerId === userId && (
                <button
                  onClick={() => router.push(`/event/${eventId}/manage`)}
                  className="px-6 py-3 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-all shadow-lg hover:shadow-gray-400/50 transform hover:-translate-y-0.5"
                >
                  Manage Event
                </button>
              )}
            </div>

            {/* Description */}
            <div className="bg-white rounded-[2rem] p-8 lg:p-10 shadow-xl shadow-gray-200/50 border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3 mb-8 font-heading">
                <div className="p-2.5 bg-blue-50 rounded-xl text-[color:var(--secondary-color)]">
                  <FiInfo />
                </div>
                About Event
              </h3>
              <div className="prose prose-lg prose-slate max-w-none text-gray-600 leading-relaxed">
                {eventData.description?.split("\n").map((paragraph, i) => (
                  <p key={i} className="mb-4 last:mb-0">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>

            {/* Location Map */}
            <div className="bg-white rounded-[2rem] p-8 lg:p-10 shadow-xl shadow-gray-200/50 border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3 mb-8 font-heading">
                <div className="p-2.5 bg-blue-50 rounded-xl text-[color:var(--secondary-color)]">
                  <FiMapPin />
                </div>
                Location
              </h3>
              <div className="rounded-3xl overflow-hidden shadow-lg border border-gray-100">
                {eventData.hideLocation && !isUserRegistered ? (
                  <div className="bg-gray-50 p-16 text-center">
                    <div className="mx-auto h-20 w-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-md">
                      <FiLock className="text-gray-400 text-3xl" />
                    </div>
                    <h4 className="font-bold text-gray-900 text-xl mb-3">
                      Location is Hidden
                    </h4>
                    <p className="text-gray-500 max-w-sm mx-auto leading-relaxed">
                      The exact location is hidden by the organizer. Register
                      for the event to view the full address.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-0">
                    <div className="relative w-full h-96 bg-gray-100">
                      <iframe
                        title="Event location"
                        className="w-full h-full border-0 grayscale hover:grayscale-0 transition-all duration-700"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        src={
                          eventData.lat && eventData.lng
                            ? `https://www.google.com/maps?q=${eventData.lat},${eventData.lng}&output=embed`
                            : `https://www.google.com/maps?q=${encodeURIComponent(
                                eventData.venue || ""
                              )}&output=embed`
                        }
                      />
                    </div>
                    <div className="p-6 bg-white flex flex-col sm:flex-row justify-between items-center gap-4">
                      <div>
                        <p className="font-bold text-gray-900 text-lg">
                          {eventData.venue}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          View on Google Maps for directions
                        </p>
                      </div>
                      <a
                        href={
                          eventData.lat && eventData.lng
                            ? `https://www.google.com/maps?q=${eventData.lat},${eventData.lng}`
                            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                eventData.venue || ""
                              )}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="px-6 py-3 bg-gray-50 text-gray-700 rounded-xl text-sm font-bold hover:bg-[color:var(--secondary-color)] hover:text-white transition-all flex items-center gap-2 border border-gray-200 hover:border-[color:var(--secondary-color)] shadow-sm"
                      >
                        Get Directions <FiArrowRight />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Share Section */}
            <div className="p-8 bg-gradient-to-br from-gray-50 to-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/50">
              <h4 className="font-bold text-gray-900 mb-6 text-center text-lg font-heading">
                Share this event with friends
              </h4>
              <div className="flex flex-wrap justify-center gap-4">
                <button
                  onClick={share}
                  className="px-6 py-3.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:border-[color:var(--secondary-color)] hover:text-[color:var(--secondary-color)] transition-all flex items-center gap-2 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                >
                  <FiShare2 className="text-lg" /> Share
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert("Link copied!");
                  }}
                  className="px-6 py-3.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:border-[color:var(--secondary-color)] hover:text-[color:var(--secondary-color)] transition-all flex items-center gap-2 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                >
                  <FiCopy className="text-lg" /> Copy Link
                </button>
                <a
                  href={`whatsapp://send?text=Check out this event: ${eventData.name} ${window.location.href}`}
                  className="px-6 py-3.5 bg-[#25D366] text-white rounded-xl font-bold text-sm hover:bg-[#1ebd59] transition-all flex items-center gap-2 shadow-lg shadow-green-200 hover:shadow-xl hover:shadow-green-300 transform hover:-translate-y-0.5"
                >
                  <FiMessageCircle className="text-lg" /> WhatsApp
                </a>
                {userId && eventData.ownerId !== userId && (
                  <ReportButton 
                    reportType="event"
                    reportedId={eventId}
                    reportedName={eventData.name}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Booking Card */}
          <div className="lg:col-span-4">
            <div className="sticky top-28 space-y-6">
              {/* Main Booking Card */}
              <div className="bg-white rounded-[2rem] p-8 shadow-2xl shadow-gray-200/60 border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[color:var(--secondary-color)] to-blue-400"></div>

                <div className="mb-8 pb-6 border-b border-gray-100">
                  <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-2">
                    Starting from
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black text-gray-900 tracking-tight">
                      {Number(eventData.price) === 0 || eventData.price === "0"
                        ? "Free"
                        : `₦${eventData.price}`}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {!isUserRegistered && !isWaitlisted && !isPending && (
                    <div className="space-y-4">
                      <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                        <FiCheckCircle className="text-[color:var(--secondary-color)]" />{" "}
                        Select Ticket
                      </h4>
                      {(eventData.ticketTypes &&
                      eventData.ticketTypes.length > 0
                        ? eventData.ticketTypes
                        : [
                            {
                              name: "General Admission",
                              price: eventData.price,
                            },
                          ]
                      ).map((ticket, idx) => (
                        <div
                          key={idx}
                          className="group p-5 border border-gray-200 rounded-2xl bg-white hover:border-[color:var(--secondary-color)] hover:shadow-lg hover:shadow-blue-500/10 transition-all cursor-pointer relative"
                          onClick={() =>
                            router.push(
                              `/event/${eventId}/payment?type=${encodeURIComponent(
                                ticket.name
                              )}&price=${ticket.price}`
                            )
                          }
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-gray-900 group-hover:text-[color:var(--secondary-color)] transition-colors text-lg">
                              {ticket.name}
                            </span>
                            <span className="font-bold text-[color:var(--secondary-color)] bg-blue-50 px-3 py-1 rounded-lg text-sm">
                              {Number(ticket.price) === 0
                                ? "Free"
                                : `₦${ticket.price}`}
                            </span>
                          </div>
                          {ticket.description && (
                            <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                              {ticket.description}
                            </p>
                          )}
                          <div className="mt-2 w-full py-2.5 bg-gray-50 text-gray-900 text-center rounded-xl font-bold text-sm group-hover:bg-[color:var(--secondary-color)] group-hover:text-white transition-all shadow-sm">
                            Select Ticket
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {isWaitlisted && (
                    <div className="p-6 bg-yellow-50 rounded-2xl border border-yellow-200 text-center animate-fade-in">
                      <div className="mx-auto w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 mb-4 shadow-sm">
                        <FiClock className="text-2xl" />
                      </div>
                      <h3 className="font-bold text-yellow-800 text-xl mb-1">
                        On Waitlist
                      </h3>
                      <p className="text-sm text-yellow-700">
                        You'll be notified if a spot opens up.
                      </p>
                    </div>
                  )}

                  {isPending && (
                    <div className="p-6 bg-blue-50 rounded-2xl border border-blue-200 text-center animate-fade-in">
                      <div className="mx-auto w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4 shadow-sm">
                        <FiClock className="text-2xl" />
                      </div>
                      <h3 className="font-bold text-blue-800 text-xl mb-1">
                        Approval Pending
                      </h3>
                      <p className="text-sm text-blue-700">
                        Your registration is being reviewed.
                      </p>
                    </div>
                  )}

                  {isUserRegistered && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="p-6 bg-green-50 rounded-2xl border border-green-200 text-center">
                        <div className="mx-auto w-14 h-14 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4 shadow-sm">
                          <FiCheckCircle className="text-2xl" />
                        </div>
                        <h3 className="font-bold text-green-800 text-xl mb-1">
                          You're Registered!
                        </h3>
                        <p className="text-sm text-green-700">
                          We're excited to see you there.
                        </p>
                      </div>

                      <a
                        href={`${API_URL}/event/wallet?event_id=${eventId}&user_token=${userId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      >
                        <LuWallet className="text-xl" />
                        Add to Apple Wallet
                      </a>

                      <button
                        onClick={cancelRegistration}
                        disabled={loadingCancel}
                        className="w-full py-3.5 bg-white border border-red-100 text-red-600 hover:bg-red-50 rounded-xl font-semibold transition-colors text-sm"
                      >
                        {loadingCancel
                          ? "Cancelling..."
                          : "Cancel Registration"}
                      </button>
                    </div>
                  )}

                  {cancelMsg && (
                    <div className="p-4 bg-red-50 text-red-600 text-sm font-bold rounded-xl flex items-center gap-3 animate-fade-in border border-red-100">
                      <FiAlertCircle className="text-lg" /> {cancelMsg}
                    </div>
                  )}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                  <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
                    <FiShield className="text-gray-300" /> Secure payment
                    powered by Stripe
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Chat Float */}
      {(isUserRegistered || eventData.ownerId === userId) && (
        <div className="fixed bottom-6 right-6 z-40">
          <EventChat
            eventId={eventId}
            eventName={eventData.name}
            userId={userId}
            userName={"User"}
            organizerId={eventData.ownerId}
          />
        </div>
      )}
    </div>
  );
}

export default EventPage;
