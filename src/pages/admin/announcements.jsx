import React from "react";
import AdminNavBar from "@/components/AdminNavBar";
import AdminAnnouncements from "@/components/AdminAnnouncements";
import { FiBell } from "react-icons/fi";

export default function AnnouncementsPage() {
  return (
    <div
      className="pt-6 lg:pt-8 overflow-y-hidden bg-gray-50/50 min-h-screen"
      style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
    >
      <AdminNavBar />

      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight mb-2">
                Announcements
            </h1>
            <p className="text-gray-500 font-medium">
                Broadcast updates and notifications to all users
            </p>
        </div>

        <AdminAnnouncements />
      </div>
    </div>
  );
}
