import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { getUserToken } from "@/utils/getUserToken";
import ReportButton from "@/components/ReportButton";
import ConfirmModal from "@/components/ConfirmModal";
import { FiSend, FiArrowLeft, FiImage, FiTrash2, FiMoreVertical, FiCalendar, FiUserX, FiShield, FiStar, FiSmile, FiPlus } from "react-icons/fi";
import { BsPinAngleFill, BsShieldFillCheck, BsCheck2All, BsCheck2 } from "react-icons/bs";
import { io } from "socket.io-client";
import { API_URL } from "@/utils/config";

export default function CommunityChat() {
    const router = useRouter();
    const { id: communityId } = router.query;
    
    const [community, setCommunity] = useState(null);
    const [posts, setPosts] = useState([]);
    const [content, setContent] = useState("");
    const [postImage, setPostImage] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showRules, setShowRules] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showMenu, setShowMenu] = useState(false);
    const [deleteModal, setDeleteModal] = useState(null);
    const [removeMemberModal, setRemoveMemberModal] = useState(null);
    const [message, setMessage] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const apiUrl = API_URL;
    const socketRef = useRef();
    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);
    const textareaRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [posts]);

    useEffect(() => {
        if (!communityId) return;
        const token = getUserToken();
        if (!token) {
            router.push("/users/signin");
            return;
        }

        fetchUserDetails(token);
        fetchCommunityDetails();
        fetchPosts();

        // Socket Setup
        socketRef.current = io(apiUrl, { 
            transports: ["websocket", "polling"],
            withCredentials: true
        });
        socketRef.current.on("new_post", (post) => {
            if (post.communityId === communityId && !post.parentPostId) {
                setPosts(prev => [post, ...prev]);
            }
        });

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, [communityId]);

    const fetchUserDetails = async (token) => {
        try {
            const res = await fetch(`${apiUrl}/user/details`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_token: token })
            });
            if (res.ok) setUser(await res.json());
        } catch (e) { console.error(e); }
    };

    const fetchCommunityDetails = async () => {
        try {
            const res = await fetch(`${apiUrl}/community/details/${communityId}`);
            if (res.ok) setCommunity(await res.json());
            else router.push("/users/community");
        } catch (e) { console.error(e); }
    };

    const fetchPosts = async () => {
        try {
            const res = await fetch(`${apiUrl}/community/posts/${communityId}?parentPostId=null`);
            if (res.ok) {
                const data = await res.json();
                setPosts(data); 
            }
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const uploadImage = async (file) => {
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
            setPostImage(json.url);
        } catch (e) {
            setMessage({ type: "error", text: "Image upload failed" });
        } finally {
            setIsUploading(false);
        }
    };

    const confirmJoin = async () => {
        try {
            const res = await fetch(`${apiUrl}/community/join/${communityId}`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${getUserToken()}`
                },
            });
            if (res.ok) {
                setShowRules(false);
                fetchCommunityDetails();
            }
        } catch (e) { console.error(e); }
    };

    const handleDeleteCommunity = async () => {
        setIsProcessing(true);
        try {
            const res = await fetch(`${apiUrl}/community/${communityId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${getUserToken()}` }
            });
            if (res.ok) {
                setMessage({ type: "success", text: "Community deleted successfully" });
                setTimeout(() => router.push("/users/community"), 1500);
            } else {
                setMessage({ type: "error", text: "Failed to delete community" });
            }
        } catch (e) { 
            console.error(e);
            setMessage({ type: "error", text: "Error deleting community" });
        } finally {
            setIsProcessing(false);
            setDeleteModal(null);
        }
    };

    const handlePinPost = async (postId) => {
        try {
            const res = await fetch(`${apiUrl}/community/post/pin`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${getUserToken()}`
                },
                body: JSON.stringify({ postId })
            });
            if (res.ok) {
                fetchPosts(); 
            }
        } catch (e) { console.error(e); }
    };

    const handleDeletePost = async (postId) => {
        setIsProcessing(true);
        try {
            const res = await fetch(`${apiUrl}/community/post/delete`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${getUserToken()}`
                },
                body: JSON.stringify({ postId })
            });
            if (res.ok) {
                setPosts(prev => prev.filter(p => p._id !== postId));
                setMessage({ type: "success", text: "Message deleted" });
            } else {
                setMessage({ type: "error", text: "Failed to delete message" });
            }
        } catch (e) { 
            console.error(e);
            setMessage({ type: "error", text: "Error deleting message" });
        } finally {
            setIsProcessing(false);
            setDeleteModal(null);
        }
    };

    const handlePost = async (e) => {
        e.preventDefault();
        if (!content.trim() && !postImage) return;

        try {
            const res = await fetch(`${apiUrl}/community/post/create`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${getUserToken()}`
                },
                body: JSON.stringify({
                    content,
                    image: postImage,
                    communityId,
                    authorId: user._id, // FIXED: Always use _id for consistency
                    authorType: user.role === 'ADMIN' ? 'Admin' : 'User',
                    authorName: user.displayName || user.username || user.name,
                    authorAvatar: user.avatar || null
                })
            });

            if (res.ok) {
                setContent("");
                setPostImage("");
                if (textareaRef.current) {
                    textareaRef.current.style.height = "auto";
                }
            }
        } catch (e) { console.error(e); }
    };

    // --- Role Management ---
    const handleUserClick = (post) => {
        if (!isAdmin) return;
        if (post.authorId === user._id) return;

        const targetId = post.authorId;
        const memberRoleObj = community.roles?.find(r => (r.user._id || r.user) === targetId);
        const currentRole = memberRoleObj?.role || 'member';

        setSelectedUser({ id: targetId, name: post.authorName, role: currentRole });
    };

    const handleUpdateRole = async (newRole) => {
        if (!selectedUser) return;
        try {
            const res = await fetch(`${apiUrl}/community/member/role/${communityId}`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${getUserToken()}`
                },
                body: JSON.stringify({ targetUserId: selectedUser.id, newRole })
            });
            if (res.ok) {
                fetchCommunityDetails();
                setSelectedUser(null);
                setMessage({ type: "success", text: "Role updated successfully" });
            } else {
                setMessage({ type: "error", text: "Failed to update role" });
            }
        } catch (e) { 
            console.error(e);
            setMessage({ type: "error", text: "Error updating role" });
        }
    };

    const handleRemoveMember = async () => {
        if (!removeMemberModal) return;
        setIsProcessing(true);
        try {
            const res = await fetch(`${apiUrl}/community/member/remove/${communityId}`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${getUserToken()}`
                },
                body: JSON.stringify({ targetUserId: removeMemberModal.id })
            });
            if (res.ok) {
                fetchCommunityDetails();
                setSelectedUser(null);
                setMessage({ type: "success", text: "Member removed successfully" });
            } else {
                setMessage({ type: "error", text: "Failed to remove member" });
            }
        } catch (e) { 
            console.error(e);
            setMessage({ type: "error", text: "Error removing member" });
        } finally {
            setIsProcessing(false);
            setRemoveMemberModal(null);
        }
    };

    // Auto-resize textarea
    const handleTextareaChange = (e) => {
        setContent(e.target.value);
        const textarea = e.target;
        textarea.style.height = "auto";
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
    };

    const userIdStr = user?._id ? String(user._id) : null;
    const creatorIdStr = community?.creator?._id ? String(community.creator._id) : String(community?.creator);
    
    // Role Logic
    const userRoleObj = community?.roles?.find(r => (r.user._id || r.user) === userIdStr);
    const userRole = userRoleObj?.role;
    
    const isCreator = userIdStr && creatorIdStr === userIdStr;
    const isAdmin = user && community && (user.role === 'ADMIN' || isCreator || userRole === 'admin');
    const isPartner = isAdmin || userRole === 'partner';
    
    const isMember = isCreator || (community?.members || []).some(m => String(m) === userIdStr);

    // Helper: format date for date separators
    const formatDateSeparator = (dateStr) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const dateOnly = date.toDateString();
        const todayOnly = today.toDateString();
        const yesterdayOnly = yesterday.toDateString();

        if (dateOnly === todayOnly) return "Today";
        if (dateOnly === yesterdayOnly) return "Yesterday";
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };

    // Helper: format time consistently
    const formatTime = (dateStr) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        return date.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    // Helper: generate consistent color from name
    const getNameColor = (name) => {
        const colors = [
            "#e17055", "#00b894", "#6c5ce7", "#fdcb6e", 
            "#e84393", "#00cec9", "#a29bfe", "#fab1a0",
            "#55a3e8", "#ff7675", "#74b9ff", "#fd79a8"
        ];
        let hash = 0;
        for (let i = 0; i < (name || "").length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    if (!community) return (
        <div className="min-h-screen bg-[#111b21] flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center">
                <div className="h-12 w-12 border-4 border-[#00a884] border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-400 text-sm">Loading community...</p>
            </div>
        </div>
    );

    // Prepare reversed posts for rendering (oldest first)
    const reversedPosts = posts.slice().reverse();

    return (
        <div className="h-screen flex flex-col font-sans bg-[#f0f2f5] overflow-hidden">
            {/* ===== HEADER (Modern Design) ===== */}
            <div className="bg-white px-4 md:px-5 py-3.5 flex items-center justify-between z-40 flex-shrink-0 shadow-sm">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button 
                        onClick={() => router.push("/users/community")} 
                        className="p-2 rounded-full text-gray-600 hover:bg-gray-100 transition-all flex-shrink-0"
                    >
                        <FiArrowLeft className="text-xl" />
                    </button>
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 overflow-hidden flex-shrink-0 shadow-sm">
                        {community.profileImage ? (
                            <img src={community.profileImage} className="h-full w-full object-cover" alt="" />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center text-white text-lg">🏛️</div>
                        )}
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                        <h1 className="text-gray-900 text-base font-semibold leading-tight truncate">{community.name}</h1>
                        <span className="text-gray-500 text-xs truncate">
                            {community.members?.length || 0} members
                        </span>
                    </div>
                </div>
                
                <div className="flex items-center gap-1 flex-shrink-0">
                    {!isMember ? (
                        <button 
                            onClick={() => setShowRules(true)}
                            className="px-5 py-2 bg-[#0084ff] text-white text-sm font-medium rounded-full hover:bg-[#0073e6] transition-all shadow-sm"
                        >
                            Join
                        </button>
                    ) : (
                        <>
                            {isAdmin && (
                                <button 
                                    onClick={() => router.push(`/users/eventform?communityId=${communityId}`)}
                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                                    title="Create Event"
                                >
                                    <FiCalendar size={20} />
                                </button>
                            )}
                            <div className="relative">
                                <button 
                                    onClick={() => setShowMenu(!showMenu)}
                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                                >
                                    <FiMoreVertical size={20} />
                                </button>
                                {showMenu && (
                                    <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-2xl py-2 min-w-[180px] z-50 border border-gray-100">
                                        <button 
                                            onClick={() => { setShowMenu(false); }}
                                            className="w-full text-left px-4 py-2.5 text-gray-700 text-sm hover:bg-gray-50 transition-colors"
                                        >
                                            Community info
                                        </button>
                                        {isCreator && (
                                            <button 
                                                onClick={() => { setShowMenu(false); setDeleteModal({ type: 'community' }); }}
                                                className="w-full text-left px-4 py-2.5 text-red-500 text-sm hover:bg-red-50 transition-colors"
                                            >
                                                Delete community
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* ===== CHAT AREA ===== */}
            <div 
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto px-4 md:px-[10%] lg:px-[18%] py-4"
                style={{ backgroundColor: "#f0f2f5" }}
                onClick={() => showMenu && setShowMenu(false)}
            >
                {/* Community Welcome Banner */}
                <div className="bg-white rounded-2xl p-5 mb-5 text-center shadow-sm mx-auto max-w-md">
                    <div className="h-14 w-14 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-purple-500 overflow-hidden mb-3 flex items-center justify-center text-2xl shadow-sm">
                        {community.profileImage ? (
                            <img src={community.profileImage} className="h-full w-full object-cover" alt="" />
                        ) : <span className="text-white">🏛️</span>}
                    </div>
                    <h2 className="font-semibold text-gray-900 text-base">{community.name}</h2>
                    <p className="text-gray-600 text-sm mt-1.5 leading-relaxed">{community.description}</p>
                    <div className="mt-2 text-gray-500 text-xs">
                        {community.members?.length || 0} members
                    </div>
                </div>

                {/* Messages */}
                {reversedPosts.map((post, index) => {
                    // BULLETPROOF: Determine if message is from current user
                    const postAuthorId = String(post.authorId || post.author || '').trim();
                    const currentUserId = String(user?._id || '').trim();
                    const isMe = postAuthorId && currentUserId && postAuthorId === currentUserId;
                    
                    console.log('Message check:', { 
                        postAuthorId, 
                        currentUserId, 
                        isMe,
                        authorName: post.authorName 
                    });
                    
                    const prevPost = index > 0 ? reversedPosts[index - 1] : null;
                    const prevAuthorId = prevPost ? String(prevPost.authorId || prevPost.author || '').trim() : null;
                    const isSameAuthor = prevAuthorId && postAuthorId === prevAuthorId;
                    
                    // Show avatar/username if:
                    // 1. Different author from previous message
                    // 2. OR more than 5 minutes since last message
                    const timeDiff = prevPost ? new Date(post.createdAt) - new Date(prevPost.createdAt) : Infinity;
                    const showUserInfo = !isSameAuthor || timeDiff > 300000; // 5 minutes

                    // Date separator
                    const currentDate = new Date(post.createdAt).toDateString();
                    const prevDate = prevPost ? new Date(prevPost.createdAt).toDateString() : null;
                    const showDateSeparator = !prevPost || currentDate !== prevDate;

                    // Get avatar URL
                    const getAvatarUrl = (authorAvatar, authorName) => {
                        if (authorAvatar) return authorAvatar;
                        return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(authorName || 'user')}`;
                    };

                    const avatarUrl = isMe 
                        ? (user?.avatar || getAvatarUrl(null, user?.username || user?.displayName || 'You'))
                        : getAvatarUrl(post.authorAvatar, post.authorName);

                    return (
                        <React.Fragment key={post._id}>
                            {/* Date Separator */}
                            {showDateSeparator && (
                                <div className="flex justify-center my-6">
                                    <span className="bg-white/90 backdrop-blur-sm text-gray-600 text-xs font-medium px-4 py-1.5 rounded-full shadow-sm">
                                        {formatDateSeparator(post.createdAt)}
                                    </span>
                                </div>
                            )}

                            {/* Message Row */}
                            <div className={`flex w-full gap-2 mb-1 group ${isMe ? 'justify-end' : 'justify-start'} ${showUserInfo ? 'mt-4' : 'mt-0.5'}`}>
                                {/* Avatar (only for others, only when showing user info) */}
                                {!isMe && (
                                    <div className={`flex-shrink-0 self-end w-8 ${showUserInfo ? 'visible' : 'invisible'}`}>
                                        <div 
                                            className="h-8 w-8 rounded-full overflow-hidden shadow-sm border-2 border-white cursor-pointer hover:scale-110 transition-transform"
                                            style={{ backgroundColor: getNameColor(post.authorName || 'user') + '20' }}
                                            onClick={() => isAdmin && handleUserClick(post)}
                                        >
                                            <img 
                                                src={avatarUrl} 
                                                alt={post.authorName || 'User'}
                                                className="h-full w-full object-cover"
                                                onError={(e) => {
                                                    e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=fallback`;
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Message Content */}
                                <div className={`flex flex-col max-w-[70%] md:max-w-[60%] ${isMe ? 'items-end' : 'items-start'}`}>
                                    {/* Username (only for others, only when showing user info) */}
                                    {!isMe && showUserInfo && (
                                        <div className="flex items-center gap-1.5 mb-1 px-2">
                                            <span 
                                                className="text-xs font-semibold cursor-pointer hover:underline"
                                                style={{ color: getNameColor(post.authorName || 'user') }}
                                                onClick={() => isAdmin && handleUserClick(post)}
                                            >
                                                {post.authorName || 'Unknown'}
                                            </span>
                                            {post.authorType === 'Admin' && (
                                                <BsShieldFillCheck className="text-[#00a884] text-xs" />
                                            )}
                                        </div>
                                    )}

                                    {/* Message Bubble */}
                                    <div 
                                        className={`relative px-3 py-2 text-[15px] leading-[20px] shadow-sm ${
                                            isMe 
                                            ? 'bg-[#0084ff] text-white rounded-[18px] rounded-br-[4px]' 
                                            : 'bg-white text-gray-900 rounded-[18px] rounded-tl-[4px] border border-gray-100'
                                        }`}
                                    >
                                        {/* Pinned Badge */}
                                        {post.isPinned && (
                                            <div className={`text-[10px] font-bold mb-1 flex items-center gap-1 ${isMe ? 'text-blue-100' : 'text-[#00a884]'}`}>
                                                <BsPinAngleFill size={9} /> PINNED
                                            </div>
                                        )}

                                        {/* Image */}
                                        {post.image && (
                                            <div className="mb-2 rounded-xl overflow-hidden -mx-1 -mt-1">
                                                <img src={post.image} alt="" className="max-w-full max-h-[280px] object-cover" />
                                            </div>
                                        )}

                                        {/* Text Content */}
                                        <div className="whitespace-pre-wrap break-words">
                                            {post.content}
                                        </div>

                                        {/* Timestamp */}
                                        <div className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${
                                            isMe ? 'text-white/70' : 'text-gray-500'
                                        }`}>
                                            <span>{formatTime(post.createdAt)}</span>
                                            {isMe && <BsCheck2All className="text-sm" />}
                                        </div>
                                    </div>

                                    {/* Admin Actions */}
                                    {isAdmin && (
                                        <div className={`absolute top-0 ${isMe ? 'left-0 -translate-x-full pr-2' : 'right-0 translate-x-full pl-2'} flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity`}>
                                            <button 
                                                onClick={() => handlePinPost(post._id)} 
                                                className="p-1.5 bg-white rounded-full shadow-md text-gray-600 hover:text-[#00a884] hover:scale-110 transition-all" 
                                                title="Pin"
                                            >
                                                <BsPinAngleFill size={11} />
                                            </button>
                                            <button 
                                                onClick={() => setDeleteModal({ type: 'post', postId: post._id })} 
                                                className="p-1.5 bg-white rounded-full shadow-md text-gray-600 hover:text-red-500 hover:scale-110 transition-all" 
                                                title="Delete"
                                            >
                                                <FiTrash2 size={11} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </React.Fragment>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* ===== INPUT AREA ===== */}
            {isMember ? (
                <div className="bg-white px-4 md:px-6 py-3 flex-shrink-0 border-t border-gray-200">
                    <div className="max-w-4xl mx-auto w-full">
                        {/* Image Preview */}
                        {postImage && (
                            <div className="relative mb-2 inline-block bg-gray-50 rounded-xl p-2">
                                <img src={postImage} alt="Preview" className="h-20 rounded-lg object-cover" />
                                <button 
                                    onClick={() => setPostImage("")} 
                                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                                >
                                    <FiTrash2 size={10} />
                                </button>
                            </div>
                        )}
                        
                        <form onSubmit={handlePost} className="flex items-center gap-2">
                            {/* Attachment Button */}
                            <label className="p-2 text-gray-500 hover:text-[#0084ff] cursor-pointer transition-colors flex-shrink-0 rounded-full hover:bg-gray-100">
                                <FiImage size={20} />
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadImage(e.target.files?.[0])} />
                            </label>

                            {/* Message Input */}
                            <div className="flex-1 bg-gray-100 rounded-full flex items-center px-4 py-1 min-h-[40px]">
                                <textarea
                                    ref={textareaRef}
                                    value={content}
                                    onChange={handleTextareaChange}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-transparent border-none outline-none text-gray-900 placeholder-gray-500 py-2 max-h-[100px] resize-none text-[15px] leading-[20px]"
                                    rows="1"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handlePost(e);
                                        }
                                    }}
                                />
                                <button 
                                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                                    type="button"
                                >
                                    <FiSmile size={18} />
                                </button>
                            </div>

                            {/* Send Button */}
                            <button 
                                type="submit"
                                disabled={(!content.trim() && !postImage) || isUploading}
                                className={`p-2.5 rounded-full transition-all flex-shrink-0 ${
                                    (!content.trim() && !postImage) 
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                                    : 'bg-[#0084ff] text-white hover:bg-[#0073e6] shadow-sm'
                                }`}
                            >
                                {isUploading ? (
                                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                                ) : (
                                    <FiSend size={16} />
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            ) : (
                <div className="bg-white border-t border-gray-200 p-4 text-center flex-shrink-0">
                    <button 
                        onClick={() => setShowRules(true)} 
                        className="w-full max-w-md bg-[#0084ff] text-white font-medium py-3 rounded-full hover:bg-[#0073e6] transition-all shadow-sm"
                    >
                        Join Community to Chat
                    </button>
                </div>
            )}

            {/* ===== RULES MODAL ===== */}
            {showRules && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowRules(false)}>
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-fadeIn" onClick={e => e.stopPropagation()}>
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white text-center">
                            <div className="h-16 w-16 bg-white/20 backdrop-blur-sm rounded-full mx-auto flex items-center justify-center text-3xl mb-3">
                                📜
                            </div>
                            <h2 className="text-xl font-bold">Community Rules</h2>
                            <p className="text-white/90 text-sm mt-1">Please review before joining</p>
                        </div>
                        
                        <div className="p-6 max-h-60 overflow-y-auto space-y-3">
                            {community.rules && community.rules.length > 0 ? (
                                community.rules.map((rule, i) => (
                                    <div key={i} className="flex gap-3 text-sm text-gray-700">
                                        <span className="font-bold text-purple-500 flex-shrink-0">{i + 1}.</span>
                                        <span>{rule}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-gray-500 italic">No specific rules — just be respectful!</p>
                            )}
                        </div>

                        <div className="flex border-t border-gray-100">
                            <button 
                                onClick={() => setShowRules(false)} 
                                className="flex-1 py-4 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmJoin} 
                                className="flex-1 py-4 text-[#0084ff] font-semibold hover:bg-blue-50 transition-colors border-l border-gray-100"
                            >
                                I Agree & Join
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== USER MANAGEMENT MODAL ===== */}
            {selectedUser && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setSelectedUser(null)}>
                    <div className="bg-white rounded-2xl w-full max-w-xs shadow-2xl overflow-hidden animate-fadeIn" onClick={e => e.stopPropagation()}>
                        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 text-center">
                            <div className="h-20 w-20 mx-auto rounded-full bg-white/10 backdrop-blur-sm overflow-hidden mb-3 border-4 border-white/20">
                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.name}`} alt="avatar" />
                            </div>
                            <h3 className="font-semibold text-lg text-white">{selectedUser.name}</h3>
                            <span className="inline-block px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-xs font-medium text-white/80 mt-2 uppercase tracking-wide">
                                {selectedUser.role}
                            </span>
                        </div>

                        <div className="p-5 space-y-2">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Change Role</p>
                            {['member', 'partner', 'admin'].map((role) => (
                                <button 
                                    key={role}
                                    onClick={() => handleUpdateRole(role)}
                                    className={`w-full py-3 rounded-xl flex items-center justify-between px-4 transition-all capitalize font-medium ${
                                        selectedUser.role === role 
                                        ? 'bg-gradient-to-r from-[#0084ff] to-[#0066cc] text-white shadow-md' 
                                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                                    }`}
                                >
                                    <span>{role}</span>
                                    {selectedUser.role === role && (
                                        role === 'admin' ? <FiShield /> : role === 'partner' ? <BsShieldFillCheck /> : <FiStar />
                                    )}
                                </button>
                            ))}
                            
                            <div className="h-px bg-gray-200 my-4"></div>
                            
                            <button 
                                onClick={() => setRemoveMemberModal(selectedUser)}
                                className="w-full py-3 rounded-xl bg-red-50 text-red-600 font-medium hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                            >
                                <FiUserX /> Remove Member
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Click outside to close menu */}
            {showMenu && (
                <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} />
            )}

            {/* Message Toast */}
            {message && (
                <div className="fixed top-24 right-6 z-50 animate-fadeIn">
                    <div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-sm ${message.type === 'error' ? 'bg-red-50/95 text-red-700 border border-red-200' : 'bg-green-50/95 text-green-700 border border-green-200'}`}>
                        <span className="font-medium">{message.text}</span>
                        <button onClick={() => setMessage(null)} className="p-1 hover:bg-black/5 rounded-full transition-colors">
                            ✕
                        </button>
                    </div>
                </div>
            )}

            {/* Delete Community Modal */}
            <ConfirmModal
                isOpen={deleteModal?.type === 'community'}
                onClose={() => setDeleteModal(null)}
                onConfirm={handleDeleteCommunity}
                title="Delete Community"
                message={`Are you sure you want to delete "${community?.name}"?\n\nThis action cannot be undone. All posts and members will be removed.`}
                confirmText="Delete Community"
                type="danger"
                isLoading={isProcessing}
            />

            {/* Delete Post Modal */}
            <ConfirmModal
                isOpen={deleteModal?.type === 'post'}
                onClose={() => setDeleteModal(null)}
                onConfirm={() => handleDeletePost(deleteModal.postId)}
                title="Delete Message"
                message="Are you sure you want to delete this message? This action cannot be undone."
                confirmText="Delete"
                type="danger"
                isLoading={isProcessing}
            />

            {/* Remove Member Modal */}
            <ConfirmModal
                isOpen={!!removeMemberModal}
                onClose={() => setRemoveMemberModal(null)}
                onConfirm={handleRemoveMember}
                title="Remove Member"
                message={`Are you sure you want to remove ${removeMemberModal?.name} from this community?`}
                confirmText="Remove"
                type="warning"
                isLoading={isProcessing}
            />
        </div>
    );
}
