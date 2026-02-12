import AdminNavBar from "@/components/AdminNavBar";
import UserNavBar from "@/components/UserNavBar";
import { getAdminToken } from "@/utils/getAdminToken";
import CreateEventForm from "@/components/CreateEventForm";
import Image from "next/image";
import React from "react";

function eventform() {
    const adminToken = getAdminToken();
    return (
        <div className="pt-20 lg:pt-8 bg-gray-50/50 min-h-screen" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            {adminToken ? <AdminNavBar /> : <UserNavBar />}
            <div className="p-6 flex justify-center items-start min-h-[calc(100vh-80px)]">
                <div className="flex flex-col xl:flex-row gap-8 w-full max-w-7xl">
                    <div className="flex-1 hidden lg:flex items-center justify-center sticky top-24 h-[calc(100vh-120px)]">
                        <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-xl border border-gray-100 group">
                            <Image
                                src="/img/eventsFormImg.jpg"
                                alt="Event Image"
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-700"
                                priority
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-10 text-white">
                                <h2 className="text-4xl font-bold mb-3 tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>Create Memories</h2>
                                <p className="text-lg opacity-90 font-medium max-w-md">Design the perfect event experience for your attendees with our powerful tools.</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 w-full">
                        <CreateEventForm />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default eventform;
