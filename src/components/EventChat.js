import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { getUserToken } from "@/utils/getUserToken";
import { FiSend, FiX, FiCornerUpLeft, FiMessageSquare } from 'react-icons/fi';
import { API_URL } from "@/utils/config";

let socket;

export default function EventChat({ eventId, eventName }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [user, setUser] = useState(null);
    const [replyTo, setReplyTo] = useState(null);
    const [isHovered, setIsHovered] = useState(null);
    const scrollRef = useRef();
    const inputRef = useRef();

    useEffect(() => {
        const token = getUserToken();
        if (token) {
             fetch(`${API_URL}/user/details`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_token: token }),
            })
            .then(res => res.json())
            .then(data => setUser(data))
            .catch(err => console.error(err));
        }
    }, []);

    useEffect(() => {
        if (!eventId) return;

        if (!socket) {
            socket = io(API_URL, {
                transports: ["websocket", "polling"],
                withCredentials: true
            });
        }

        socket.emit("join_event", eventId);

        const handleReceiveMessage = (msg) => {
            if (msg.eventId === eventId) {
                setMessages((prev) => [...prev, msg]);
            }
        };

        socket.on("receive_message", handleReceiveMessage);

        return () => {
            socket.off("receive_message", handleReceiveMessage);
        };
    }, [eventId]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isOpen, replyTo]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (!input.trim() || !user) return;

        const msgData = {
            eventId,
            user: { name: user.username || user.displayName || "Anonymous", id: user._id },
            message: input,
            timestamp: new Date().toISOString(),
            replyTo: replyTo ? {
                user: replyTo.user.name,
                message: replyTo.message,
                id: replyTo.user.id
            } : null
        };

        socket.emit("send_message", msgData);
        setInput("");
        setReplyTo(null);
    };

    if (!user) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 font-sans" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            {/* Chat Window */}
            <div className={`transition-all duration-300 ease-in-out transform ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-10 pointer-events-none absolute bottom-0 right-0'}`}>
                <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl w-[90vw] sm:w-96 h-[500px] max-h-[80vh] flex flex-col border border-white/20 overflow-hidden">
                    {/* Header */}
                    <div className="p-4 bg-gradient-to-r from-[color:var(--darker-secondary-color)] to-[color:var(--secondary-color)] text-white flex justify-between items-center shadow-md">
                        <div className="flex flex-col">
                            <span className="font-bold text-lg truncate pr-2 tracking-tight">{eventName || "Event Chat"}</span>
                            <span className="text-xs text-white/80 font-medium">Live Discussion</span>
                        </div>
                        <button 
                            onClick={() => setIsOpen(false)} 
                            className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-colors"
                        >
                            <FiX size={20} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 scrollbar-thin scrollbar-thumb-gray-300">
                        {messages.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 space-y-3 opacity-60">
                                <FiMessageSquare size={40} />
                                <p className="text-sm font-medium">No messages yet.<br/>Start the conversation!</p>
                            </div>
                        )}
                        
                        {messages.map((msg, i) => {
                            const isMe = msg.user.id === user._id;
                            return (
                                <div 
                                    key={i} 
                                    className={`flex flex-col ${isMe ? "items-end" : "items-start"} group relative`}
                                    onMouseEnter={() => setIsHovered(i)}
                                    onMouseLeave={() => setIsHovered(null)}
                                >
                                    <span className="text-[10px] text-gray-500 mb-1 px-1 font-semibold opacity-70">
                                        {msg.user.name}
                                    </span>
                                    
                                    <div className={`flex items-end gap-2 max-w-[85%]`}>
                                        {!isMe && (
                                            <button 
                                                onClick={() => { setReplyTo(msg); inputRef.current?.focus(); }}
                                                className={`text-gray-400 hover:text-[color:var(--secondary-color)] p-1 rounded-full transition-opacity ${isHovered === i ? 'opacity-100' : 'opacity-0'} lg:group-hover:opacity-100`}
                                                title="Reply"
                                            >
                                                <FiCornerUpLeft size={14} />
                                            </button>
                                        )}

                                        <div className={`relative px-4 py-2.5 rounded-2xl shadow-sm text-sm leading-relaxed break-words ${
                                            isMe 
                                            ? "bg-gradient-to-br from-[color:var(--darker-secondary-color)] to-[color:var(--secondary-color)] text-white rounded-tr-sm" 
                                            : "bg-white border border-gray-100 text-gray-800 rounded-tl-sm"
                                        }`}>
                                            {/* Reply Context */}
                                            {msg.replyTo && (
                                                <div className={`mb-2 text-xs border-l-2 pl-2 rounded-r py-1 ${
                                                    isMe 
                                                    ? "border-white/30 bg-white/10 text-white/90" 
                                                    : "border-gray-300 bg-gray-50 text-gray-500"
                                                }`}>
                                                    <div className="font-bold flex items-center gap-1">
                                                        <FiCornerUpLeft size={10} />
                                                        {msg.replyTo.user}
                                                    </div>
                                                    <div className="truncate opacity-80">{msg.replyTo.message}</div>
                                                </div>
                                            )}
                                            
                                            {msg.message}
                                        </div>

                                        {isMe && (
                                            <button 
                                                onClick={() => { setReplyTo(msg); inputRef.current?.focus(); }}
                                                className={`text-gray-400 hover:text-[color:var(--secondary-color)] p-1 rounded-full transition-opacity ${isHovered === i ? 'opacity-100' : 'opacity-0'} lg:group-hover:opacity-100`}
                                                title="Reply"
                                            >
                                                <FiCornerUpLeft size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={scrollRef} />
                    </div>

                    {/* Input Area */}
                    <div className="bg-white border-t border-gray-100 p-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                        {replyTo && (
                            <div className="flex justify-between items-center mb-2 px-3 py-2 bg-gray-50 border-l-4 border-[color:var(--secondary-color)] rounded-r text-xs">
                                <div>
                                    <span className="font-bold text-[color:var(--darker-secondary-color)]">Replying to {replyTo.user.name}</span>
                                    <p className="text-gray-500 truncate max-w-[200px]">{replyTo.message}</p>
                                </div>
                                <button onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-gray-600">
                                    <FiX size={14} />
                                </button>
                            </div>
                        )}
                        <form onSubmit={sendMessage} className="flex gap-2 items-center">
                            <input
                                ref={inputRef}
                                type="text"
                                inputMode="text"
                                className="flex-1 bg-gray-100 text-gray-800 border-0 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--secondary-color)] focus:bg-white transition-all placeholder:text-gray-400 font-medium"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={replyTo ? "Type your reply..." : "Type a message..."}
                            />
                            <button 
                                type="button"
                                onClick={() => {
                                    if (inputRef.current) {
                                        inputRef.current.focus();
                                        // Trigger emoji keyboard on mobile devices
                                        if (/Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                                            inputRef.current.click();
                                        }
                                    }
                                }}
                                className="text-gray-500 hover:text-[color:var(--secondary-color)] p-2 rounded-full hover:bg-gray-100 transition-colors"
                                title="Add emoji"
                            >
                                😊
                            </button>
                            <button 
                                type="submit" 
                                disabled={!input.trim()}
                                className="bg-[color:var(--darker-secondary-color)] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-[color:var(--secondary-color)] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                            >
                                <FiSend className="ml-0.5" size={16} />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
            
            {/* Toggle Button */}
            <div className={`transition-all duration-300 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}>
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-gradient-to-r from-[color:var(--darker-secondary-color)] to-[color:var(--secondary-color)] text-white p-4 rounded-full shadow-lg shadow-[color:var(--secondary-color)]/30 hover:shadow-[color:var(--secondary-color)]/50 transition-all hover:scale-110 active:scale-95 flex items-center justify-center group"
                >
                    <FiMessageSquare className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                    {messages.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                            {messages.length > 9 ? '9+' : messages.length}
                        </span>
                    )}
                </button>
            </div>
        </div>
    );
}
