import React, { useState, useEffect } from "react";
import AdminNavBar from "@/components/AdminNavBar";
import { FiAlertCircle, FiTrash2, FiEye, FiCheckCircle, FiX } from "react-icons/fi";
import { API_URL } from "@/utils/config";
import { getAdminToken } from "@/utils/getAdminToken";

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, pending, action_taken
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchReports();
  }, [filter]);

  const fetchReports = async () => {
    try {
      const adminToken = getAdminToken();
      const url = filter === "all" ? `${API_URL}/reports/all` : `${API_URL}/reports/all?status=${filter}`;
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReports(data);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (reportId, action) => {
    const adminNotes = action === "dismissed" 
      ? prompt("Add notes (optional):") || ""
      : prompt("Add admin notes about this action:") || "";

    if (action !== "dismissed" && !adminNotes) return;

    try {
      const adminToken = getAdminToken();
      const response = await fetch(`${API_URL}/reports/action`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ reportId, action, adminNotes }),
      });

      if (response.ok) {
        setMessage({ type: "success", text: `Action "${action}" completed successfully` });
        fetchReports();
        setTimeout(() => setMessage(null), 3000);
      } else {
        const data = await response.json();
        setMessage({ type: "error", text: data.msg || "Action failed" });
      }
    } catch (error) {
      console.error("Error taking action:", error);
      setMessage({ type: "error", text: "Network error" });
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!confirm("Delete this report? This action cannot be undone.")) return;

    try {
      const adminToken = getAdminToken();
      const response = await fetch(`${API_URL}/reports/${reportId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      if (response.ok) {
        setReports(reports.filter(r => r._id !== reportId));
        setMessage({ type: "success", text: "Report deleted" });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      console.error("Error deleting report:", error);
      setMessage({ type: "error", text: "Failed to delete report" });
    }
  };

  return (
    <div
      className="pt-6 lg:pt-8 overflow-y-hidden bg-gray-50/50 min-h-screen"
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
                Content Reports
            </h1>
            <p className="text-gray-500 font-medium">
                Review and moderate reported content and users
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${filter === "all" ? "bg-[color:var(--secondary-color)] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              All
            </button>
            <button 
              onClick={() => setFilter("pending")}
              className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${filter === "pending" ? "bg-[color:var(--secondary-color)] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              Pending
            </button>
            <button 
              onClick={() => setFilter("action_taken")}
              className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${filter === "action_taken" ? "bg-[color:var(--secondary-color)] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              Resolved
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-4 border-[color:var(--secondary-color)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Loading reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <FiAlertCircle className="mx-auto text-5xl text-gray-300 mb-4" />
            <p className="text-gray-500 font-bold text-lg">No reports found</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Target</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Reason</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Reporter</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {reports.map((report) => (
                            <tr key={report._id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                                        report.reportType === 'event' ? 'bg-purple-100 text-purple-700' :
                                        report.reportType === 'user' ? 'bg-blue-100 text-blue-700' :
                                        'bg-orange-100 text-orange-700'
                                    }`}>
                                        {report.reportType}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-bold text-gray-900">{report.reportedName}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-red-500 font-medium">{report.reason}</div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {report.reporterName}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${
                                        report.status === 'action_taken' ? 'bg-green-100 text-green-700' :
                                        'bg-yellow-100 text-yellow-700'
                                    }`}>
                                        {report.status === 'action_taken' ? 'Resolved' : 'Pending'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        {report.status === 'pending' && (
                                            <>
                                                <button 
                                                    onClick={() => handleAction(report._id, 'dismissed')}
                                                    className="p-2 text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                                                    title="Dismiss Report"
                                                >
                                                    <FiX size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleAction(report._id, 'suspended')}
                                                    className="p-2 text-yellow-600 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors"
                                                    title="Suspend Content"
                                                >
                                                    <FiAlertCircle size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleAction(report._id, 'deleted')}
                                                    className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                                    title="Delete Content"
                                                >
                                                    <FiTrash2 size={18} />
                                                </button>
                                            </>
                                        )}
                                        <button 
                                            onClick={() => handleDeleteReport(report._id)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete Report"
                                        >
                                            <FiTrash2 size={18} />
                                        </button>
                                    </div>
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
