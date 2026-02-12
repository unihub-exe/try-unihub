import UserNavBar from "@/components/UserNavBar";
import BackButton from "@/components/BackButton";
import { getUserToken } from "@/utils/getUserToken";
import Image from "next/image";
import { useRouter } from "next/router";
import LiquidGlass from "@/components/LiquidGlass";
import { useEffect, useState } from "react";
import { API_URL } from "@/utils/config";
import { FiMapPin, FiClock, FiEdit3, FiActivity, FiCalendar, FiTag, FiUsers, FiHeart, FiGlobe, FiArrowRight, FiUser } from "react-icons/fi";

const LiveClock = ({ timezone }) => {
    const [time, setTime] = useState("");

    useEffect(() => {
        const updateTime = () => {
            try {
                const now = new Date();
                const timeString = new Intl.DateTimeFormat("en-US", {
                    timeZone: timezone,
                    hour: "numeric",
                    minute: "numeric",
                    hour12: true,
                }).format(now);
                setTime(timeString);
            } catch (e) {
                setTime("");
            }
        };

        updateTime();
        const interval = setInterval(updateTime, 1000 * 60); // Update every minute
        return () => clearInterval(interval);
    }, [timezone]);

    if (!time) return null;
    return <span className="text-gray-400">({time})</span>;
};

export default function UserProfile() {
    const router = useRouter();
    const userIdCookie = getUserToken();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState("overview");
    const [followers, setFollowers] = useState([]);
    const [followersLoading, setFollowersLoading] = useState(false);
    const [userCommunities, setUserCommunities] = useState([]);
    const [communitiesLoading, setCommunitiesLoading] = useState(false);
    const CommunityUniversityStats = ({ communityId }) => {
        const [stats, setStats] = useState([]);
        useEffect(() => {
            let mounted = true;
            const loadStats = async () => {
                try {
                    const res = await fetch(`${API_URL}/community/stats/universities/${communityId}`);
                    if (res.ok) {
                        const data = await res.json();
                        if (mounted) setStats(data);
                    }
                } catch {}
            };
            loadStats();
            return () => { mounted = false; };
        }, [communityId]);
        if (!stats || stats.length === 0) {
            return <div className="text-xs text-gray-400">No data yet</div>;
        }
        return (
            <div className="flex flex-wrap gap-2">
                {stats.map((s) => (
                    <span key={s.university} className="px-2 py-1 rounded-lg text-[10px] font-bold bg-gray-50 text-gray-700 border border-gray-200">
                        {s.university} • {s.count}
                    </span>
                ))}
            </div>
        );
    };

    useEffect(() => {
        const fetchUser = async () => {
            if (!userIdCookie) {
                router.push("/users/signin");
                return;
            }
            try {
                const response = await fetch(
                    `${API_URL}/user/details`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ user_token: userIdCookie }),
                    }
                );
                if (!response.ok) throw new Error("Failed to fetch");
                const data = await response.json();
                setUser(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [userIdCookie, router]);

    useEffect(() => {
        if (!user?._id) return;
        const loadCommunities = async () => {
            try {
                setCommunitiesLoading(true);
                const res = await fetch(`${API_URL}/community/user/${user._id}`);
                if (res.ok) {
                    const data = await res.json();
                    setUserCommunities(data);
                } else {
                    setUserCommunities([]);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setCommunitiesLoading(false);
            }
        };
        loadCommunities();
    }, [user?._id]);

    useEffect(() => {
        if (tab !== "followers" || !user?._id) return;
        const loadFollowers = async () => {
            try {
                setFollowersLoading(true);
                const res = await fetch(`${API_URL}/social/followers/${user._id}`);
                if (res.ok) {
                    const data = await res.json();
                    setFollowers(data);
                } else {
                    setFollowers([]);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setFollowersLoading(false);
            }
        };
        loadFollowers();
    }, [tab, user?._id]);

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center">
                <div className="h-12 w-12 border-4 border-[color:var(--secondary-color)] border-t-transparent rounded-full animate-spin mb-4"></div>
                <div className="h-4 w-32 bg-gray-200 rounded"></div>
            </div>
        </div>
    );

    return (
        <div className="pt-6 lg:pt-8 min-h-screen bg-gray-50 pb-24 font-sans">
            <UserNavBar />
            <div className="container mx-auto px-4 max-w-6xl">
                <BackButton className="mb-6" />
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Profile Info */}
                    <div className="lg:col-span-1">
                        <div className="bg-white border border-gray-100 shadow-xl rounded-3xl overflow-hidden p-8 text-center sticky top-24">
                            <div className="relative h-32 w-32 mx-auto mb-4">
                                {user?.avatar ? (
                                    <Image
                                        src={user.avatar}
                                        fill
                                        alt="Avatar"
                                        className="rounded-full object-cover border-4 border-gray-50 shadow-inner"
                                    />
                                ) : (
                                    <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center border-4 border-gray-50 shadow-inner">
                                        <FiUser className="text-5xl text-gray-400" />
                                    </div>
                                )}
                            </div>
                            <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
                                {user?.displayName || user?.username || "Your Profile"}
                            </h1>
                            <p className="text-gray-500 mb-4">{user?.username ? `@${user.username}` : ""}</p>
                            
                            <p className="text-gray-600 mb-6 leading-relaxed">
                                {user?.bio || "Add a short bio from Settings to let people know more about you."}
                            </p>

                            <div className="flex flex-col gap-3 text-sm text-gray-500 mb-6">
                                {user?.location && (
                                    <div className="flex items-center justify-center gap-2">
                                        <FiMapPin className="w-4 h-4" />
                                        {user.location}
                                    </div>
                                )}
                                {user?.timezone && (
                                    <div className="flex items-center justify-center gap-2">
                                        <FiClock className="w-4 h-4" />
                                        <span>{user.timezone}</span>
                                        <LiveClock timezone={user.timezone} />
                                    </div>
                                )}
                                {(user?.countryCode || user?.phoneNumber) && user?.showPhoneNumber !== false && (
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="w-4 h-4">📞</span>
                                        <span>{`${user?.countryCode || ""} ${user?.phoneNumber || ""}`.trim()}</span>
                                    </div>
                                )}
                                {user?.university && (
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="w-4 h-4">🎓</span>
                                        <span>{user.university}</span>
                                    </div>
                                )}
                                {user?.levelOfStudy && (
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="w-4 h-4">📘</span>
                                        <span>{user.levelOfStudy.replace(/_/g, " ")}</span>
                                    </div>
                                )}
                                {user?.department && (
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="w-4 h-4">🏫</span>
                                        <span>{user.department}</span>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => router.push("/users/settings")}
                                className="w-full py-3 px-4 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                            >
                                <FiEdit3 className="w-4 h-4" />
                                Edit Profile
                            </button>
                            
                            <div className="mt-8 pt-6 border-t border-gray-100">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Social Links</h3>
                                <div className="flex flex-col gap-2">
                                    {(user?.socialLinks || []).map((l, idx) => (
                                        <a key={idx} href={l} target="_blank" rel="noreferrer" className="text-[color:var(--secondary-color)] hover:underline text-sm truncate flex items-center justify-center gap-2">
                                            <FiGlobe className="w-3 h-3" />
                                            {l.replace(/^https?:\/\//, '')}
                                        </a>
                                    ))}
                                    {(user?.socialLinks || []).length === 0 && (
                                        <span className="text-gray-400 text-sm italic">No links added</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Tabs */}
                        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-2 flex overflow-x-auto no-scrollbar">
                            {[
                                { key: "overview", label: "Overview" },
                                { key: "events", label: "Hosted Events" },
                                { key: "past", label: "Attending" },
                                { key: "followers", label: "Followers" },
                            ].map((t) => (
                                <button
                                    key={t.key}
                                    onClick={() => setTab(t.key)}
                                    className={`px-6 py-3 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
                                        tab === t.key 
                                        ? "bg-[color:var(--secondary-color)] text-white shadow-lg shadow-blue-900/20" 
                                        : "text-gray-500 hover:bg-gray-50"
                                    }`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>

                        {/* Content Area */}
                        <div className="bg-white border border-gray-100 shadow-xl rounded-3xl overflow-hidden p-8 min-h-[400px]">
                            {tab === "overview" && (
                                <div className="animate-fadeIn">
                                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                        <FiHeart className="w-5 h-5 text-[color:var(--secondary-color)]" />
                                        Interests & Hobbies
                                    </h2>
                                    <div className="flex flex-wrap gap-3">
                                        {(user?.interests || []).map((i, idx) => (
                                            <span key={idx} className="px-4 py-2 rounded-xl bg-[color:var(--secondary-color)]/5 text-[color:var(--secondary-color)] text-sm font-semibold border border-[color:var(--secondary-color)]/10">{i}</span>
                                        ))}
                                        {(user?.interests || []).length === 0 && (
                                            <div className="text-center py-10 w-full bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                                <p className="text-gray-500">No interests added yet.</p>
                                                <button onClick={() => router.push("/users/settings")} className="text-[color:var(--secondary-color)] text-sm font-semibold mt-2 hover:underline">Add Interests</button>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="mt-10">
                                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                            <FiActivity className="w-5 h-5 text-[color:var(--secondary-color)]" />
                                            Stats
                                        </h2>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                            <div className="p-4 bg-white border border-gray-100 rounded-2xl text-center shadow-sm hover:shadow-md transition-shadow">
                                                <div className="text-2xl font-black text-gray-900">{(user?.eventCreated || []).length}</div>
                                                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Hosted</div>
                                            </div>
                                            <div className="p-4 bg-white border border-gray-100 rounded-2xl text-center shadow-sm hover:shadow-md transition-shadow">
                                                <div className="text-2xl font-black text-gray-900">{(user?.eventJoined || []).length}</div>
                                                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Attended</div>
                                            </div>
                                            <div className="p-4 bg-white border border-gray-100 rounded-2xl text-center shadow-sm hover:shadow-md transition-shadow">
                                                <div className="text-2xl font-black text-gray-900">{(user?.communitiesJoined || []).length}</div>
                                                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Communities</div>
                                            </div>
                                            <div className="p-4 bg-white border border-gray-100 rounded-2xl text-center shadow-sm hover:shadow-md transition-shadow">
                                                <div className="text-2xl font-black text-gray-900">{followers.length}</div>
                                                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Followers</div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-10">
                                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                            <FiUsers className="w-5 h-5 text-[color:var(--secondary-color)]" />
                                            Communities
                                        </h2>
                                        {communitiesLoading ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {[...Array(4)].map((_, idx) => (
                                                    <div key={idx} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 animate-pulse h-24"></div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                {userCommunities.map((c) => (
                                                    <div key={c._id} className="bg-white rounded-2xl border border-gray-100 p-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                                                                <Image fill src={c.profileImage || "/img/only_logo.png"} alt={c.name} className="object-cover" />
                                                            </div>
                                                            <div className="flex-1 overflow-hidden">
                                                                <h4 className="font-bold text-gray-900 truncate">{c.name}</h4>
                                                                <p className="text-xs text-gray-500 truncate">{c.description}</p>
                                                            </div>
                                                            <span className="px-3 py-1 rounded-lg text-xs font-bold bg-[color:var(--secondary-color)]/10 text-[color:var(--secondary-color)] border border-[color:var(--secondary-color)]/20">
                                                                {c.role || "member"}
                                                            </span>
                                                        </div>
                                                        <div className="mt-3 pt-3 border-t border-gray-100">
                                                            <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Top Universities</h5>
                                                            <CommunityUniversityStats communityId={c._id} />
                                                        </div>
                                                    </div>
                                                ))}
                                                {userCommunities.length === 0 && (
                                                    <div className="col-span-full text-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                                        <p className="text-gray-500">You haven't joined any communities yet.</p>
                                                        <button onClick={() => router.push("/users/community")} className="text-[color:var(--secondary-color)] text-sm font-semibold mt-2 hover:underline">Discover Communities</button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            
                            {tab === "events" && (
                                <div className="animate-fadeIn">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        {(user?.eventCreated || []).map((event) => (
                                            <div key={event.event_id} className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all overflow-hidden cursor-pointer" onClick={() => router.push(`/event/${event.event_id}/manage`)}>
                                                <div className="relative h-48 overflow-hidden">
                                                    <Image fill className="object-cover transition-transform duration-500 group-hover:scale-110" src={event.profile || event.cover} alt="" />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                                                        <span className="text-white font-semibold text-sm flex items-center gap-1">Manage Event <FiArrowRight /></span>
                                                    </div>
                                                </div>
                                                <div className="p-5">
                                                    <h3 className="font-bold text-gray-900 mb-1 truncate">{event.name}</h3>
                                                    <p className="text-sm text-gray-500 flex items-center gap-1 mb-3">
                                                        <FiMapPin className="w-4 h-4" />
                                                        {event.venue}
                                                    </p>
                                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                                                        <span className="text-xs font-semibold px-2 py-1 bg-green-100 text-green-700 rounded-lg">Published</span>
                                                        <span className="text-xs text-gray-400">Manage</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {(user?.eventCreated || []).length === 0 && (
                                            <div className="col-span-full text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                                    <FiCalendar className="w-8 h-8" />
                                                </div>
                                                <h3 className="text-lg font-bold text-gray-900">No events hosted yet</h3>
                                                <p className="text-gray-500 mb-6">Create your first event and share it with the world.</p>
                                                <button onClick={() => router.push("/users/eventform")} className="px-6 py-3 bg-[color:var(--secondary-color)] text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 hover:scale-105 transition-all">
                                                    Create Event
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {tab === "past" && (
                                <div className="animate-fadeIn">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        {(user?.registeredEvents || []).map((event) => (
                                            <div key={event.event_id} className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all overflow-hidden cursor-pointer" onClick={() => router.push(`/event/${event.event_id}`)}>
                                                <div className="relative h-48 overflow-hidden">
                                                    <Image fill className="object-cover transition-transform duration-500 group-hover:scale-110" src={event.profile || event.cover} alt="" />
                                                </div>
                                                <div className="p-5">
                                                    <h3 className="font-bold text-gray-900 mb-1 truncate">{event.name}</h3>
                                                    <p className="text-sm text-gray-500 flex items-center gap-1">
                                                        <FiMapPin className="w-4 h-4" />
                                                        {event.venue}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                        {(user?.registeredEvents || []).length === 0 && (
                                            <div className="col-span-full text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                                <FiTag className="w-8 h-8" />
                                            </div>
                                                <h3 className="text-lg font-bold text-gray-900">No events registered</h3>
                                                <p className="text-gray-500 mb-6">Explore upcoming events and join the fun.</p>
                                                <button onClick={() => router.push("/users/dashboard")} className="px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:border-[color:var(--secondary-color)] hover:text-[color:var(--secondary-color)] transition-all">
                                                    Explore Events
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {tab === "followers" && (
                                <div className="animate-fadeIn">
                                    {followersLoading ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                            {[...Array(6)].map((_, idx) => (
                                                <div key={idx} className="bg-gray-50 rounded-2xl border border-gray-100 p-4 h-20 animate-pulse"></div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                            {followers.map((follower) => {
                                                const isFriend = (user?.friends || []).some(id => id === follower._id);
                                                const isMutual = isFriend || (user?.following || []).some(id => id === follower._id);
                                                return (
                                                <div key={follower._id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push(`/users/u/${follower._id}`)}>
                                                    <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                                                        <Image fill src={follower.avatar || "/img/only_logo.png"} alt={follower.displayName || follower.username} className="object-cover" />
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <h4 className="font-bold text-gray-900 truncate">{follower.displayName || follower.username}</h4>
                                                        <p className="text-xs text-gray-500 truncate">@{follower.username}</p>
                                                    </div>
                                                    {isMutual && (
                                                        <span className="ml-auto px-2 py-1 rounded-lg text-[10px] font-bold bg-green-100 text-green-700 border border-green-200">
                                                            Friend
                                                        </span>
                                                    )}
                                                </div>
                                                );
                                            })}
                                            {followers.length === 0 && (
                                                <div className="col-span-full text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                                                    <div className="w-16 h-16 bg-[color:var(--secondary-color)]/10 rounded-full flex items-center justify-center mx-auto mb-6 text-[color:var(--secondary-color)]">
                                                        <FiUsers className="w-8 h-8" />
                                                    </div>
                                                    <h3 className="text-xl font-bold text-gray-900 mb-2">No followers yet</h3>
                                                    <p className="text-gray-500 max-w-md mx-auto">
                                                        Share your profile to get more followers!
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <LiquidGlass />
        </div>
    );
}
