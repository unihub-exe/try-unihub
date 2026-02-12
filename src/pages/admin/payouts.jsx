import React, { useState } from "react";
import AdminNavBar from "@/components/AdminNavBar";
import { FiDollarSign, FiCheck, FiX, FiExternalLink } from "react-icons/fi";

export default function AdminPayouts() {
  const [payouts, setPayouts] = useState([
    { id: 1, user: "John Doe", amount: 5000, bank: "GTBank", account: "0123456789", status: "pending", date: "2024-05-20" },
    { id: 2, user: "Jane Smith", amount: 12500, bank: "Access Bank", account: "9876543210", status: "pending", date: "2024-05-19" },
    { id: 3, user: "Event Pro", amount: 45000, bank: "Zenith Bank", account: "1122334455", status: "approved", date: "2024-05-18" },
    { id: 4, user: "Campus Vibes", amount: 2000, bank: "UBA", account: "5566778899", status: "rejected", date: "2024-05-15" },
  ]);

  const handleApprove = (id) => {
    if (confirm("Approve this payout request?")) {
        setPayouts(payouts.map(p => p.id === id ? { ...p, status: "approved" } : p));
    }
  };

  const handleReject = (id) => {
    if (confirm("Reject this payout request?")) {
        setPayouts(payouts.map(p => p.id === id ? { ...p, status: "rejected" } : p));
    }
  };

  return (
    <div
      className="pt-6 lg:pt-8 overflow-y-hidden bg-gray-50/50 min-h-screen"
      style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
    >
      <AdminNavBar />

      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight mb-2">
                Payout Requests
            </h1>
            <p className="text-gray-500 font-medium">
                Manage withdrawal requests from event organizers
            </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Organizer</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Bank Details</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {payouts.map((payout) => (
                            <tr key={payout.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-gray-900">{payout.user}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-bold text-gray-900">₦{payout.amount.toLocaleString()}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-gray-600">
                                        <div className="font-medium">{payout.bank}</div>
                                        <div className="text-xs text-gray-500">{payout.account}</div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${
                                        payout.status === 'approved' ? 'bg-green-100 text-green-700' :
                                        payout.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                        'bg-yellow-100 text-yellow-700'
                                    }`}>
                                        {payout.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {payout.date}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {payout.status === 'pending' && (
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => handleApprove(payout.id)}
                                                className="p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                                                title="Approve"
                                            >
                                                <FiCheck size={18} />
                                            </button>
                                            <button 
                                                onClick={() => handleReject(payout.id)}
                                                className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                                title="Reject"
                                            >
                                                <FiX size={18} />
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
}
