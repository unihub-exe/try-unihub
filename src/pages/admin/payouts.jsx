import React, { useState, useEffect } from "react";
import AdminNavBar from "@/components/AdminNavBar";
import { FiDollarSign, FiClock, FiCheckCircle, FiX, FiZap, FiAlertCircle } from "react-icons/fi";
import { API_URL } from "@/utils/config";
import { getAdminToken } from "@/utils/getAdminToken";

export default function AdminPayouts() {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [message, setMessage] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);

  useEffect(() => {
    fetchPayouts();
  }, [filter]);

  const fetchPayouts = async () => {
    try {
      const adminToken = getAdminToken();
      const url = `${API_URL}/admin/payouts?status=${filter}`;
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPayouts(data);
      }
    } catch (error) {
      console.error("Error fetching payouts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImmediatePayment = (payout) => {
    setConfirmModal({
      type: "immediate",
      payout,
      title: "Process Immediate Payment",
      message: `Are you sure you want to immediately process a payout of ₦${payout.amount.toLocaleString()} to ${payout.userName}? This action cannot be undone.`,
    });
  };

  const handleRejectPayout = (payout) => {
    setConfirmModal({
      type: "reject",
      payout,
      title: "Reject Payout Request",
      message: `Are you sure you want to reject the payout request of ₦${payout.amount.toLocaleString()} from ${payout.userName}? The user will be notified.`,
    });
  };

  const confirmAction = async () => {
    if (!confirmModal) return;

    try {
      const adminToken = getAdminToken();
      const endpoint = confirmModal.type === "immediate" 
        ? `${API_URL}/admin/payout/approve`
        : `${API_URL}/admin/payout/reject`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ 
          payoutId: confirmModal.payout._id,
          immediate: confirmModal.type === "immediate"
        }),
      });

      if (response.ok) {
        setMessage({ 
          type: "success", 
          text: confirmModal.type === "immediate" 
            ? "Payment processed successfully" 
            : "Payout request rejected"
        });
        fetchPayouts();
        setTimeout(() => setMessage(null), 3000);
      } else {
        const data = await response.json();
        setMessage({ type: "error", text: data.msg || "Action failed" });
      }
    } catch (error) {
      console.error("Error processing action:", error);
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setConfirmModal(null);
    }
  };

  return (
    <div
      className="pt-6 lg:pt-8 bg-gray-50/50 min-h-screen"
      style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
    >
      <AdminNavBar />

      <div className="container mx-auto px-4 max-w-7xl">
        {message && (
          <div className={`mb-6 p-4 rounded-xl flex items-center justify-between ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            <span className="font-bold">{message.text}</span>
            <button onClick={() => setMessage(null)} className="p-1 hover:bg-black/5 rounded-full">
              <FiX />
            </button>
          </div>
        )}

        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight mb-2">
              Payout Requests
            </h1>
            <p className="text-gray-500 font-medium">
              Manage withdrawal requests from event organizers
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setFilter("pending")}
              className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${filter === "pending" ? "bg-[color:var(--secondary-color)] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              Pending
            </button>
            <button 
              onClick={() => setFilter("approved")}
              className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${filter === "approved" ? "bg-[color:var(--secondary-color)] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              Approved
            </button>
            <button 
              onClick={() => setFilter("rejected")}
              className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${filter === "rejected" ? "bg-[color:var(--secondary-color)] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              Rejected
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-4 border-[color:var(--secondary-color)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Loading payouts...</p>
          </div>
        ) : payouts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <FiDollarSign className="mx-auto text-5xl text-gray-300 mb-4" />
            <p className="text-gray-500 font-bold text-lg">No payout requests found</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Organizer</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Bank Details</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Timer</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payouts.map((payout) => {
                    const now = new Date();
                    const scheduledAt = payout.scheduledProcessingAt ? new Date(payout.scheduledProcessingAt) : null;
                    const timeRemaining = scheduledAt ? Math.max(0, scheduledAt - now) : 0;
                    const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
                    const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
                    
                    return (
                    <tr key={payout._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{payout.userName}</div>
                        <div className="text-xs text-gray-500">{payout.userEmail}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 text-lg">₦{payout.amount.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 font-medium">{payout.accountDetails?.bankName}</div>
                        <div className="text-xs text-gray-500">{payout.accountDetails?.accountNumber}</div>
                        <div className="text-xs text-gray-500">{payout.accountDetails?.accountName}</div>
                      </td>
                      <td className="px-6 py-4">
                        {payout.status === 'pending' && scheduledAt ? (
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1 text-sm">
                              <FiClock className="text-blue-500" />
                              <span className="font-bold text-gray-900">
                                {timeRemaining > 0 ? `${hoursRemaining}h ${minutesRemaining}m` : 'Ready'}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {timeRemaining > 0 ? 'until auto-process' : 'Processing soon'}
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500">
                            {payout.processedAt ? new Date(payout.processedAt).toLocaleDateString() : '-'}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${
                          payout.status === 'approved' || payout.status === 'completed' ? 'bg-green-100 text-green-700' :
                          payout.status === 'rejected' || payout.status === 'failed' ? 'bg-red-100 text-red-700' :
                          payout.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {payout.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {payout.status === 'pending' && (
                            <>
                              <button 
                                onClick={() => handleImmediatePayment(payout)}
                                className="p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
                                title="Process Immediately"
                              >
                                <FiZap size={16} /> Pay Now
                              </button>
                              <button 
                                onClick={() => handleRejectPayout(payout)}
                                className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                title="Reject"
                              >
                                <FiX size={18} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className={`p-6 ${confirmModal.type === 'immediate' ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-red-500 to-red-600'} text-white`}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  {confirmModal.type === 'immediate' ? <FiZap size={24} /> : <FiAlertCircle size={24} />}
                </div>
                <h2 className="text-2xl font-black">{confirmModal.title}</h2>
              </div>
            </div>

            <div className="p-6">
              <p className="text-gray-700 mb-6">{confirmModal.message}</p>

              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmModal(null)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAction}
                  className={`flex-1 px-4 py-3 text-white rounded-xl font-bold transition-colors ${
                    confirmModal.type === 'immediate' 
                      ? 'bg-green-500 hover:bg-green-600' 
                      : 'bg-red-500 hover:bg-red-600'
                  }`}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
