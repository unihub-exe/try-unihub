import UserNavBar from "@/components/UserNavBar";
import BackButton from "@/components/BackButton";
import { getUserToken } from "@/utils/getUserToken";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import LocationAutocomplete from "@/components/LocationAutocomplete";
import { countryCodes } from "@/data/countryCodes";
import { nigeriaUniversities } from "@/data/nigeria_universities";
import { API_URL } from "@/utils/config";
import Cookies from "universal-cookie";
import {
  FiCamera,
  FiUser,
  FiMapPin,
  FiGlobe,
  FiLayout,
  FiBell,
  FiSave,
  FiX,
  FiBook,
  FiSmartphone,
  FiShield,
  FiActivity
} from "react-icons/fi";

const timezones =
  typeof Intl !== "undefined" && Intl.supportedValuesOf
    ? Intl.supportedValuesOf("timeZone")
    : ["UTC", "Africa/Lagos", "Europe/London", "America/New_York"].sort();

export default function UserSettings() {
  const router = useRouter();
  const userIdCookie = getUserToken();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    avatar: "",
    displayName: "",
    bio: "",
    location: "",
    interests: [],
    timezone: "",
    publicProfile: true,
    hideStats: false,
    socialLinks: [],
    role: "ATTENDEE",
    countryCode: "+234",
    phoneNumber: "",
    university: "",
    levelOfStudy: "",
    department: "",
  });

  useEffect(() => {
    const load = async () => {
      if (!userIdCookie) {
        router.push("/users/signin");
        return;
      }
      try {
        const res = await fetch(`${API_URL}/user/details`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_token: userIdCookie }),
        });
        if (!res.ok) return;
        const u = await res.json();
        setForm({
          avatar: u.avatar || "",
          displayName: u.displayName || u.username || "",
          bio: u.bio || "",
          location: u.location || "",
          interests: u.interests || [],
          timezone: u.timezone || "",
          publicProfile: u.publicProfile ?? true,
          hideStats: u.hideStats ?? false,
          socialLinks: u.socialLinks || [],
          role: u.role || "ATTENDEE",
          countryCode: u.countryCode || "+234",
          phoneNumber: u.phoneNumber || "",
          university: u.university || "",
          levelOfStudy: u.levelOfStudy || "",
          department: u.department || "",
        });
      } catch (error) {
        console.error("Failed to load user details", error);
      }
    };
    load();
  }, [userIdCookie, router]);

  const setField = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const uploadAvatar = async (file) => {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch(`${API_URL}/upload/image`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const json = await res.json();
      setField("avatar", json.url);
    } catch (e) {
      setMessage("Avatar upload failed");
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        interests:
          typeof form.interests === "string"
            ? form.interests.split(",").map((s) => s.trim()).filter(Boolean)
            : form.interests,
      };

      const res = await fetch(`${API_URL}/user/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_token: userIdCookie, profile: payload }),
      });
      if (res.ok) {
        setMessage("Changes saved successfully");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("Failed to update profile");
      }
    } catch (error) {
      setMessage("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: FiUser },
    { id: "academic", label: "Academic", icon: FiBook },
    { id: "contact", label: "Contact", icon: FiSmartphone },
    { id: "preferences", label: "Preferences", icon: FiShield },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-32 md:pb-0 font-sans">
      <UserNavBar />
      <BackButton />

      <div className="flex m-auto relative z-10 pt-6 lg:pt-8">
        <div className="flex mx-auto container px-4 lg:px-6 max-w-5xl">
            <div className="flex flex-col w-full min-h-[calc(100vh-6rem)]">
                
                <div className="mb-8 mt-2">
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Settings</h1>
                    <p className="text-gray-500 mt-1 font-medium">Manage your personal information and preferences</p>
                </div>

                {message && (
                <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${message.includes("failed") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
                    <span className={`w-2 h-2 rounded-full ${message.includes("failed") ? "bg-red-500" : "bg-green-500"}`} />
                    <span className="font-bold text-sm">{message}</span>
                </div>
                )}

                <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar Tabs */}
                <div className="lg:w-64 flex-shrink-0">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 space-y-1 sticky top-32">
                    {tabs.map((tab) => (
                        <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                            activeTab === tab.id
                            ? "bg-black text-white shadow-lg"
                            : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                        >
                        <tab.icon className="text-lg" />
                        {tab.label}
                        </button>
                    ))}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1">
                    <form onSubmit={submit} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
                    
                    {/* Profile Tab */}
                    {activeTab === "profile" && (
                        <div className="space-y-8 animate-fade-in">
                        <div className="flex items-center gap-6">
                            <div className="relative group">
                            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 ring-4 ring-gray-50 relative">
                                {form.avatar ? (
                                <Image src={form.avatar} alt="Avatar" fill className="object-cover" />
                                ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                    <FiUser className="text-4xl" />
                                </div>
                                )}
                                <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <FiCamera className="text-white text-2xl" />
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => uploadAvatar(e.target.files[0])} />
                                </label>
                            </div>
                            </div>
                            <div>
                            <h3 className="text-lg font-bold text-gray-900">Profile Photo</h3>
                            <p className="text-xs text-gray-500">Recommended 400x400px</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Display Name</label>
                            <input
                                type="text"
                                value={form.displayName}
                                onChange={(e) => setField("displayName", e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none font-medium"
                                placeholder="How you appear to others"
                            />
                            </div>
                            <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Location</label>
                            <LocationAutocomplete
                                value={form.location}
                                onChange={(val) => setField("location", val)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none font-medium"
                            />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-bold text-gray-700">Bio</label>
                            <textarea
                                value={form.bio}
                                onChange={(e) => setField("bio", e.target.value)}
                                rows={3}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none font-medium resize-none"
                                placeholder="Tell us a bit about yourself..."
                            />
                            </div>
                        </div>
                        </div>
                    )}

                    {/* Academic Tab */}
                    {activeTab === "academic" && (
                        <div className="space-y-6 animate-fade-in">
                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">University</label>
                            <div className="relative">
                                <input
                                type="text"
                                value={form.university}
                                onChange={(e) => setField("university", e.target.value)}
                                list="universities"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none font-medium pl-10"
                                placeholder="Select your university"
                                />
                                <FiBook className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <datalist id="universities">
                                {nigeriaUniversities.map((uni) => (
                                    <option key={uni} value={uni} />
                                ))}
                                </datalist>
                            </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Level of Study</label>
                                <select
                                value={form.levelOfStudy}
                                onChange={(e) => setField("levelOfStudy", e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none font-medium"
                                >
                                <option value="">Select Level</option>
                                <option value="Undergraduate">Undergraduate</option>
                                <option value="100 Level">100 Level</option>
                                <option value="200 Level">200 Level</option>
                                <option value="300 Level">300 Level</option>
                                <option value="400 Level">400 Level</option>
                                <option value="500 Level">500 Level</option>
                                <option value="600 Level">600 Level</option>
                                <option value="Postgraduate">Postgraduate</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Department</label>
                                <input
                                type="text"
                                value={form.department}
                                onChange={(e) => setField("department", e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none font-medium"
                                placeholder="e.g. Computer Science"
                                />
                            </div>
                            </div>
                        </div>
                        </div>
                    )}

                    {/* Contact Tab */}
                    {activeTab === "contact" && (
                        <div className="space-y-6 animate-fade-in">
                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Phone Number</label>
                            <div className="flex flex-col gap-3">
                                <select
                                value={form.countryCode}
                                onChange={(e) => setField("countryCode", e.target.value)}
                                className="w-48 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none font-medium text-sm"
                                >
                                {[...countryCodes].sort((a, b) => a.name.localeCompare(b.name)).map((c) => (
                                    <option key={c.name} value={c.code}>
                                    {c.flag} {c.name} ({c.code})
                                    </option>
                                ))}
                                </select>
                                <input
                                type="tel"
                                value={form.phoneNumber}
                                onChange={(e) => setField("phoneNumber", e.target.value)}
                                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none font-medium"
                                placeholder="8012345678"
                                />
                            </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <div>
                                    <h4 className="font-bold text-gray-900">Show Phone Number</h4>
                                    <p className="text-xs text-gray-500">Display your phone number on your public profile</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                    type="checkbox"
                                    checked={form.showPhoneNumber}
                                    onChange={(e) => setField("showPhoneNumber", e.target.checked)}
                                    className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                                </label>
                            </div>
                        </div>
                        </div>
                    )}

                    {/* Preferences Tab */}
                    {activeTab === "preferences" && (
                        <div className="space-y-6 animate-fade-in">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div>
                                <h4 className="font-bold text-gray-900">Public Profile</h4>
                                <p className="text-xs text-gray-500">Allow others to find and view your profile</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                type="checkbox"
                                checked={form.publicProfile}
                                onChange={(e) => setField("publicProfile", e.target.checked)}
                                className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                            </label>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div>
                                <h4 className="font-bold text-gray-900">Hide Statistics</h4>
                                <p className="text-xs text-gray-500">Hide your community stats from others</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                type="checkbox"
                                checked={form.hideStats}
                                onChange={(e) => setField("hideStats", e.target.checked)}
                                className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                            </label>
                            </div>
                        </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                        <button
                        type="submit"
                        disabled={loading}
                        className="px-8 py-3 bg-black text-white rounded-xl font-bold hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2 shadow-xl shadow-black/10"
                        >
                        {loading ? (
                            <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Saving...
                            </>
                        ) : (
                            <>
                            <FiSave /> Save Changes
                            </>
                        )}
                        </button>
                    </div>
                    </form>
                </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
