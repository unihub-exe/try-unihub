import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import UserNavBar from "@/components/UserNavBar";
import { getUserToken } from "@/utils/getUserToken";
import { API_URL } from "@/utils/config";
import { FiCheckCircle, FiX, FiAlertCircle, FiArrowLeft } from "react-icons/fi";
import Link from "next/link";

export default function QRScanner() {
    const router = useRouter();
    const { eventId } = router.query;
    const [event, setEvent] = useState(null);
    const [scanning, setScanning] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });
    const [manualCode, setManualCode] = useState("");
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (!eventId) return;
        
        const fetchEvent = async () => {
            try {
                const res = await fetch(`${API_URL}/event/getevent`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ event_id: eventId }),
                });
                if (res.ok) {
                    const data = await res.json();
                    setEvent(data);
                }
            } catch (error) {
                console.error("Error fetching event:", error);
            }
        };
        
        fetchEvent();
    }, [eventId]);

    const handleCheckIn = async (participantId) => {
        if (processing) return;
        
        setProcessing(true);
        setMessage({ type: "", text: "" });

        try {
            const res = await fetch(`${API_URL}/event/checkin`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    event_id: eventId, 
                    checkInList: [participantId] 
                }),
            });

            if (res.ok) {
                setMessage({ 
                    type: "success", 
                    text: "✅ Check-in successful!" 
                });
                
                // Refresh event data
                const eventRes = await fetch(`${API_URL}/event/getevent`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ event_id: eventId }),
                });
                if (eventRes.ok) {
                    const data = await eventRes.json();
                    setEvent(data);
                }
                
                setManualCode("");
            } else {
                const error = await res.json();
                setMessage({ 
                    type: "error", 
                    text: error.msg || "Check-in failed" 
                });
            }
        } catch (error) {
            console.error("Check-in error:", error);
            setMessage({ 
                type: "error", 
                text: "Network error. Please try again." 
            });
        } finally {
            setProcessing(false);
        }
    };

    const handleManualCheckIn = () => {
        if (!manualCode.trim()) {
            setMessage({ type: "error", text: "Please enter a ticket code" });
            return;
        }

        // Find participant by ticket code or ID
        const participant = event?.participants?.find(p => 
            p.id === manualCode.trim() || 
            p.ticketCode === manualCode.trim()
        );

        if (!participant) {
            setMessage({ type: "error", text: "Ticket not found" });
            return;
        }

        if (participant.entry) {
            setMessage({ type: "error", text: "Already checked in" });
            return;
        }

        handleCheckIn(participant.id);
    };

    const startQRScanner = () => {
        setMessage({ 
            type: "info", 
            text: "QR Scanner feature coming soon! Use manual check-in for now." 
        });
    };

    if (!event) {
        return (
            <div className="min-h-screen bg-gray-50">
                <UserNavBar />
                <div className="flex items-center justify-center h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[color:var(--secondary-color)] mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading...</p>
                    </div>
                </div>
            </div>
        );
    }

    const checkedInCount = event.participants?.filter(p => p.entry).length || 0;
    const totalParticipants = event.participants?.length || 0;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <UserNavBar />
            <Head>
                <title>QR Scanner - {event.name} | UniHub</title>
            </Head>

            <div className="container mx-auto px-4 py-8 max-w-2xl">
                {/* Header */}
                <div className="mb-6">
                    <Link href={`/event/${eventId}/manage`}>
                        <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors">
                            <FiArrowLeft /> Back to Manage
                        </button>
                    </Link>
                    <h1 className="text-3xl font-black text-gray-900 mb-2">QR Code Scanner</h1>
                    <p className="text-gray-600">{event.name}</p>
                    <div className="mt-3 flex items-center gap-4 text-sm">
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-bold">
                            {checkedInCount} / {totalParticipants} Checked In
                        </span>
                    </div>
                </div>

                {/* Message */}
                {message.text && (
                    <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
                        message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" :
                        message.type === "error" ? "bg-red-50 text-red-700 border border-red-200" :
                        "bg-blue-50 text-blue-700 border border-blue-200"
                    }`}>
                        {message.type === "success" && <FiCheckCircle className="text-xl" />}
                        {message.type === "error" && <FiAlertCircle className="text-xl" />}
                        <span className="flex-1">{message.text}</span>
                        <button onClick={() => setMessage({ type: "", text: "" })}>
                            <FiX />
                        </button>
                    </div>
                )}

                {/* QR Scanner Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Camera Scanner</h2>
                    <div className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center mb-4">
                        <div className="text-center">
                            <div className="text-6xl mb-4">📷</div>
                            <p className="text-gray-600 mb-4">QR Scanner Coming Soon</p>
                            <button
                                onClick={startQRScanner}
                                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-colors"
                            >
                                Enable Camera
                            </button>
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 text-center">
                        Point your camera at the attendee's QR code to check them in
                    </p>
                </div>

                {/* Manual Entry */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Manual Entry</h2>
                    <p className="text-sm text-gray-600 mb-4">
                        Enter the ticket code or participant ID manually
                    </p>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={manualCode}
                            onChange={(e) => setManualCode(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && handleManualCheckIn()}
                            placeholder="Enter ticket code or ID"
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[color:var(--secondary-color)] focus:border-transparent"
                        />
                        <button
                            onClick={handleManualCheckIn}
                            disabled={processing}
                            className="px-6 py-3 bg-[color:var(--secondary-color)] text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {processing ? "..." : "Check In"}
                        </button>
                    </div>
                </div>

                {/* Recent Check-ins */}
                {event.participants && event.participants.filter(p => p.entry).length > 0 && (
                    <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Check-ins</h2>
                        <div className="space-y-2">
                            {event.participants
                                .filter(p => p.entry)
                                .slice(-5)
                                .reverse()
                                .map((p, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                                        <FiCheckCircle className="text-green-600" />
                                        <div className="flex-1">
                                            <p className="font-bold text-gray-900">{p.name || "Guest"}</p>
                                            <p className="text-sm text-gray-600">{p.email || p.id}</p>
                                        </div>
                                        <span className="text-xs text-green-600 font-bold">✓ Checked In</span>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
