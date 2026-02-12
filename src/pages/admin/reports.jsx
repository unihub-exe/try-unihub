import React, { useState } from "react";
import AdminNavBar from "@/components/AdminNavBar";
import { FiAlertCircle, FiTrash2, FiEye, FiCheckCircle } from "react-icons/fi";

export default function AdminReports() {
  const [reports, setReports] = useState([
    { id: 1, type: "Event", target: "Campus Party 2024", reporter: "Student1", reason: "Inappropriate content", status: "pending", date: "2024-05-21" },
    { id: 2, type: "User", target: "@spammer123", reporter: "Admin", reason: "Spam behavior", status: "resolved", date: "2024-05-20" },
    { id: 3, type: "Community", target: "Exam Cheats", reporter: "ConcernedUser", reason: "Illegal activity", status: "pending", date: "2024-05-19" },
  ]);

  const handleResolve = (id) => {
    if (confirm("Mark this report as resolved?")) {
        setReports(reports.map(r => r.id === id ? { ...r, status: "resolved" } : r));
    }
  };

  const handleDeleteTarget = (id) => {
    if (confirm("Delete the reported content?")) {
        // In real app, this would delete the event/user
        setReports(reports.filter(r => r.id !== id));
        alert("Content deleted (simulated)");
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
                Content Reports
            </h1>
            <p className="text-gray-500 font-medium">
                Review and moderate reported content and users
            </p>
        </div>

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
                            <tr key={report.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                                        report.type === 'Event' ? 'bg-purple-100 text-purple-700' :
                                        report.type === 'User' ? 'bg-blue-100 text-blue-700' :
                                        'bg-orange-100 text-orange-700'
                                    }`}>
                                        {report.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-bold text-gray-900">{report.target}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-red-500 font-medium">{report.reason}</div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {report.reporter}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${
                                        report.status === 'resolved' ? 'bg-green-100 text-green-700' :
                                        'bg-red-100 text-red-700'
                                    }`}>
                                        {report.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        {report.status === 'pending' && (
                                            <button 
                                                onClick={() => handleResolve(report.id)}
                                                className="p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                                                title="Mark Resolved"
                                            >
                                                <FiCheckCircle size={18} />
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => handleDeleteTarget(report.id)}
                                            className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                            title="Delete Content"
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
      </div>
    </div>
  );
}
