import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import UserNavBar from "@/components/UserNavBar";
import { getUserToken } from "@/utils/getUserToken";
import {
  FiUsers,
  FiPlus,
  FiArrowRight,
  FiSearch,
  FiUserPlus,
  FiCheck,
  FiLogOut,
  FiTrash2,
  FiEye
} from "react-icons/fi";
import { API_URL } from "@/utils/config";

const CommunityCard = ({ community, isMember, isCreator, onJoin, onEnter, onLeave, onDelete }) => (
  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full cursor-pointer" onClick={() => isMember ? onEnter(community._id) : onJoin(community._id)}>
    <div className="flex items-start justify-between mb-4">
      <div className="h-14 w-14 rounded-xl bg-gray-50 flex items-center justify-center text-2xl overflow-hidden border border-gray-100 group-hover:scale-110 transition-transform duration-300 relative">
        {community.profileImage ? (
          <img
            src={community.profileImage}
            className="h-full w-full object-cover"
            alt={community.name}
          />
        ) : (
          "🏛️"
        )}
      </div>
      <span className="flex items-center gap-1.5 text-xs font-bold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 group-hover:bg-white group-hover:shadow-sm transition-all">
        <FiUsers className="w-3.5 h-3.5" />
        {community.members?.length || 0}
      </span>
    </div>

    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-[color:var(--secondary-color)] transition-colors line-clamp-1">
      {community.name}
    </h3>
    <p className="text-gray-500 text-sm mb-6 line-clamp-2 flex-grow">
      {community.description || "No description provided."}
    </p>

    <div className="mt-auto flex gap-2">
      <button
        onClick={(e) => {
          e.stopPropagation();
          isMember ? onEnter(community._id) : onJoin(community._id);
        }}
        className={`flex-grow flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all text-sm ${
          isMember
            ? "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-100"
            : "bg-[color:var(--secondary-color)] text-white hover:opacity-90 shadow-lg shadow-blue-500/20 hover:shadow-xl"
        }`}
      >
        {isMember ? (
          <>
            Enter <FiArrowRight />
          </>
        ) : (
          <>
            Join <FiPlus />
          </>
        )}
      </button>

      {isCreator ? (
         <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(community._id);
            }}
            className="p-3 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 border border-red-100 transition-all"
            title="Delete Community"
         >
            <FiTrash2 size={18} />
         </button>
      ) : isMember && (
         <button
            onClick={(e) => {
              e.stopPropagation();
              onLeave(community._id);
            }}
            className="p-3 rounded-xl bg-gray-50 text-gray-500 hover:bg-red-50 hover:text-red-500 border border-gray-100 transition-all"
            title="Leave Community"
         >
            <FiLogOut size={18} />
         </button>
      )}
    </div>
  </div>
);

  const UserCard = ({ user, onFollow, onUnfollow, isFollowing, isFriend, router }) => (
  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full group cursor-pointer" onClick={() => router.push(`/users/u/${user._id}`)}>
      <div className="flex items-center justify-center mb-4">
        <div className="h-20 w-20 rounded-full bg-gray-50 border border-gray-100 overflow-hidden relative group-hover:scale-110 transition-transform">
            {user.avatar ? (
            <img src={user.avatar} alt={user.username} className="h-full w-full object-cover" />
            ) : (
            <div className="h-full w-full flex items-center justify-center text-gray-300">
                <FiUsers size={24} />
            </div>
            )}
        </div>
      </div>
      
      <div className="text-center flex-grow">
        <h4 className="font-bold text-gray-900 truncate group-hover:text-[color:var(--secondary-color)] transition-colors text-lg mb-1">{user.displayName || user.username}</h4>
        <p className="text-xs text-gray-500 truncate font-medium uppercase tracking-wide mb-2">{user.role}</p>
        {user.bio && <p className="text-sm text-gray-400 line-clamp-2">{user.bio}</p>}
      </div>

    <div className="mt-4 pt-4 border-t border-gray-50">
        <button
        onClick={(e) => {
            e.stopPropagation();
            isFollowing ? onUnfollow(user._id) : onFollow(user._id);
        }}
        className={`w-full py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 font-bold text-sm ${
            isFriend 
            ? "bg-green-100 text-green-600 hover:bg-green-200"
            : isFollowing
            ? "bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-500 hover:shadow-md"
            : "bg-[color:var(--secondary-color)] text-white hover:opacity-90 hover:shadow-lg shadow-blue-500/20"
        }`}
        >
        {isFriend ? (
            <>
                <FiCheck size={16} />
                <span>Friends</span>
            </>
        ) : isFollowing ? (
            <>
                <FiCheck size={16} />
                <span>Following</span>
            </>
        ) : (
            <>
                <FiUserPlus size={16} />
                <span>Follow</span>
            </>
        )}
        </button>
    </div>
  </div>
);

export default function CommunityList() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("communities"); // "communities" or "users"
  const [communities, setCommunities] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Create Form State
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newRules, setNewRules] = useState("");
  const [newImage, setNewImage] = useState("🏛️");
  const [isCustomImage, setIsCustomImage] = useState(false);

  const [isUploading, setIsUploading] = useState(false);

  const PRESET_ICONS = ["🏛️", "🏀", "🎨", "🔬", "🎵", "📚", "💻", "🎭", "🌱", "🚀", "💼", "🎮", "⚽", "🍔", "🎬", "🎤"];

  const apiUrl = API_URL;

  const uploadCommunityImage = async (file) => {
    if (!file) return;
    setIsUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch(`${apiUrl}/upload/image`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const json = await res.json();
      setNewImage(json.url);
      setIsCustomImage(true);
    } catch (e) {
      alert("Image upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    const token = getUserToken();
    if (!token) {
      router.push("/users/signin");
      return;
    }
    fetchUserDetails(token);
    fetchCommunities();
  }, []);

  useEffect(() => {
    if (activeTab === "users" && searchTerm.length > 2) {
      const delayDebounceFn = setTimeout(() => {
        searchUsers(searchTerm);
      }, 500);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [searchTerm, activeTab]);

  const fetchUserDetails = async (token) => {
    try {
      const res = await fetch(`${apiUrl}/user/details`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_token: token }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCommunities = async () => {
    try {
      const res = await fetch(`${apiUrl}/community/all`);
      if (res.ok) {
        const data = await res.json();
        setCommunities(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (query) => {
    try {
      const res = await fetch(`${apiUrl}/social/search?query=${query}`);
      if (res.ok) {
        const data = await res.json();
        // Filter out self
        const filtered = data.filter(u => u._id !== user?._id);
        setUsers(filtered);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!user || (user.role !== "ORGANIZER" && user.role !== "ADMIN")) return;

    try {
      const token = getUserToken();
      const res = await fetch(`${apiUrl}/community/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newName,
          description: newDesc,
          profileImage: newImage,
          rules: newRules.split('\n').filter(rule => rule.trim() !== ""),
          user_token: token,
          userId: user._id,
          organizerId: user._id,
          ownerId: user._id,
          user: user._id, // Add generic user field
          id: user._id,   // Add generic id field
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        fetchCommunities();
        setNewName("");
        setNewDesc("");
        setNewRules("");
        setNewImage("🏛️");
        setIsCustomImage(false);
        // Update local user state to reflect new count if needed
        fetchUserDetails(token);
      } else {
        const data = await res.json();
        alert(data.msg || "Failed to create community");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleJoin = async (communityId) => {
    try {
      const res = await fetch(`${apiUrl}/community/join/${communityId}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getUserToken()}`,
        },
      });
      if (res.ok) {
        // Update local state: add user to members list of that community
        setCommunities(prev => prev.map(c => {
            if (c._id === communityId) {
                const newMembers = c.members ? [...c.members] : [];
                if (user?._id && !newMembers.includes(user._id)) {
                    newMembers.push(user._id);
                }
                return { ...c, members: newMembers };
            }
            return c;
        }));
      } else {
        const data = await res.json();
        alert(data.msg || "Failed to join community");
      }
    } catch (e) { console.error(e); }
  };

  const handleFollow = async (targetUserId) => {
    try {
      const res = await fetch(`${apiUrl}/social/follow`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getUserToken()}`,
        },
        body: JSON.stringify({ targetUserId, user_token: getUserToken() }),
      });
      if (res.ok) {
        const data = await res.json();
        // Update local user following list
        setUser(prev => ({
            ...prev,
            following: [...(prev.following || []), targetUserId],
            friends: data.isFriend ? [...(prev.friends || []), targetUserId] : (prev.friends || [])
        }));
      }
    } catch (e) { console.error(e); }
  };

  const handleUnfollow = async (targetUserId) => {
    try {
      const res = await fetch(`${apiUrl}/social/unfollow`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getUserToken()}`,
        },
        body: JSON.stringify({ targetUserId, user_token: getUserToken() }),
      });
      if (res.ok) {
        setUser(prev => ({
            ...prev,
            following: (prev.following || []).filter(id => id !== targetUserId),
            friends: (prev.friends || []).filter(id => id !== targetUserId)
        }));
      }
    } catch (e) { console.error(e); }
  };

  // Helper to check if user follows someone
  const isFollowing = (targetId) => {
    return user?.following?.includes(targetId);
  };

  const handleLeave = async (communityId) => {
    if (!confirm("Are you sure you want to leave this community?")) return;
    try {
      const res = await fetch(`${apiUrl}/community/leave/${communityId}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getUserToken()}`,
        },
      });
      if (res.ok) {
        setCommunities(prev => prev.map(c => {
            if (c._id === communityId) {
                return { ...c, members: c.members.filter(m => m !== user._id) };
            }
            return c;
        }));
      } else {
        const data = await res.json();
        alert(data.msg || "Failed to leave community");
      }
    } catch (e) { console.error(e); }
  };

  const handleDeleteCommunity = async (communityId) => {
    if (!confirm("Are you sure you want to delete this community? This action cannot be undone.")) return;
    try {
      const res = await fetch(`${apiUrl}/community/${communityId}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${getUserToken()}`,
        },
      });
      if (res.ok) {
        setCommunities(prev => prev.filter(c => c._id !== communityId));
      } else {
        const data = await res.json();
        alert(data.msg || "Failed to delete community");
      }
    } catch (e) { console.error(e); }
  };

  // Helper to check if user is friends with someone
  const isFriend = (targetId) => {
    return user?.friends?.includes(targetId);
  };

  return (
    <div className="pt-6 lg:pt-8 min-h-screen bg-gray-50 pb-32">
      <UserNavBar />
      
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header & Tabs */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 heading-font">
              {activeTab === "communities" ? "Discover Communities" : "Find People"}
            </h1>
            <p className="text-gray-500 mt-1">
              {activeTab === "communities" 
                ? "Join groups that match your interests" 
                : "Connect with students and organizers"}
            </p>
          </div>

          <div className="flex bg-white rounded-xl p-1 shadow-sm border border-gray-100">
            <button
              onClick={() => setActiveTab("communities")}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "communities"
                  ? "bg-[color:var(--secondary-color)] text-white shadow-md"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Communities
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "users"
                  ? "bg-[color:var(--secondary-color)] text-white shadow-md"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              People
            </button>
          </div>
        </div>

        {/* Search & Actions */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-grow">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={activeTab === "communities" ? "Search communities..." : "Search users by name..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[color:var(--secondary-color)]/20 focus:border-[color:var(--secondary-color)] outline-none"
            />
          </div>

          {activeTab === "communities" && (user?.role === "ORGANIZER" || user?.role === "ADMIN") && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-[color:var(--secondary-color)] text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:translate-y-[-2px] transition-all whitespace-nowrap"
            >
              <FiPlus /> Create Community
            </button>
          )}
        </div>

        {/* Content */}
        {activeTab === "communities" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {communities
              .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
              .map((community) => {
                const userId = user?._id ? String(user._id) : null;
                const creatorId = community.creator?._id ? String(community.creator._id) : String(community.creator);
                
                const isCreator = userId && creatorId === userId;
                const isMember = isCreator || (community.members || []).some(m => String(m) === userId);

                return (
                  <CommunityCard
                    key={community._id}
                    community={community}
                    isMember={isMember} 
                    isCreator={isCreator}
                    onJoin={handleJoin}
                    onEnter={(id) => router.push(`/users/community/${id}`)}
                    onLeave={handleLeave}
                    onDelete={handleDeleteCommunity}
                  />
                );
              })}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.length > 0 ? (
              users.map(u => (
                <UserCard 
                    key={u._id} 
                    user={u} 
                    router={router}
                    onFollow={handleFollow}
                    onUnfollow={handleUnfollow}
                    isFollowing={isFollowing(u._id)}
                    isFriend={isFriend(u._id)}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-gray-500">
                {searchTerm.length > 2 ? "No users found." : "Type at least 3 characters to search."}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}></div>
          <div className="relative bg-white rounded-[2rem] w-full max-w-lg p-8 shadow-2xl animate-fadeIn border border-gray-100 max-h-[90vh] overflow-y-auto custom-scrollbar pb-32 md:pb-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 heading-font">Create Community</h2>
                <p className="text-gray-500 text-sm mt-1">Start a new space for students</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors">
                 <FiTrash2 className="rotate-45" /> {/* Using Trash icon rotated as Close X for now, or just import X */}
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-6">
              {/* Image Upload */}
              <div className="flex justify-center mb-6">
                 <div className="relative group cursor-pointer">
                    <div className="h-24 w-24 rounded-2xl bg-gray-50 flex items-center justify-center text-4xl overflow-hidden border-2 border-dashed border-gray-200 group-hover:border-[color:var(--secondary-color)] transition-all shadow-sm">
                        {newImage && (newImage.startsWith('http') || newImage.startsWith('/')) ? (
                            <img src={newImage} alt="Preview" className="h-full w-full object-cover" />
                        ) : (
                            newImage || "📸"
                        )}
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-[color:var(--secondary-color)] text-white p-2 rounded-full shadow-lg">
                        <FiPlus size={16} />
                    </div>
                    <input 
                        type="file" 
                        accept="image/*" 
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => uploadCommunityImage(e.target.files?.[0])}
                    />
                 </div>
              </div>

              <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Community Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Computer Science Club"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full px-5 py-4 rounded-xl border border-gray-200 focus:ring-4 focus:ring-[color:var(--secondary-color)]/10 focus:border-[color:var(--secondary-color)] outline-none bg-gray-50 focus:bg-white transition-all font-bold text-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Description</label>
                    <textarea
                      required
                      placeholder="What is this community about?"
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      className="w-full px-5 py-4 rounded-xl border border-gray-200 focus:ring-4 focus:ring-[color:var(--secondary-color)]/10 focus:border-[color:var(--secondary-color)] outline-none bg-gray-50 focus:bg-white transition-all min-h-[100px] resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">
                        Rules <span className="text-gray-400 font-normal">(One per line)</span>
                    </label>
                    <textarea
                      placeholder="1. Be respectful&#10;2. No spam&#10;3. Have fun"
                      value={newRules}
                      onChange={(e) => setNewRules(e.target.value)}
                      className="w-full px-5 py-4 rounded-xl border border-gray-200 focus:ring-4 focus:ring-[color:var(--secondary-color)]/10 focus:border-[color:var(--secondary-color)] outline-none bg-gray-50 focus:bg-white transition-all min-h-[120px]"
                    />
                  </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isUploading}
                  className="w-full py-4 bg-gradient-to-r from-[color:var(--secondary-color)] to-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all text-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isUploading ? "Uploading Image..." : <>Create Community <FiArrowRight /></>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
