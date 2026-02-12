import React, { useEffect, useState } from "react";
import { FiSearch, FiUser, FiMail, FiCreditCard, FiPhone, FiTrash2 } from "react-icons/fi";
import { io } from "socket.io-client";
import { API_URL } from "@/utils/config";

export default function AdminUsersTable() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [deleting, setDeleting] = useState(null);

    const fetchUsers = async () => {
        try {
            const response = await fetch(`${API_URL}/admin/users`);
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        const socket = io(API_URL, {
            transports: ["websocket", "polling"],
            withCredentials: true
        });

        socket.on("user_registered", () => {
             console.log("Real-time update: User registered");
             fetchUsers();
        });

        socket.on("user_deleted", () => {
             console.log("Real-time update: User deleted");
             fetchUsers();
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const handleDeleteUser = async (userId) => {
        if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
        
        setDeleting(userId);
        try {
            const response = await fetch(`${API_URL}/admin/users/${userId}`, {
                method: 'DELETE',
            });
            
            if (response.ok) {
                // Remove user from local state
                setUsers(users.filter(user => user._id !== userId));
            } else {
                alert("Failed to delete user");
            }
        } catch (error) {
            console.error("Error deleting user:", error);
            alert("Error deleting user");
        } finally {
            setDeleting(null);
        }
    };

    const filteredUsers = users.filter(user => 
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.reg_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    User Management
                </h2>
                <div className="relative w-full md:w-64">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:border-[color:var(--secondary-color)] focus:ring-2 focus:ring-[color:var(--secondary-color)]/20 outline-none transition-all"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {loading ? (
                    <div className="text-center py-10 text-gray-500">Loading users...</div>
                ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">No users found.</div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Details</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Joined</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredUsers.map((user) => (
                                        <tr key={user._id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
                                                        {user.username?.charAt(0).toUpperCase() || <FiUser />}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-900">{user.username || "Unknown"}</div>
                                                        <div className="text-xs text-gray-500">{user._id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <FiMail className="text-gray-400 text-xs" />
                                                        {user.email}
                                                    </div>
                                                    {user.reg_number && (
                                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                                            <FiCreditCard className="text-gray-400 text-xs" />
                                                            {user.reg_number}
                                                        </div>
                                                    )}
                                                    {user.contactNumber && (
                                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                                            <FiPhone className="text-gray-400 text-xs" />
                                                            {user.contactNumber}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                                                    user.role === 'ORGANIZER' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-green-100 text-green-800'
                                                }`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    onClick={() => handleDeleteUser(user._id)}
                                                    disabled={deleting === user._id || user.role === 'ADMIN'}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title="Delete User"
                                                >
                                                    {deleting === user._id ? (
                                                        <span className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin block"></span>
                                                    ) : (
                                                        <FiTrash2 />
                                                    )}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
