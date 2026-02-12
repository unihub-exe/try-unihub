import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import UserNavBar from "@/components/UserNavBar";
import BackButton from "@/components/BackButton";
import { getUserToken } from "@/utils/getUserToken";
import { API_URL } from "@/utils/config";
import { FiMapPin, FiLink, FiUserCheck, FiUserPlus, FiClock, FiCheck, FiGlobe } from "react-icons/fi";

export default function PublicProfile() {
  const router = useRouter();
  const { id } = router.query;
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [localTime, setLocalTime] = useState("");

  useEffect(() => {
    if (id) fetchProfile();
    const token = getUserToken();
    if (token) fetchCurrentUser(token);
  }, [id]);

  useEffect(() => {
    if (!profile?.timezone) return;

    const updateTime = () => {
      try {
        const time = new Date().toLocaleTimeString("en-US", {
          timeZone: profile.timezone,
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
        setLocalTime(time);
      } catch (e) {
        console.error("Invalid timezone", e);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [profile?.timezone]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/social/profile/${id}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      } else {
        // Handle 404
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUser = async (token) => {
    try {
      const res = await fetch(`${API_URL}/user/details`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_token: token }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data);
      }
    } catch (e) {}
  };

  const handleFollow = async () => {
    try {
      const res = await fetch(`${API_URL}/social/follow`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getUserToken()}`,
        },
        body: JSON.stringify({ targetUserId: profile._id, user_token: getUserToken() }),
      });
      if (res.ok) {
        setProfile(prev => ({ ...prev, followersCount: (prev.followersCount || 0) + 1 }));
        setCurrentUser(prev => ({ ...prev, following: [...(prev.following || []), profile._id] }));
      }
    } catch (e) { console.error(e); }
  };

  const handleUnfollow = async () => {
    try {
      const res = await fetch(`${API_URL}/social/unfollow`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getUserToken()}`,
        },
        body: JSON.stringify({ targetUserId: profile._id, user_token: getUserToken() }),
      });
      if (res.ok) {
        setProfile(prev => ({ ...prev, followersCount: Math.max(0, (prev.followersCount || 0) - 1) }));
        setCurrentUser(prev => ({ 
            ...prev, 
            following: (prev.following || []).filter(id => id !== profile._id),
            friends: (prev.friends || []).filter(id => id !== profile._id)
        }));
      }
    } catch (e) { console.error(e); }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
            <div className="h-12 w-12 border-4 border-[color:var(--secondary-color)] border-t-transparent rounded-full animate-spin mb-4"></div>
            <div className="h-4 w-32 bg-gray-200 rounded"></div>
        </div>
    </div>
  );

  if (!profile) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
            <div className="text-6xl mb-4">😕</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">User not found</h2>
            <button onClick={() => router.back()} className="text-[color:var(--secondary-color)] font-bold hover:underline">
                Go back
            </button>
        </div>
    </div>
  );

  const isFollowing = currentUser?.following?.includes(profile._id);
  const isFriend = currentUser?.friends?.includes(profile._id);
  const isMe = currentUser?._id === profile._id;

  return (
    <div className="min-h-screen bg-gray-50/50 pt-20 pb-24 relative">
      <UserNavBar />
      <BackButton className="!text-gray-800 !bg-white/80 !border-gray-200" />
      
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-3xl shadow-lg shadow-gray-200/50 border border-gray-100 overflow-hidden">
          {/* Banner */}
          <div className="h-32 bg-gradient-to-r from-blue-400 to-[color:var(--secondary-color)]"></div>
          
          <div className="px-8 pb-8">
            <div className="relative flex justify-between items-end -mt-12 mb-6">
              <div className="h-24 w-24 rounded-full border-4 border-white bg-white shadow-md overflow-hidden">
                {profile.avatar ? (
                    <img src={profile.avatar} alt={profile.username} className="h-full w-full object-cover" />
                ) : (
                    <div className="h-full w-full bg-gray-200 flex items-center justify-center text-3xl">👤</div>
                )}
              </div>
              
              {!isMe && (
                <button
                    className={`px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg ${
                        isFriend
                        ? "bg-green-100 text-green-600 hover:bg-green-200 border border-green-200"
                        : isFollowing 
                        ? "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm" 
                        : "bg-[color:var(--secondary-color)] text-white hover:opacity-90 shadow-blue-500/20"
                    }`}
                    onClick={isFollowing ? handleUnfollow : handleFollow}
                >
                    {isFriend ? (
                        <>
                            <FiCheck className="w-5 h-5" />
                            <span>Friends</span>
                        </>
                    ) : isFollowing ? (
                        <>
                            <FiUserCheck className="w-5 h-5" />
                            <span>Following</span>
                        </>
                    ) : (
                        <>
                            <FiUserPlus className="w-5 h-5" />
                            <span>Follow</span>
                        </>
                    )}
                </button>
              )}
            </div>

            <div>
                <h1 className="text-3xl font-bold text-gray-900">{profile.displayName || profile.username}</h1>
                <p className="text-gray-500 font-medium">@{profile.username}</p>
                
                <div className="flex items-center gap-4 mt-4 text-sm text-gray-600">
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-semibold text-xs uppercase tracking-wide">
                        {profile.role}
                    </span>
                    {profile.location && (
                        <span className="flex items-center gap-1">
                            <FiMapPin /> {profile.location}
                        </span>
                    )}
                    {profile.timezone && localTime && (
                        <span className="flex items-center gap-1">
                            <FiClock /> {profile.timezone.split("/")[1]?.replace(/_/g, " ") || profile.timezone} {localTime}
                        </span>
                    )}
                </div>

                <div className="mt-8">
                    <h3 className="text-lg font-bold text-gray-900 mb-3">About</h3>
                    <p className="text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        {profile.bio || "This user hasn't written a bio yet."}
                    </p>
                </div>

                {profile.interests && profile.interests.length > 0 && (
                    <div className="mt-8">
                        <h3 className="text-lg font-bold text-gray-900 mb-3">Interests</h3>
                        <div className="flex flex-wrap gap-2">
                            {profile.interests.map((interest, index) => (
                                <span key={index} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold shadow-sm hover:border-[color:var(--secondary-color)] hover:text-[color:var(--secondary-color)] transition-colors cursor-default">
                                    {interest}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {profile.socialLinks && profile.socialLinks.length > 0 && (
                    <div className="mt-8">
                        <h3 className="text-lg font-bold text-gray-900 mb-3">Social Links</h3>
                        <div className="flex flex-col gap-2">
                            {profile.socialLinks.map((link, idx) => (
                                <a 
                                    key={idx} 
                                    href={link} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="flex items-center gap-2 text-gray-600 hover:text-[color:var(--secondary-color)] transition-colors w-fit"
                                >
                                    <FiGlobe className="w-4 h-4" />
                                    <span className="text-sm font-medium hover:underline">{link.replace(/^https?:\/\//, '')}</span>
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex flex-wrap gap-8 mt-8 border-t border-gray-100 pt-8">
                    <div className="text-center min-w-[80px]">
                        <span className="block text-2xl font-bold text-gray-900">{profile.followersCount || 0}</span>
                        <span className="text-xs text-gray-500 uppercase tracking-wide font-bold">Followers</span>
                    </div>
                    <div className="text-center min-w-[80px]">
                        <span className="block text-2xl font-bold text-gray-900">{(profile.following || []).length}</span>
                        <span className="text-xs text-gray-500 uppercase tracking-wide font-bold">Following</span>
                    </div>
                    <div className="text-center min-w-[80px]">
                        <span className="block text-2xl font-bold text-gray-900">{(profile.eventCreated || []).length}</span>
                        <span className="text-xs text-gray-500 uppercase tracking-wide font-bold">Hosted</span>
                    </div>
                    <div className="text-center min-w-[80px]">
                        <span className="block text-2xl font-bold text-gray-900">{(profile.registeredEvents || []).length}</span>
                        <span className="text-xs text-gray-500 uppercase tracking-wide font-bold">Attending</span>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
