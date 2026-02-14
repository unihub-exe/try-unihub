import { getAdminToken } from "@/utils/getAdminToken";
import { getUserToken } from "@/utils/getUserToken";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import Image from "next/image";
import Confetti from "react-confetti";
import {
    FiUpload,
    FiMapPin,
    FiCalendar,
    FiDollarSign,
    FiUsers,
    FiTrash2,
    FiPlus,
    FiSettings,
    FiCheck,
    FiChevronRight,
    FiChevronLeft,
} from "react-icons/fi";
import { API_URL } from "@/utils/config";

const CreateEvent = () => {
    const router = useRouter();
    const admin_id = getAdminToken();
    const user_id = getUserToken();
    const [showConfetti, setShowConfetti] = useState(false);
    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        };
        handleResize(); // Set initial size
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const [formData, setFormData] = useState({
        name: "",
        venue: "",
        address: "",
        lat: "",
        lng: "",
        category: "",
        eventDate: "",
        startTime: "",
        endTime: "",
        profile: "",
        cover: "",
        description: "",
        ticketTypes: [
            { name: "General Admission", price: 0, capacity: 100, description: "" },
        ],
        registrationQuestions: [],
        visibility: "public",
        registrationToken: "",
        requiresApproval: false,
        waitlistEnabled: false,
        hideLocation: false,
        isPremium: false,
        repeatFrequency: "none",
        repeatCount: 2,
    });

    const [step, setStep] = useState(1);
    const [uploading, setUploading] = useState({ profile: false, cover: false });
    const apiUrl = API_URL;

    const uploadImage = async(field, file) => {
        if (!file) return;
        setUploading((prev) => ({...prev, [field]: true }));
        const fd = new FormData();
        fd.append("file", file);
        try {
            const res = await fetch(`${apiUrl}/upload/image`, {
                method: "POST",
                body: fd,
            });
            if (!res.ok) throw new Error(`${res.status}`);
            const json = await res.json();
            setFormData((f) => ({...f, [field]: json.url }));
        } catch (e) {
            console.error("Upload failed", e);
        } finally {
            setUploading((prev) => ({...prev, [field]: false }));
        }
    };

    const addTicketType = () => {
        setFormData((prev) => ({
            ...prev,
            ticketTypes: [
                ...prev.ticketTypes,
                { name: "", price: 0, capacity: 100, description: "" },
            ],
        }));
    };

    const updateTicketType = (index, field, value) => {
        const newTickets = [...formData.ticketTypes];
        newTickets[index][field] = value;
        setFormData((prev) => ({...prev, ticketTypes: newTickets }));
    };

    const removeTicketType = (index) => {
        const newTickets = formData.ticketTypes.filter((_, i) => i !== index);
        setFormData((prev) => ({...prev, ticketTypes: newTickets }));
    };

    const addQuestion = () => {
        setFormData((prev) => ({
            ...prev,
            registrationQuestions: [
                ...prev.registrationQuestions,
                { label: "", type: "text", required: false },
            ],
        }));
    };

    const updateQuestion = (index, field, value) => {
        const newQuestions = [...formData.registrationQuestions];
        newQuestions[index][field] = value;
        setFormData((prev) => ({...prev, registrationQuestions: newQuestions }));
    };

    const removeQuestion = (index) => {
        const newQuestions = formData.registrationQuestions.filter(
            (_, i) => i !== index
        );
        setFormData((prev) => ({...prev, registrationQuestions: newQuestions }));
    };

    const handleEventFormSubmit = async(e) => {
        e.preventDefault();

        // Format date and time for server request
        if (!formData.eventDate || !formData.startTime) {
            alert("Please provide event date and start time");
            return;
        }

        // Parse date (YYYY-MM-DD from input)
        const [year, month, day] = formData.eventDate.split('-');
        const date = `${day}/${month}/${year}`;
        
        // Format time to 12-hour format
        const formatTime = (time24) => {
            const [hours, minutes] = time24.split(':');
            const hour = parseInt(hours);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const hour12 = hour % 12 || 12;
            return `${hour12}:${minutes} ${ampm}`;
        };
        
        const time = formatTime(formData.startTime);
        
        // Format end date and time if provided
        let endDate, endTime;
        if (formData.endTime) {
            endDate = date; // Same day
            endTime = formatTime(formData.endTime);
        }

        // Calculate legacy price (lowest) and capacity (total)
        const minPrice =
            formData.ticketTypes.length > 0 ?
            Math.min(...formData.ticketTypes.map((t) => Number(t.price))) :
            0;
        const totalCapacity =
            formData.ticketTypes.length > 0 ?
            formData.ticketTypes.reduce((acc, t) => acc + Number(t.capacity), 0) :
            0;

        // Set up request body with form data and admin ID
        const requestBody={
            name: formData.name,
            venue: formData.venue,
            address: formData.address || undefined,
            lat: formData.lat ? Number(formData.lat) : undefined,
            lng: formData.lng ? Number(formData.lng) : undefined,

            date: date,
            time: time,
            endDate: endDate,
            endTime: endTime,
            description: formData.description,
            category: formData.category || undefined,
            price: minPrice,
            capacity: totalCapacity,
            ticketTypes: formData.ticketTypes,
            registrationQuestions: formData.registrationQuestions,
            profile: formData.profile !="" ? formData.profile : undefined,
            cover: formData.cover !="" ? formData.cover : undefined,
            visibility: formData.visibility,
            requiresApproval: formData.requiresApproval,
            waitlistEnabled: formData.waitlistEnabled,
            hideLocation: formData.hideLocation,
            registrationToken: formData.registrationToken,
            repeatFrequency: formData.repeatFrequency,
            repeatCount: formData.repeatCount,
            admin_id: admin_id,
            user_id: admin_id ? undefined : user_id,
            isPremium: false, // Ensure isPremium is false initially
        };

        try {
            const response = await fetch(`${apiUrl}/post/event`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestBody),
            });

            if (response.status === 200) {
                const data = await response.json();
                setShowConfetti(true);

                // Auto-post in community if communityId provided in query
                try {
                    const { communityId } = router.query || {};
                    if (communityId) {
                        await fetch(`${apiUrl}/community/post/create`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${getUserToken()}`
                            },
                            body: JSON.stringify({
                                content: `New event: ${formData.name}\nDate: ${date}\nTime: ${time}\nLocation: ${formData.venue}`,
                                image: formData.cover || formData.profile || "",
                                communityId,
                                authorId: user_id,
                                authorType: admin_id ? "Admin" : "User",
                                authorName: "" // server derives display
                            })
                        });
                    }
                } catch (postErr) {}

                setTimeout(() => {
                    if (formData.isPremium) {
                        // Redirect to premium payment if selected
                        router.push(`/event/${data.event_id}/premium_payment`);
                    } else {
                        if (admin_id) {
                            router.push("/admin/dashboard");
                        } else {
                            router.push("/users/dashboard");
                        }
                    }
                }, 3000);
            } else {
                console.error(`Failed with status code ${response.status}`);
            }
        } catch (error) {
            console.error("Error submitting form:", error);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const lookupAddress = async() => {
        try {
            const query = formData.venue;
            if (!query) return;
            const base = API_URL;
            const res = await fetch(
                `${base}/maps/search?q=${encodeURIComponent(query)}`
            );
            if (!res.ok) return;
            const json = await res.json();
            if (Array.isArray(json) && json.length > 0) {
                const top = json[0];
                setFormData((f) => ({
                    ...f,
                    venue: top.display_name || f.venue,
                    address: top.display_name || f.address,
                    lat: top.lat || f.lat,
                    lng: top.lon || f.lng,
                }));
            }
        } catch (e) {}
    };

    return ( <div className="relative font-sans"
        style={
            { fontFamily: '"Plus Jakarta Sans", sans-serif' } } >
        {
            showConfetti && ( <div className="fixed inset-0 z-50 pointer-events-none" ><Confetti recycle={ true }
                numberOfPieces={ 500 }
                width={ windowSize.width }
                height={ windowSize.height }/></div>
            )
        }

        <div className="bg-white border border-gray-100 shadow-2xl rounded-3xl overflow-hidden" ><div className="p-8" ><div className="mb-8" ><h1 className="text-3xl font-bold text-gray-900 mb-2"
        style={
            { fontFamily: "Outfit, sans-serif" } } >
        Create New Event </h1><p className="text-gray-500" >
        Fill in the details to publish your event. </p></div>

        { /* Stepper */ } <div className="flex items-center justify-between mb-10 relative" ><div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 -z-10 rounded-full" ></div><div className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-[color:var(--secondary-color)] -z-10 rounded-full transition-all duration-500"
        style={
            { width: `${((step - 1) / 3) * 100}%` } } ></div>

        {
            [1, 2, 3, 4].map((s) => ( <div key={ s }
                className={ `flex flex-col items-center gap-2 cursor-pointer transition-all duration-300 ${
                  s <= step ? "opacity-100" : "opacity-60"
                }` }
                onClick={
                    () => s <step && setStep(s) } ><div className={ `w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                    s === step
                      ? "bg-[color:var(--secondary-color)] text-white scale-110 shadow-lg ring-4 ring-blue-50"
                      : s <step
                      ? "bg-[color:var(--secondary-color)] text-white"
                      : "bg-white border-2 border-gray-200 text-gray-400"
                  }` } >
                { s <step ? <FiCheck/> : s } </div><span className={ `text-xs font-semibold hidden md:block ${
                    s === step
                      ? "text-[color:var(--secondary-color)]"
                      : "text-gray-400"
                  }` } >
                {
                    s === 1 ?
                    "Basics" :
                        s === 2 ?
                        "Schedule" :
                        s === 3 ?
                        "Tickets" :
                        "Media"
                } </span></div>
            ))
        } </div><form onSubmit={ handleEventFormSubmit }
        className="space-y-6 animate-fadeIn" >
        {
            step === 1 && ( <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn" ><div className="space-y-4" ><div ><label className="block text-sm font-semibold text-gray-700 mb-1" >
                Event Title </label><input type="text"
                name="name"
                value={ formData.name }
                onChange={ handleChange }
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[color:var(--secondary-color)] focus:ring-2 focus:ring-[color:var(--secondary-color)]/20 outline-none transition-all"
                placeholder="e.g. Annual Tech Conference 2024"
                required/></div><div ><label className="block text-sm font-semibold text-gray-700 mb-1" >
                Category </label><select name="category"
                value={ formData.category }
                onChange={ handleChange }
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[color:var(--secondary-color)] focus:ring-2 focus:ring-[color:var(--secondary-color)]/20 outline-none transition-all"
                required ><option value="" > Select Category </option> {
                    [
                        "Tech",
                        "Music",
                        "Sports",
                        "Workshops",
                        "Meetups",
                        "Festivals",
                        "Conferences",
                        "Competitions",
                    ].map((c) => ( <option key={ c }
                        value={ c } > { c } </option>
                    ))
                } </select></div></div><div className="space-y-4" ><div ><label className="block text-sm font-semibold text-gray-700 mb-1" >
                Venue Location </label><div className="flex gap-2" ><input type="text"
                name="venue"
                value={ formData.venue }
                onChange={ handleChange }
                className="flex-1 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[color:var(--secondary-color)] focus:ring-2 focus:ring-[color:var(--secondary-color)]/20 outline-none transition-all"
                placeholder="Search for a place..."
                required/><button type="button"
                onClick={ lookupAddress }
                className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-colors"
                title="Search Map" ><FiMapPin/></button></div> {
                    formData.address && ( <div className="mt-2 text-xs text-gray-500 flex items-start gap-1 bg-blue-50 p-2 rounded-lg" ><FiMapPin className="mt-0.5 text-blue-500 shrink-0"/> { formData.address } </div>
                    )
                } </div><div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100" ><input type="checkbox"
                id="hideLocation"
                checked={ formData.hideLocation }
                onChange={
                    (e) =>
                    setFormData({
                        ...formData,
                        hideLocation: e.target.checked,
                    })
                }
                className="w-5 h-5 rounded text-[color:var(--secondary-color)] focus:ring-[color:var(--secondary-color)]"/><label htmlFor="hideLocation"
                className="text-sm text-gray-700 cursor-pointer select-none" >
                Hide location until registration is approved </label></div></div></div>
            )
        }

        {
            step === 2 && ( <div className="space-y-6 animate-fadeIn" ><div className="grid grid-cols-1 md:grid-cols-2 gap-6" ><div ><label className="block text-sm font-semibold text-gray-700 mb-1" >
                Event Date </label><div className="relative" ><input type="date"
                name="eventDate"
                value={ formData.eventDate }
                onChange={ handleChange }
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[color:var(--secondary-color)] focus:ring-2 focus:ring-[color:var(--secondary-color)]/20 outline-none transition-all"
                required/><FiCalendar className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"/></div></div><div className="grid grid-cols-2 gap-4" ><div ><label className="block text-sm font-semibold text-gray-700 mb-1" >
                Start Time </label><input type="time"
                name="startTime"
                value={ formData.startTime }
                onChange={ handleChange }
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[color:var(--secondary-color)] focus:ring-2 focus:ring-[color:var(--secondary-color)]/20 outline-none transition-all"
                required/></div><div ><label className="block text-sm font-semibold text-gray-700 mb-1" >
                End Time <span className="text-xs text-gray-500">(Optional)</span></label><input type="time"
                name="endTime"
                value={ formData.endTime }
                onChange={ handleChange }
                min={ formData.startTime }
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[color:var(--secondary-color)] focus:ring-2 focus:ring-[color:var(--secondary-color)]/20 outline-none transition-all"/></div></div></div><div className="md:col-span-2 bg-gray-50 p-6 rounded-xl border border-gray-100" ><h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2" ><FiSettings/> Recurring Settings </h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-4" ><div ><label className="block text-xs font-medium text-gray-500 mb-1" >
                Frequency </label><select name="repeatFrequency"
                value={ formData.repeatFrequency }
                onChange={ handleChange }
                className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm focus:border-[color:var(--secondary-color)] outline-none" ><option value="none" > One - time Event </option><option value="daily" > Daily </option><option value="weekly" > Weekly </option><option value="monthly" > Monthly </option></select></div> {
                    formData.repeatFrequency !=="none" && ( <div ><label className="block text-xs font-medium text-gray-500 mb-1" >
                        Total Occurrences </label><input type="number"
                        name="repeatCount"
                        min="2"
                        max="10"
                        value={ formData.repeatCount }
                        onChange={ handleChange }
                        className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm focus:border-[color:var(--secondary-color)] outline-none"/></div>
                    )
                } </div></div></div>
            )
        }

        {
            step === 3 && ( <div className="space-y-6 animate-fadeIn" > { /* Tickets Section */ } <div ><div className="flex justify-between items-center mb-4" ><h3 className="text-lg font-bold text-gray-900" >
                Ticket Types </h3><button type="button"
                onClick={ addTicketType }
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-100 transition-colors" ><FiPlus/> Add Ticket </button></div><div className="space-y-3" > {
                    formData.ticketTypes.map((ticket, idx) => ( <div key={ idx }
                        className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow relative group" ><div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end" ><div className="md:col-span-4" ><label className="block text-xs font-medium text-gray-500 mb-1" >
                        Ticket Name </label><input type="text"
                        value={ ticket.name }
                        onChange={
                            (e) =>
                            updateTicketType(idx, "name", e.target.value)
                        }
                        className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm focus:border-[color:var(--secondary-color)] outline-none"
                        placeholder="General Admission"
                        required/></div><div className="md:col-span-2" ><label className="block text-xs font-medium text-gray-500 mb-1" >
                        Price </label><div className="relative" ><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" > ₦
                        </span><input type="number"
                        value={ ticket.price }
                        onChange={
                            (e) =>
                            updateTicketType(idx, "price", e.target.value)
                        }
                        className="w-full pl-6 pr-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm focus:border-[color:var(--secondary-color)] outline-none"
                        min="0"
                        required/></div></div><div className="md:col-span-2" ><label className="block text-xs font-medium text-gray-500 mb-1" >
                        Capacity </label><input type="number"
                        value={ ticket.capacity }
                        onChange={
                            (e) =>
                            updateTicketType(
                                idx,
                                "capacity",
                                e.target.value
                            )
                        }
                        className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm focus:border-[color:var(--secondary-color)] outline-none"
                        min="0"/></div><div className="md:col-span-3" ><label className="block text-xs font-medium text-gray-500 mb-1" >
                        Description </label><input type="text"
                        value={ ticket.description }
                        onChange={
                            (e) =>
                            updateTicketType(
                                idx,
                                "description",
                                e.target.value
                            )
                        }
                        className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm focus:border-[color:var(--secondary-color)] outline-none"
                        placeholder="Optional"/></div><div className="md:col-span-1 flex justify-end" > {
                            formData.ticketTypes.length > 1 && ( <button type="button"
                                onClick={
                                    () => removeTicketType(idx) }
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" ><FiTrash2/></button>
                            )
                        } </div></div></div>
                    ))
                } </div></div>

                { /* Advanced Settings */ } <div className="border-t border-gray-200 pt-6" ><h3 className="text-lg font-bold text-gray-900 mb-4" >
                Registration & Access </h3><div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-xl border border-gray-100" ><div ><label className="block text-sm font-semibold text-gray-700 mb-1" >
                Visibility </label><select name="visibility"
                value={ formData.visibility }
                onChange={ handleChange }
                className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm focus:border-[color:var(--secondary-color)] outline-none" ><option value="public" >
                Public(Visible to everyone) </option><option value="private" > Private(Link only) </option><option value="members_only" > Members Only </option></select></div><div ><label className="block text-sm font-semibold text-gray-700 mb-1" >
                Access Code(Optional) </label><input type="text"
                name="registrationToken"
                value={ formData.registrationToken }
                onChange={ handleChange }
                className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm focus:border-[color:var(--secondary-color)] outline-none"
                placeholder="e.g. VIP2024"/></div><div className="flex flex-col gap-3" ><label className="flex items-center gap-3 cursor-pointer" ><input type="checkbox"
                checked={ formData.requiresApproval }
                onChange={
                    (e) =>
                    setFormData({
                        ...formData,
                        requiresApproval: e.target.checked,
                    })
                }
                className="w-5 h-5 rounded text-[color:var(--secondary-color)] focus:ring-[color:var(--secondary-color)]"/><span className="text-sm text-gray-700" >
                Require approval
                for each registration </span></label><label className="flex items-center gap-3 cursor-pointer" ><input type="checkbox"
                checked={ formData.waitlistEnabled }
                onChange={
                    (e) =>
                    setFormData({
                        ...formData,
                        waitlistEnabled: e.target.checked,
                    })
                }
                className="w-5 h-5 rounded text-[color:var(--secondary-color)] focus:ring-[color:var(--secondary-color)]"/><span className="text-sm text-gray-700" >
                Enable waitlist when sold out </span></label><label className="flex items-center gap-3 cursor-pointer bg-yellow-50 p-3 rounded-lg border border-yellow-200" ><input type="checkbox"
                checked={ formData.isPremium }
                onChange={
                    (e) =>
                    setFormData({
                        ...formData,
                        isPremium: e.target.checked,
                    })
                }
                className="w-5 h-5 rounded text-yellow-500 focus:ring-yellow-500"/><div ><span className="block text-sm font-bold text-gray-900" >
                Promote this Event(Premium) </span><span className="text-xs text-gray-600" >
                Your event will be highlighted and appear at the top of feeds. </span></div></label></div></div></div></div>
            )
        }

        {
            step === 4 && ( <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fadeIn" ><div ><label className="block text-sm font-semibold text-gray-700 mb-2" >
                Profile Image </label><div className={ `relative h-48 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center transition-all ${
                      uploading.profile
                        ? "opacity-50"
                        : "hover:border-[color:var(--secondary-color)] hover:bg-blue-50"
                    }` } >
                {
                    formData.profile ? ( <Image src={ formData.profile }
                        alt="Profile"
                        fill className="object-cover rounded-xl"/>
                    ) : ( <div className="text-center p-4" ><FiUpload className="mx-auto text-2xl text-gray-400 mb-2"/><p className="text-sm text-gray-500" >
                        Click to upload or drag and drop </p></div>
                    )
                } <input type="file"
                accept="image/*"
                onChange={
                    (e) =>
                    uploadImage("profile", e.target.files ? .[0])
                }
                className="absolute inset-0 opacity-0 cursor-pointer"/> {
                    uploading.profile && ( <div className="absolute inset-0 flex items-center justify-center bg-white/50" ><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[color:var(--secondary-color)]" ></div></div>
                    )
                } </div> { /* Image URL input hidden - only upload allowed */ } <input type="hidden"
                name="profile"
                value={ formData.profile || "" }
                onChange={ handleChange }/></div><div ><label className="block text-sm font-semibold text-gray-700 mb-2" >
                Cover Image </label><div className={ `relative h-48 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center transition-all ${
                      uploading.cover
                        ? "opacity-50"
                        : "hover:border-[color:var(--secondary-color)] hover:bg-blue-50"
                    }` } >
                {
                    formData.cover ? ( <Image src={ formData.cover }
                        alt="Cover"
                        fill className="object-cover rounded-xl"/>
                    ) : ( <div className="text-center p-4" ><FiUpload className="mx-auto text-2xl text-gray-400 mb-2"/><p className="text-sm text-gray-500" >
                        Click to upload or drag and drop </p></div>
                    )
                } <input type="file"
                accept="image/*"
                onChange={
                    (e) =>
                    uploadImage("cover", e.target.files ? .[0])
                }
                className="absolute inset-0 opacity-0 cursor-pointer"/> {
                    uploading.cover && ( <div className="absolute inset-0 flex items-center justify-center bg-white/50" ><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[color:var(--secondary-color)]" ></div></div>
                    )
                } </div> { /* Image URL input hidden - only upload allowed */ } <input type="hidden"
                name="cover"
                value={ formData.cover || "" }
                onChange={ handleChange }/></div><div className="md:col-span-2" ><label className="block text-sm font-semibold text-gray-700 mb-2" >
                Event Description </label><textarea name="description"
                rows="6"
                value={ formData.description }
                onChange={ handleChange }
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[color:var(--secondary-color)] focus:ring-2 focus:ring-[color:var(--secondary-color)]/20 outline-none transition-all"
                placeholder="Tell people what your event is about..."
                required/></div></div>
            )
        }

        <div className="flex justify-between pt-6 border-t border-gray-100" ><button type="button"
        onClick={
            () => setStep((s) => Math.max(1, s - 1)) }
        disabled={ step === 1 }
        className={ `flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                  step === 1
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-600 hover:bg-gray-100"
                }` } ><FiChevronLeft/> Back </button>

        {
            step <4 ? ( <button type="button"
                onClick={
                    () => setStep((s) => Math.min(4, s + 1)) }
                className="flex items-center gap-2 px-8 py-3 bg-[color:var(--secondary-color)] hover:opacity-90 text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 transition-all hover:scale-105" >
                Next Step <FiChevronRight/></button>
            ) : ( <button type="submit"
                className="flex items-center gap-2 px-8 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold shadow-lg shadow-green-900/20 transition-all hover:scale-105" >
                Create Event <FiCheck/></button>
            )
        } </div></form></div></div><style jsx global > { `
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
          animation: fadeIn 0.4s ease-out forwards;
        }
      ` } </style></div>
    );
};

export default CreateEvent;