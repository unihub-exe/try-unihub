import React, { useState, useEffect } from "react";
import AdminNavBar from "@/components/AdminNavBar";
import { FiSave, FiDollarSign, FiCalendar, FiSettings } from "react-icons/fi";
import { API_URL } from "@/utils/config";
import { getAdminToken } from "@/utils/getAdminToken";

export default function AdminSettings() {
    const [settings, setSettings] = useState({
        premiumPricePerDay: 100,
        payoutProcessingHours: 48,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const adminToken = getAdminToken();
            const response = await fetch(`${API_URL}/admin/settings`, {
                headers: {
                    Authorization: `Bearer ${adminToken}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setSettings(data);
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const adminToken = getAdminToken();
            const response = await fetch(`${API_URL}/admin/settings`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${adminToken}`,
                },
                body: JSON.stringify(settings),
            });

            if (response.ok) {
                setMessage({ type: "success", text: "Settings saved successfully" });
                setTimeout(() => setMessage(null), 3000);
            } else {
                setMessage({ type: "error", text: "Failed to save settings" });
            }
        } catch (error) {
            console.error("Error saving settings:", error);
            setMessage({ type: "error", text: "Network error" });
        } finally {
            setSaving(false);
        }
    };

    const calculatePremiumPrice = (days) => {
        return settings.premiumPricePerDay * days;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-pulse">Loading...</div>
            </div>
        );
    }

    return (
        <div
            className="pt-6 lg:pt-8 bg-gray-50/50 min-h-screen"
            style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
        >
            <AdminNavBar />

            <div className="container mx-auto px-4 max-w-5xl">
                {message && (
                    <div className={`mb-6 p-4 rounded-xl flex items-center justify-between ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                        <span className="font-bold">{message.text}</span>
                        <button onClick={() => setMessage(null)} className="p-1 hover:bg-black/5 rounded-full">
                            ✕
                        </button>
                    </div>
                )}

                <div className="mb-8">
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight mb-2">
                        Platform Settings
                    </h1>
                    <p className="text-gray-500 font-medium">
                        Configure pricing and platform parameters
                    </p>
                </div>

                <div className="space-y-6">
                    {/* Premium Event Pricing */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center text-yellow-600">
                                <FiDollarSign size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Premium Event Pricing</h2>
                                <p className="text-sm text-gray-500">Set the daily rate for premium event listings</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Price Per Day (₦)
                                </label>
                                <input
                                    type="number"
                                    value={settings.premiumPricePerDay}
                                    onChange={(e) => setSettings({ ...settings, premiumPricePerDay: parseInt(e.target.value) || 0 })}
                                    className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:border-[color:var(--secondary-color)] focus:ring-2 focus:ring-blue-500/10 outline-none font-bold text-lg"
                                    min="0"
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    This is the base rate charged per day for premium event features
                                </p>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <FiCalendar /> Pricing Examples
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">1 Day:</span>
                                        <span className="font-bold text-gray-900">₦{calculatePremiumPrice(1).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">7 Days:</span>
                                        <span className="font-bold text-gray-900">₦{calculatePremiumPrice(7).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">14 Days:</span>
                                        <span className="font-bold text-gray-900">₦{calculatePremiumPrice(14).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">30 Days:</span>
                                        <span className="font-bold text-gray-900">₦{calculatePremiumPrice(30).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payout Settings */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                                <FiSettings size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Payout Settings</h2>
                                <p className="text-sm text-gray-500">Configure automatic payout processing time</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Standard Processing Time (Hours)
                            </label>
                            <input
                                type="number"
                                value={settings.payoutProcessingHours}
                                onChange={(e) => setSettings({ ...settings, payoutProcessingHours: parseInt(e.target.value) || 0 })}
                                className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:border-[color:var(--secondary-color)] focus:ring-2 focus:ring-blue-500/10 outline-none font-bold text-lg"
                                min="0"
                            />
                            <p className="text-xs text-gray-500 mt-2">
                                Default time before payouts are automatically processed (typically 48 hours)
                            </p>
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-8 py-4 bg-[color:var(--secondary-color)] text-white rounded-xl font-bold hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-1 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <FiSave /> {saving ? "Saving..." : "Save Settings"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
