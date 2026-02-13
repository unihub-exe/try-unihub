import UserNavBar from "@/components/UserNavBar";
import { getUserToken } from "@/utils/getUserToken";
import { getAdminToken } from "@/utils/getAdminToken";
import { useRouter } from "next/router";
import { useEffect, useState, useCallback } from "react";
import io from "socket.io-client";
import Head from "next/head";
import { 
    FiEdit, FiUsers, FiBarChart2, FiCheckSquare, FiTrash2, 
    FiSave, FiArrowLeft, FiMapPin, FiCalendar, FiClock, FiPlus, FiX, FiTag, FiHelpCircle, FiStar 
} from "react-icons/fi";
import Link from "next/link";
import { API_URL } from "@/utils/config";

export default function ManageEventPage() {
    const router = useRouter();
    const { eventId } = router.query;
    const userToken = getUserToken();
    const adminToken = getAdminToken();
    
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("details"); // details, attendees, checkin, tickets, questions
    const [message, setMessage] = useState({ type: "", text: "" });
    const [forbidden, setForbidden] = useState(false);
    
    // Form State
    const [form, setForm] = useState({
        name: "", venue: "", address: "", lat: 0, lng: 0,
        date: "", time: "", description: "", price: 0,
        profile: "", cover: "", organizer: "", capacity: 0,
        ticketTypes: [], registrationQuestions: [],
        visibility: "public",
        requiresApproval: false,
        waitlistEnabled: false,
        hideLocation: false,
        isPremium: false,
    });

    // Fetch Event Data
    const fetchEvent = useCallback(async () => {
        if (!eventId) return;
        try {
            const res = await fetch(`${API_URL}/event/getevent`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event_id: eventId }),
            });
            if (!res.ok) throw new Error("Failed to fetch");
            
            const ev = await res.json();
            setEvent(ev);
            
            // Populate form
            setForm({
                name: ev.name || "",
                venue: ev.venue || "",
                address: ev.address || "",
                lat: typeof ev.lat === "number" ? ev.lat : 0,
                lng: typeof ev.lng === "number" ? ev.lng : 0,
                date: ev.date || "",
                time: ev.time || "",
                description: ev.description || "",
                price: ev.price || 0,
                profile: ev.profile || "",
                cover: ev.cover || "",
                organizer: ev.organizer || "",
                capacity: typeof ev.capacity === "number" ? ev.capacity : 0,
                ticketTypes: ev.ticketTypes || [],
                registrationQuestions: ev.registrationQuestions || [],
                visibility: ev.visibility || "public",
                requiresApproval: ev.requiresApproval || false,
                waitlistEnabled: ev.waitlistEnabled || false,
                hideLocation: ev.hideLocation || false,
                isPremium: ev.isPremium || false,
            });

            // Check permission
            const tokenStr = adminToken || userToken;
            if (!tokenStr || (ev.ownerId && ev.ownerId !== tokenStr && !adminToken)) {
                setForbidden(true);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [eventId, userToken, adminToken]);

    useEffect(() => {
        fetchEvent();
    }, [fetchEvent]);

    // Socket for Real-time Updates
    useEffect(() => {
        if (!eventId) return;
        const socket = io(API_URL, {
            transports: ["websocket", "polling"],
            withCredentials: true
        });

        socket.on("participant_updated", (data) => {
            if (data.eventId === eventId) fetchEvent();
        });

        return () => socket.disconnect();
    }, [eventId, fetchEvent]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    // Ticket Management
    const addTicketType = () => {
        setForm(prev => ({
            ...prev,
            ticketTypes: [...prev.ticketTypes, { name: "", price: 0, capacity: 100, description: "" }]
        }));
    };

    const updateTicketType = (index, field, value) => {
        const newTickets = [...form.ticketTypes];
        newTickets[index][field] = value;
        setForm(prev => ({ ...prev, ticketTypes: newTickets }));
    };

    const removeTicketType = (index) => {
        setForm(prev => ({
            ...prev,
            ticketTypes: prev.ticketTypes.filter((_, i) => i !== index)
        }));
    };

    // Question Management
    const addQuestion = () => {
        setForm(prev => ({
            ...prev,
            registrationQuestions: [...prev.registrationQuestions, { question: "", type: "text", required: false }]
        }));
    };

    const updateQuestion = (index, field, value) => {
        const newQuestions = [...form.registrationQuestions];
        newQuestions[index][field] = value;
        setForm(prev => ({ ...prev, registrationQuestions: newQuestions }));
    };

    const removeQuestion = (index) => {
        setForm(prev => ({
            ...prev,
            registrationQuestions: prev.registrationQuestions.filter((_, i) => i !== index)
        }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setMessage({ type: "info", text: "Saving..." });
        
        const payload = { event_id: eventId, update: form };
        if (adminToken) payload.admin_id = adminToken;
        if (userToken) payload.user_token = userToken;

        try {
            const res = await fetch(`${API_URL}/event/update`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            
            if (res.ok) {
                setMessage({ type: "success", text: "Changes saved successfully!" });
                setTimeout(() => setMessage({ type: "", text: "" }), 3000);
                await fetchEvent(); // Refresh data to ensure consistency
            } else {
                const data = await res.json();
                setMessage({ type: "error", text: data.msg || "Update failed" });
            }
        } catch (err) {
            setMessage({ type: "error", text: "Network error" });
        }
    };

    const handleCheckIn = async (pid) => {
        try {
            const res = await fetch(`${API_URL}/event/checkin`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event_id: eventId, checkInList: [pid] }),
            });
            if (res.ok) {
                setEvent((prev) => ({
                    ...prev,
                    participants: prev.participants.map((p) => (p.id === pid ? { ...p, entry: true } : p)),
                }));
            }
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    if (forbidden) return <div className="min-h-screen flex items-center justify-center text-red-500 font-bold">Access Denied</div>;
    if (!event) return <div className="min-h-screen flex items-center justify-center">Event not found</div>;

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-slate-900 pb-20">
            <Head>
                <title>Manage: {event.name} | UniHub</title>
            </Head>
            <UserNavBar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
                {/* Header */}
                <div className="bg-white rounded-3xl p-8 shadow-lg shadow-gray-200/50 border border-gray-100 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[color:var(--secondary-color)]/10 to-transparent rounded-full -mr-16 -mt-32 blur-3xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2 font-medium">
                            <Link href="/users/dashboard" className="hover:text-[color:var(--secondary-color)] transition-colors flex items-center gap-1">
                                <FiArrowLeft /> Dashboard
                            </Link>
                            <span className="text-gray-300">/</span>
                            <span className="text-gray-900">Manage Event</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-3">{event.name}</h1>
                        <p className="text-gray-500 flex flex-wrap items-center gap-4 text-sm font-bold">
                            <span className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 text-gray-600">
                                <FiCalendar className="text-[color:var(--secondary-color)]" /> {event.date}
                            </span>
                            <span className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 text-gray-600">
                                <FiMapPin className="text-[color:var(--secondary-color)]" /> {event.venue}
                            </span>
                            {event.isPremium && (
                                <span className="flex items-center gap-2 bg-yellow-50 px-3 py-1.5 rounded-lg border border-yellow-100 text-yellow-700">
                                    <FiStar className="fill-current" /> Premium
                                </span>
                            )}
                        </p>
                    </div>
                    <div className="flex gap-3 relative z-10">
                        <Link href={`/event/${eventId}`} className="px-6 py-3 bg-white border-2 border-gray-100 text-sm text-gray-700 rounded-xl hover:border-[color:var(--secondary-color)] hover:text-[color:var(--secondary-color)] font-bold transition-all shadow-sm flex items-center gap-2">
                             View Public Page
                        </Link>
                        <button onClick={handleSave} className="px-6 py-3 bg-[color:var(--secondary-color)] text-sm text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-1 font-bold transition-all flex items-center gap-2">
                            <FiSave className="text-lg" /> Save Changes
                        </button>
                    </div>
                </div>

                {message.text && (
                    <div className={`mb-8 p-4 rounded-2xl flex items-center justify-between shadow-lg animate-fade-in-up border-l-4 ${message.type === 'error' ? 'bg-red-50 text-red-700 border-red-500 border-l-red-500' : 'bg-green-50 text-green-700 border-green-500 border-l-green-500'}`}>
                        <div className="flex items-center gap-3">
                             <div className={`w-8 h-8 rounded-full flex items-center justify-center ${message.type === 'error' ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                                {message.type === 'error' ? <FiX /> : <FiCheckSquare />}
                             </div>
                            <span className="font-bold">{message.text}</span>
                        </div>
                        <button onClick={() => setMessage({ type: "", text: "" })} className="p-2 hover:bg-black/5 rounded-full transition-colors"><FiX /></button>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Sidebar Navigation */}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-3xl shadow-lg shadow-gray-200/50 border border-gray-100 overflow-hidden sticky top-28">
                            <div className="p-4 bg-gray-50 border-b border-gray-100">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Event Management</p>
                            </div>
                            <nav className="flex flex-col p-3 gap-1">
                                {[
                                    { id: 'details', icon: FiEdit, label: 'Details' },
                                    { id: 'tickets', icon: FiTag, label: 'Ticket Types' },
                                    { id: 'questions', icon: FiHelpCircle, label: 'Questions' },
                                    { id: 'attendees', icon: FiUsers, label: 'Attendees', count: event.participants?.length },
                                    { id: 'checkin', icon: FiCheckSquare, label: 'Check-in' },
                                ].map((item) => (
                                    <button 
                                        key={item.id}
                                        onClick={() => setActiveTab(item.id)}
                                        className={`flex items-center gap-3 px-4 py-3.5 text-left font-bold rounded-xl transition-all ${activeTab === item.id ? 'bg-[color:var(--secondary-color)] text-white shadow-md shadow-blue-500/20' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                                    >
                                        <item.icon className={`text-lg ${activeTab === item.id ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`} /> 
                                        {item.label}
                                        {item.count !== undefined && (
                                            <span className={`ml-auto px-2 py-0.5 rounded-md text-xs font-bold ${activeTab === item.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                                {item.count}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-9 space-y-6">
                        {activeTab === "details" && (
                            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 animate-fadeIn">
                                <h2 className="text-2xl font-black text-gray-900 mb-6 pb-4 border-b border-gray-100 flex items-center gap-2">
                                    <FiEdit className="text-[color:var(--secondary-color)]" /> Edit Details
                                </h2>
                                <form onSubmit={handleSave} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Event Name</label>
                                            <input type="text" name="name" value={form.name} onChange={handleChange} className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:border-[color:var(--secondary-color)] focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Organizer Name</label>
                                            <input type="text" name="organizer" value={form.organizer} onChange={handleChange} className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:border-[color:var(--secondary-color)] focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Date</label>
                                            <input type="text" name="date" value={form.date} onChange={handleChange} className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:border-[color:var(--secondary-color)] focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium" placeholder="DD/MM/YYYY" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Time</label>
                                            <input type="text" name="time" value={form.time} onChange={handleChange} className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:border-[color:var(--secondary-color)] focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Venue</label>
                                            <input type="text" name="venue" value={form.venue} onChange={handleChange} className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:border-[color:var(--secondary-color)] focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                                            <textarea name="description" value={form.description} onChange={handleChange} rows={5} className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:border-[color:var(--secondary-color)] focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium resize-none"></textarea>
                                        </div>
                                        
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-bold text-gray-700 mb-3">Settings</label>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                <label className="flex items-center gap-3 cursor-pointer p-4 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-[color:var(--secondary-color)] transition-all bg-white group">
                                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${form.requiresApproval ? 'bg-[color:var(--secondary-color)] border-[color:var(--secondary-color)]' : 'border-gray-300'}`}>
                                                        {form.requiresApproval && <FiCheckSquare className="text-white text-xs" />}
                                                    </div>
                                                    <input type="checkbox" name="requiresApproval" checked={form.requiresApproval} onChange={handleChange} className="hidden" />
                                                    <span className="text-sm font-bold text-gray-600 group-hover:text-gray-900">Approval Required</span>
                                                </label>
                                                <label className="flex items-center gap-3 cursor-pointer p-4 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-[color:var(--secondary-color)] transition-all bg-white group">
                                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${form.waitlistEnabled ? 'bg-[color:var(--secondary-color)] border-[color:var(--secondary-color)]' : 'border-gray-300'}`}>
                                                        {form.waitlistEnabled && <FiCheckSquare className="text-white text-xs" />}
                                                    </div>
                                                    <input type="checkbox" name="waitlistEnabled" checked={form.waitlistEnabled} onChange={handleChange} className="hidden" />
                                                    <span className="text-sm font-bold text-gray-600 group-hover:text-gray-900">Waitlist</span>
                                                </label>
                                                <label className="flex items-center gap-3 cursor-pointer p-4 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-[color:var(--secondary-color)] transition-all bg-white group">
                                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${form.hideLocation ? 'bg-[color:var(--secondary-color)] border-[color:var(--secondary-color)]' : 'border-gray-300'}`}>
                                                        {form.hideLocation && <FiCheckSquare className="text-white text-xs" />}
                                                    </div>
                                                    <input type="checkbox" name="hideLocation" checked={form.hideLocation} onChange={handleChange} className="hidden" />
                                                    <span className="text-sm font-bold text-gray-600 group-hover:text-gray-900">Hide Location</span>
                                                </label>
                                                
                                                <div className="flex items-center justify-center p-4 border rounded-xl border-yellow-200 bg-yellow-50/50">
                                                    {form.isPremium ? (
                                                        <span className="flex items-center gap-2 text-sm font-bold text-yellow-800">
                                                            <FiStar className="fill-current" /> Premium Active
                                                        </span>
                                                    ) : (
                                                        <button 
                                                            type="button"
                                                            onClick={() => router.push(`/event/${eventId}/premium_payment`)}
                                                            className="flex items-center gap-2 text-sm font-bold text-yellow-700 hover:text-yellow-900 transition-colors"
                                                        >
                                                            <FiStar /> Upgrade
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        )}

                        {activeTab === "tickets" && (
                            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 animate-fadeIn">
                                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                                    <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                                        <FiTag className="text-[color:var(--secondary-color)]" /> Ticket Types
                                    </h2>
                                    <button onClick={addTicketType} className="flex items-center gap-2 px-4 py-2 bg-[color:var(--secondary-color)]/10 text-[color:var(--secondary-color)] rounded-xl hover:bg-[color:var(--secondary-color)]/20 font-bold text-sm transition-colors">
                                        <FiPlus /> Add Ticket
                                    </button>
                                </div>
                                <div className="space-y-6">
                                    {form.ticketTypes.map((ticket, index) => (
                                        <div key={index} className="p-6 rounded-2xl border border-gray-200 bg-gray-50 hover:bg-white hover:border-[color:var(--secondary-color)] hover:shadow-lg hover:shadow-blue-500/5 transition-all relative group">
                                            <button 
                                                onClick={() => removeTicketType(index)}
                                                className="absolute top-4 right-4 p-2 bg-white rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shadow-sm opacity-0 group-hover:opacity-100"
                                                title="Remove Ticket Type"
                                            >
                                                <FiTrash2 />
                                            </button>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pr-8">
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Ticket Name</label>
                                                    <input 
                                                        type="text" 
                                                        value={ticket.name} 
                                                        onChange={(e) => updateTicketType(index, "name", e.target.value)}
                                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[color:var(--secondary-color)] focus:ring-2 focus:ring-blue-500/10 outline-none text-sm font-bold"
                                                        placeholder="e.g. Early Bird"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Price (₦)</label>
                                                        <input 
                                                            type="number" 
                                                            value={ticket.price} 
                                                            onChange={(e) => updateTicketType(index, "price", parseFloat(e.target.value))}
                                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[color:var(--secondary-color)] focus:ring-2 focus:ring-blue-500/10 outline-none text-sm font-bold"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Quantity</label>
                                                        <input 
                                                            type="number" 
                                                            value={ticket.capacity} 
                                                            onChange={(e) => updateTicketType(index, "capacity", parseInt(e.target.value))}
                                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[color:var(--secondary-color)] focus:ring-2 focus:ring-blue-500/10 outline-none text-sm font-bold"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description</label>
                                                    <input 
                                                        type="text" 
                                                        value={ticket.description} 
                                                        onChange={(e) => updateTicketType(index, "description", e.target.value)}
                                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[color:var(--secondary-color)] focus:ring-2 focus:ring-blue-500/10 outline-none text-sm"
                                                        placeholder="Brief description of this ticket type"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {form.ticketTypes.length === 0 && (
                                        <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                            <FiTag className="mx-auto text-4xl text-gray-300 mb-3" />
                                            <p className="text-gray-500 font-medium">No ticket types defined yet.</p>
                                            <button onClick={addTicketType} className="mt-4 text-[color:var(--secondary-color)] font-bold hover:underline">
                                                Create your first ticket
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === "questions" && (
                            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 animate-fadeIn">
                                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                                    <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                                        <FiHelpCircle className="text-[color:var(--secondary-color)]" /> Registration Questions
                                    </h2>
                                    <button onClick={addQuestion} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-[color:var(--secondary-color)] rounded-xl hover:bg-blue-100 font-bold text-sm transition-colors">
                                        <FiPlus /> Add Question
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {form.registrationQuestions.map((q, index) => (
                                        <div key={index} className="p-6 rounded-2xl border border-gray-200 bg-gray-50 hover:bg-white hover:border-[color:var(--secondary-color)] hover:shadow-lg hover:shadow-blue-500/5 transition-all relative group">
                                            <button 
                                                onClick={() => removeQuestion(index)}
                                                className="absolute top-4 right-4 p-2 bg-white rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shadow-sm opacity-0 group-hover:opacity-100"
                                            >
                                                <FiTrash2 />
                                            </button>
                                            <div className="pr-8 space-y-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Question</label>
                                                    <input 
                                                        type="text" 
                                                        value={q.question} 
                                                        onChange={(e) => updateQuestion(index, "question", e.target.value)}
                                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[color:var(--secondary-color)] focus:ring-2 focus:ring-blue-500/10 outline-none text-sm font-medium"
                                                        placeholder="e.g. Dietary restrictions?"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${q.required ? 'bg-[color:var(--secondary-color)] border-[color:var(--secondary-color)]' : 'border-gray-300 bg-white'}`}>
                                                            {q.required && <FiCheckSquare className="text-white text-xs" />}
                                                        </div>
                                                        <input 
                                                            type="checkbox" 
                                                            checked={q.required} 
                                                            onChange={(e) => updateQuestion(index, "required", e.target.checked)}
                                                            className="hidden"
                                                        />
                                                        <span className="text-sm font-bold text-gray-700">Required</span>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {form.registrationQuestions.length === 0 && (
                                        <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                            <FiHelpCircle className="mx-auto text-4xl text-gray-300 mb-3" />
                                            <p className="text-gray-500 font-medium">No custom questions added.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === "attendees" && (
                            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 animate-fadeIn">
                                <h2 className="text-2xl font-black text-gray-900 mb-6 pb-4 border-b border-gray-100 flex justify-between items-center">
                                    <span className="flex items-center gap-2"><FiUsers className="text-[color:var(--secondary-color)]" /> Attendees</span>
                                    <span className="text-sm font-bold bg-gray-100 px-3 py-1 rounded-lg text-gray-600">{event.participants?.length || 0} registered</span>
                                </h2>
                                
                                {event.participants && event.participants.length > 0 ? (
                                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                                        <table className="w-full text-left">
                                            <thead className="bg-gray-50">
                                                <tr className="text-xs uppercase text-gray-500 font-bold tracking-wider">
                                                    <th className="py-4 px-6">Name</th>
                                                    <th className="py-4 px-6">Email</th>
                                                    <th className="py-4 px-6">Status</th>
                                                    <th className="py-4 px-6">Ticket</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 bg-white">
                                                {event.participants.map((p, i) => (
                                                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                                                        <td className="py-4 px-6 font-bold text-gray-900">{p.name || "N/A"}</td>
                                                        <td className="py-4 px-6 text-gray-600 font-medium">{p.email || "N/A"}</td>
                                                        <td className="py-4 px-6">
                                                            {p.entry ? (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                                                    <div className="w-2 h-2 rounded-full bg-green-500"></div> Checked In
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                                                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div> Registered
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="py-4 px-6 text-gray-600 font-medium">{p.pass || "-"}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-16 text-gray-500">
                                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <FiUsers className="text-4xl text-gray-300" />
                                        </div>
                                        <p className="font-bold text-lg text-gray-900">No attendees yet</p>
                                        <p className="text-sm">Share your event to start getting registrations!</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === "checkin" && (
                            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 animate-fadeIn">
                                <h2 className="text-2xl font-black text-gray-900 mb-6 pb-4 border-b border-gray-100 flex items-center gap-2">
                                    <FiCheckSquare className="text-[color:var(--secondary-color)]" /> Manual Check-in
                                </h2>
                                {event.participants && event.participants.length > 0 ? (
                                    <div className="space-y-3">
                                        {event.participants.filter(p => !p.entry).map((p, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all group">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-[color:var(--secondary-color)]/10 text-[color:var(--secondary-color)] flex items-center justify-center font-bold text-lg">
                                                        {p.name ? p.name.charAt(0).toUpperCase() : "?"}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900">{p.name}</p>
                                                        <p className="text-xs font-bold text-gray-500">{p.email}</p>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => handleCheckIn(p.id)}
                                                    className="px-4 py-2 bg-green-500 text-white text-sm font-bold rounded-xl hover:bg-green-600 transition-colors shadow-lg shadow-green-200 hover:shadow-green-300 hover:-translate-y-0.5"
                                                >
                                                    Check In
                                                </button>
                                            </div>
                                        ))}
                                        {event.participants.filter(p => !p.entry).length === 0 && (
                                            <div className="text-center py-12">
                                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                                                    <FiCheckSquare className="text-3xl" />
                                                </div>
                                                <p className="font-bold text-gray-900 text-lg">All Checked In!</p>
                                                <p className="text-gray-500">Every registered attendee has been checked in.</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <p className="text-gray-500">No participants to check in.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <style jsx global>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.4s ease-out forwards;
                }
            `}</style>
        </div>
    );
}