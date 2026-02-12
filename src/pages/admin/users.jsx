import React from "react";
import AdminNavBar from "@/components/AdminNavBar";
import AdminUsersTable from "@/components/AdminUsersTable";
import { FiUsers } from "react-icons/fi";

export default function AdminUsers() {
  return (
    <div
      className="pt-6 lg:pt-8 overflow-y-hidden bg-gray-50/50 min-h-screen"
      style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
    >
      <AdminNavBar />

      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight mb-2">
                User Management
            </h1>
            <p className="text-gray-500 font-medium">
                Monitor and manage user accounts and permissions
            </p>
        </div>

        <AdminUsersTable />
      </div>
    </div>
  );
}
