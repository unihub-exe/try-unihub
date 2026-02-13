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
                    authorId: user.user_token || user._id, 
                    authorType: user.role === 'ADMIN' ? 'Admin' : 'User',
                    authorName: user.displayName || user.username || user.name,
                    authorAvatar: user.avatar || null // Include avatar
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
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return "Today";
        if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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
        <div className="h-screen flex flex-col font-sans bg-[#efeae2] overflow-hidden">
            {/* ===== HEADER (WhatsApp-style) ===== */}
            <div className="bg-[#202c33] px-2 md:px-4 py-2 flex items-center justify-between z-40 flex-shrink-0">
                <div className="flex items-center gap-2 md:gap-3 min-w-0">
                    <button 
                        onClick={() => router.push("/users/community")} 
                        className="p-1.5 rounded-full text-[#aebac1] hover:text-white transition-colors flex-shrink-0"
                    >
                        <FiArrowLeft className="text-xl" />
                    </button>
                    <div className="h-10 w-10 rounded-full bg-[#2a3942] overflow-hidden flex-shrink-0">
                        {community.profileImage ? (
                            <img src={community.profileImage} className="h-full w-full object-cover" alt="" />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center text-xl">🏛️</div>
                        )}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <h1 className="text-[#e9edef] text-base font-medium leading-tight truncate">{community.name}</h1>
                        <span className="text-[#8696a0] text-xs truncate">
                            {community.members?.length || 0} members
                        </span>
                    </div>
                </div>
                
                <div className="flex items-center gap-1 flex-shrink-0">
                    {!isMember ? (
                        <button 
                            onClick={() => setShowRules(true)}
                            className="px-4 py-1.5 bg-[#00a884] text-white text-sm font-medium rounded-full hover:bg-[#06cf9c] transition-all"
                        >
                            Join
                        </button>
                    ) : (
                        <>
                            {isAdmin && (
                                <button 
                                    onClick={() => router.push(`/users/eventform?communityId=${communityId}`)}
                                    className="p-2 text-[#aebac1] hover:text-white rounded-full transition-colors"
                                    title="Create Event"
                                >
                                    <FiCalendar size={20} />
                                </button>
                            )}
                            <div className="relative">
                                <button 
                                    onClick={() => setShowMenu(!showMenu)}
                                    className="p-2 text-[#aebac1] hover:text-white rounded-full transition-colors"
                                >
                                    <FiMoreVertical size={20} />
                                </button>
                                {showMenu && (
                                    <div className="absolute right-0 top-full mt-1 bg-[#233138] rounded-lg shadow-xl py-2 min-w-[180px] z-50 border border-[#2a3942]">
                                        <button 
                                            onClick={() => { setShowMenu(false); }}
                                            className="w-full text-left px-4 py-2.5 text-[#d1d7db] text-sm hover:bg-[#182229] transition-colors"
                                        >
                                            Community info
                                        </button>
                                        {isCreator && (
                                            <button 
                                                onClick={() => { setShowMenu(false); handleDeleteCommunity(); }}
                                                className="w-full text-left px-4 py-2.5 text-red-400 text-sm hover:bg-[#182229] transition-colors"
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
                className="flex-1 overflow-y-auto px-3 md:px-[6%] lg:px-[12%] py-4"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c8c0b8' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    backgroundColor: "#efeae2",
                }}
                onClick={() => showMenu && setShowMenu(false)}
            >
                {/* Community Welcome Banner */}
                <div className="bg-[#fffffff0] rounded-lg p-4 mb-4 text-center shadow-sm mx-auto max-w-sm border border-[#e9edef]">
                    <div className="h-16 w-16 mx-auto rounded-full bg-[#dfe5e7] overflow-hidden mb-3 flex items-center justify-center text-3xl">
                        {community.profileImage ? (
                            <img src={community.profileImage} className="h-full w-full object-cover" alt="" />
                        ) : "🏛️"}
                    </div>
                    <h2 className="font-semibold text-[#111b21] text-lg">{community.name}</h2>
                    <p className="text-[#667781] text-sm mt-1 leading-relaxed">{community.description}</p>
                    <div className="mt-3 flex items-center justify-center gap-1 text-[#667781] text-xs">
                        <span>Community · {community.members?.length || 0} members</span>
                    </div>
                </div>

                {/* Messages */}
                {reversedPosts.map((post, index) => {
                    const isMe = user?._id === post.authorId || user?._id === post.author;
                    const prevPost = index > 0 ? reversedPosts[index - 1] : null;
                    const isSameAuthor = prevPost && (prevPost.authorId === post.authorId || prevPost.author === post.author);
                    
                    // Show username if different author from previous message OR if it's been more than 2 minutes
                    const timeDiff = prevPost ? new Date(post.createdAt) - new Date(prevPost.createdAt) : Infinity;
                    const showAvatar = !isSameAuthor || timeDiff > 120000; // 2 minutes

                    // Date separator
                    const currentDate = new Date(post.createdAt).toDateString();
                    const prevDate = prevPost ? new Date(prevPost.createdAt).toDateString() : null;
                    const showDateSeparator = !prevPost || currentDate !== prevDate;

                    // Get avatar URL - use actual avatar or fallback to generated
                    const getAvatarUrl = (authorAvatar, authorName) => {
                        if (authorAvatar) return authorAvatar;
                        return `https://api.dicebear.com/7.x/avataaars/svg?seed=${authorName || 'user'}`;
                    };

                    // Safe avatar URLs with null checks
                    const myAvatarUrl = user?.avatar || getAvatarUrl(null, user?.username || user?.displayName || 'me');
                    const otherAvatarUrl = getAvatarUrl(post.authorAvatar, post.authorName);

                    return (
                        <React.Fragment key={post._id}>
                            {/* Date Separator */}
                            {showDateSeparator && (
                                <div className="flex justify-center my-5">
                                    <span className="bg-white/95 backdrop-blur-sm text-[#667781] text-[11px] font-semibold px-4 py-1.5 rounded-full shadow-sm border border-gray-100">
                                        {formatDateSeparator(post.createdAt)}
                                    </span>
                                </div>
                            )}

                            {/* Message Container - CRITICAL: isMe determines left/right alignment */}
                            <div className={`flex w-full gap-2 ${isMe ? 'justify-end flex-row-reverse' : 'justify-start flex-row'} group ${showAvatar ? 'mt-4' : 'mt-1'}`}>
                                {/* Avatar - Always visible but can be invisible for spacing */}
                                <div className={`flex-shrink-0 ${showAvatar ? 'visible' : 'invisible'}`}>
                                    <div 
                                        className="h-10 w-10 rounded-full overflow-hidden shadow-sm border-2 border-white cursor-pointer hover:scale-110 transition-transform"
                                        style={{ backgroundColor: getNameColor(post.authorName || 'user') + '30' }}
                                        onClick={() => !isMe && isAdmin && handleUserClick(post)}
                                    >
                                        <img 
                                            src={isMe ? myAvatarUrl : otherAvatarUrl} 
                                            alt={isMe ? 'You' : (post.authorName || 'User')}
                                            className="h-full w-full object-cover"
                                            onError={(e) => {
                                                // Fallback if image fails to load
                                                e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${isMe ? 'me' : (post.authorName || 'user')}`;
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Message Content */}
                                <div className={`relative max-w-[75%] md:max-w-[60%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    {/* Username & Time (Only for others, only when showing avatar) */}
                                    {!isMe && showAvatar && (
                                        <div className="flex items-center gap-2 mb-1 px-1">
                                            <span 
                                                className="text-[13px] font-bold cursor-pointer hover:underline"
                                                style={{ color: getNameColor(post.authorName || 'user') }}
                                                onClick={() => isAdmin && handleUserClick(post)}
                                            >
                                                {post.authorName || 'Unknown User'}
                                            </span>
                                            {post.authorType === 'Admin' && (
                                                <BsShieldFillCheck className="text-[#00a884] text-xs" />
                                            )}
                                            <span className="text-[11px] text-[#8696a0]">
                                                {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    )}

                                    {/* Message Bubble */}
                                    <div 
                                        className={`relative px-4 py-2.5 text-[14.5px] leading-[20px] shadow-sm transition-all ${
                                            isMe 
                                            ? 'bg-gradient-to-br from-[#0084ff] to-[#0066cc] text-white rounded-[18px] rounded-br-md' 
                                            : 'bg-white text-[#111b21] rounded-[18px] rounded-tl-md border border-gray-100'
                                        } ${isAdmin && !isMe ? 'cursor-pointer hover:shadow-md' : ''}`}
                                        onContextMenu={(e) => {
                                            e.preventDefault();
                                            if (isAdmin && !isMe) handleUserClick(post);
                                        }}
                                    >
                                        {/* Pinned Indicator */}
                                        {post.isPinned && (
                                            <div className={`text-[10px] font-bold mb-1.5 flex items-center gap-1 uppercase tracking-wide ${isMe ? 'text-blue-100' : 'text-[#00a884]'}`}>
                                                <BsPinAngleFill size={9} /> Pinned
                                            </div>
                                        )}

                                        {/* Image */}
                                        {post.image && (
                                            <div className="mb-2 rounded-xl overflow-hidden -mx-1 -mt-1">
                                                <img src={post.image} alt="attachment" className="max-w-full h-auto object-cover rounded-xl" />
                                            </div>
                                        )}

                                        {/* Content */}
                                        <div className="whitespace-pre-wrap break-words">
                                            {post.content}
                                        </div>

                                        {/* Timestamp (Only for own messages or when not showing avatar) */}
                                        {(isMe || !showAvatar) && (
                                            <div className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${
                                                isMe ? 'text-blue-100' : 'text-[#667781]'
                                            }`}>
                                                <span>{new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                {isMe && <BsCheck2All className="text-white text-sm" />}
                                            </div>
                                        )}
                                    </div>

                                    {/* Admin Actions (Hover) */}
                                    {isAdmin && (
                                        <div className={`absolute top-0 ${isMe ? 'left-0 -translate-x-full pr-2' : 'right-0 translate-x-full pl-2'} flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all`}>
                                            <button 
                                                onClick={() => handlePinPost(post._id)} 
                                                className="p-1.5 bg-white rounded-full shadow-lg text-[#8696a0] hover:text-[#00a884] hover:scale-110 transition-all border border-gray-100" 
                                                title="Pin"
                                            >
                                                <BsPinAngleFill size={13} />
                                            </button>
                                            <button 
                                                onClick={() => handleDeletePost(post._id)} 
                                                className="p-1.5 bg-white rounded-full shadow-lg text-[#8696a0] hover:text-red-500 hover:scale-110 transition-all border border-gray-100" 
                                                title="Delete"
                                            >
                                                <FiTrash2 size={13} />
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
                <div className="bg-[#f0f2f5] px-2 md:px-4 py-2 flex-shrink-0">
                    <div className="max-w-4xl mx-auto w-full">
                        {/* Image Preview */}
                        {postImage && (
                            <div className="relative mb-2 inline-block bg-white rounded-lg p-2 shadow-sm">
                                <img src={postImage} alt="Preview" className="h-24 rounded-md object-cover" />
                                <button 
                                    onClick={() => setPostImage("")} 
                                    className="absolute -top-2 -right-2 bg-[#54656f] text-white rounded-full p-1 shadow-md hover:bg-[#3b4a54] transition-colors"
                                >
                                    <FiTrash2 size={12} />
                                </button>
                            </div>
                        )}
                        
                        <form onSubmit={handlePost} className="flex items-end gap-2">
                            {/* Attachment Button */}
                            <label className="p-2.5 text-[#54656f] hover:text-[#00a884] cursor-pointer transition-colors flex-shrink-0 rounded-full hover:bg-[#e9edef]">
                                <FiPlus size={22} />
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadImage(e.target.files?.[0])} />
                            </label>

                            {/* Message Input */}
                            <div className="flex-1 bg-white rounded-lg flex items-end min-h-[42px] shadow-sm">
                                <textarea
                                    ref={textareaRef}
                                    value={content}
                                    onChange={handleTextareaChange}
                                    placeholder="Type a message"
                                    className="flex-1 bg-transparent border-none outline-none text-[#3b4a54] placeholder-[#8696a0] py-[9px] px-3 max-h-[120px] min-h-[42px] resize-none text-[15px] leading-[20px]"
                                    rows="1"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handlePost(e);
                                        }
                                    }}
                                />
                            </div>

                            {/* Send Button */}
                            <button 
                                type="submit"
                                disabled={(!content.trim() && !postImage) || isUploading}
                                className={`p-2.5 rounded-full transition-all flex-shrink-0 ${
                                    (!content.trim() && !postImage) 
                                    ? 'bg-transparent text-[#8696a0]' 
                                    : 'bg-[#00a884] text-white hover:bg-[#06cf9c] shadow-md'
                                }`}
                            >
                                {isUploading ? (
                                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                                ) : (
                                    <FiSend size={20} />
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            ) : (
                <div className="bg-[#f0f2f5] border-t border-[#e9edef] p-4 pb-6 text-center flex-shrink-0">
                    <button 
                        onClick={() => setShowRules(true)} 
                        className="w-full max-w-md bg-[#00a884] text-white font-medium py-3 rounded-lg hover:bg-[#06cf9c] transition-all active:scale-[0.98]"
                    >
                        Join Community to Chat
                    </button>
                </div>
            )}

            {/* ===== RULES MODAL ===== */}
            {showRules && (
                <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4" onClick={() => setShowRules(false)}>
                    <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="bg-[#008069] p-6 text-white text-center">
                            <div className="h-16 w-16 bg-white/20 rounded-full mx-auto flex items-center justify-center text-3xl mb-3">
                                📜
                            </div>
                            <h2 className="text-xl font-semibold">Community Rules</h2>
                            <p className="text-white/80 text-sm mt-1">Please review before joining</p>
                        </div>
                        
                        <div className="p-5 max-h-60 overflow-y-auto space-y-3">
                            {community.rules && community.rules.length > 0 ? (
                                community.rules.map((rule, i) => (
                                    <div key={i} className="flex gap-3 text-sm text-[#3b4a54]">
                                        <span className="font-bold text-[#00a884] flex-shrink-0">{i + 1}.</span>
                                        <span>{rule}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-[#8696a0] italic">No specific rules — just be respectful!</p>
                            )}
                        </div>

                        <div className="flex border-t border-[#e9edef]">
                            <button 
                                onClick={() => setShowRules(false)} 
                                className="flex-1 py-3.5 text-[#667781] font-medium hover:bg-[#f0f2f5] transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmJoin} 
                                className="flex-1 py-3.5 text-[#00a884] font-semibold hover:bg-[#f0f2f5] transition-colors border-l border-[#e9edef]"
                            >
                                I Agree & Join
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== USER MANAGEMENT MODAL ===== */}
            {selectedUser && (
                <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4" onClick={() => setSelectedUser(null)}>
                    <div className="bg-white rounded-xl w-full max-w-xs shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="bg-[#202c33] p-5 text-center">
                            <div className="h-20 w-20 mx-auto rounded-full bg-[#2a3942] overflow-hidden mb-3 border-4 border-[#2a3942]">
                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.name}`} alt="avatar" />
                            </div>
                            <h3 className="font-semibold text-lg text-[#e9edef]">{selectedUser.name}</h3>
                            <span className="inline-block px-3 py-1 rounded-full bg-[#2a3942] text-xs font-medium text-[#8696a0] mt-1 uppercase tracking-wide">
                                {selectedUser.role}
                            </span>
                        </div>

                        <div className="p-4 space-y-2">
                            <p className="text-xs font-medium text-[#8696a0] uppercase tracking-wider mb-2">Change Role</p>
                            {['member', 'partner', 'admin'].map((role) => (
                                <button 
                                    key={role}
                                    onClick={() => handleUpdateRole(role)}
                                    className={`w-full py-3 rounded-lg flex items-center justify-between px-4 transition-all capitalize ${
                                        selectedUser.role === role 
                                        ? 'bg-[#00a884] text-white' 
                                        : 'bg-[#f0f2f5] hover:bg-[#e9edef] text-[#3b4a54]'
                                    }`}
                                >
                                    <span>{role}</span>
                                    {selectedUser.role === role && (
                                        role === 'admin' ? <FiShield /> : role === 'partner' ? <BsShieldFillCheck /> : <FiStar />
                                    )}
                                </button>
                            ))}
                            
                            <div className="h-px bg-[#e9edef] my-3"></div>
                            
                            <button 
                                onClick={() => setRemoveMemberModal(selectedUser)}
                                className="w-full py-3 rounded-lg bg-red-50 text-red-600 font-medium hover:bg-red-100 transition-all flex items-center justify-center gap-2"
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
                <div className="fixed top-20 right-6 z-50 animate-fadeIn">
                    <div className={`px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 ${message.type === 'error' ? 'bg-red-50 text-red-700 border-2 border-red-200' : 'bg-green-50 text-green-700 border-2 border-green-200'}`}>
                        <span className="font-bold">{message.text}</span>
                        <button onClick={() => setMessage(null)} className="p-1 hover:bg-black/5 rounded-full">
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
