import React, { useState, useRef } from "react";
import Image from "next/image";
import { FiDownload, FiMapPin, FiCalendar, FiClock, FiUser, FiCheck, FiX } from "react-icons/fi";

export default function TicketCard({ ticket, event }) {
    const [showQR, setShowQR] = useState(false);
    const ticketRef = useRef(null);

    // Generate QR code data URL using canvas
    const generateQRCode = (text) => {
        // Simple QR code generation using a data URL
        // In production, you'd use a proper QR library
        const canvas = document.createElement('canvas');
        const size = 200;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // White background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, size, size);
        
        // Black border
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, size, size);
        
        // Draw text (simplified - in production use proper QR encoding)
        ctx.fillStyle = '#000000';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('QR CODE', size/2, size/2 - 20);
        ctx.fillText(text.substring(0, 20), size/2, size/2);
        ctx.fillText(text.substring(20, 40), size/2, size/2 + 20);
        
        return canvas.toDataURL();
    };

    const downloadTicket = async () => {
        try {
            // Create a printable ticket HTML
            const ticketHTML = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Ticket - ${event.name}</title>
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            margin: 0; 
                            padding: 20px;
                            background: #f5f5f5;
                        }
                        .ticket {
                            max-width: 600px;
                            margin: 0 auto;
                            background: white;
                            border-radius: 20px;
                            overflow: hidden;
                            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                        }
                        .ticket-header {
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            padding: 30px;
                            text-align: center;
                        }
                        .ticket-body {
                            padding: 30px;
                        }
                        .qr-section {
                            text-align: center;
                            padding: 20px;
                            background: #f9f9f9;
                            border-radius: 10px;
                            margin: 20px 0;
                        }
                        .info-row {
                            display: flex;
                            justify-content: space-between;
                            padding: 15px 0;
                            border-bottom: 1px solid #eee;
                        }
                        .label { color: #666; font-size: 14px; }
                        .value { font-weight: bold; color: #333; }
                        h1 { margin: 0 0 10px 0; font-size: 28px; }
                        .ticket-id { font-size: 12px; opacity: 0.8; }
                    </style>
                </head>
                <body>
                    <div class="ticket">
                        <div class="ticket-header">
                            <h1>${event.name}</h1>
                            <div class="ticket-id">Ticket ID: ${ticket.ticketId || ticket._id}</div>
                        </div>
                        <div class="ticket-body">
                            <div class="qr-section">
                                <img src="${generateQRCode(ticket.qrToken || ticket._id)}" alt="QR Code" style="width: 200px; height: 200px;">
                                <p style="margin-top: 10px; font-size: 12px; color: #666;">Scan this code at the event entrance</p>
                            </div>
                            <div class="info-row">
                                <span class="label">Date</span>
                                <span class="value">${event.date}</span>
                            </div>
                            <div class="info-row">
                                <span class="label">Time</span>
                                <span class="value">${event.time}</span>
                            </div>
                            <div class="info-row">
                                <span class="label">Venue</span>
                                <span class="value">${event.venue}</span>
                            </div>
                            <div class="info-row">
                                <span class="label">Ticket Type</span>
                                <span class="value">${ticket.ticketType || 'General Admission'}</span>
                            </div>
                            <div class="info-row">
                                <span class="label">Attendee</span>
                                <span class="value">${ticket.attendeeName || 'Guest'}</span>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `;

            // Create blob and download
            const blob = new Blob([ticketHTML], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ticket-${event.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading ticket:', error);
            alert('Failed to download ticket. Please try again.');
        }
    };

    const getStatusIcon = () => {
        if (ticket.entry) {
            return <FiCheck className="text-green-500" />;
        }
        return <FiClock className="text-gray-400" />;
    };

    const getStatusText = () => {
        if (ticket.entry) {
            return <span className="text-green-600 font-semibold">Checked In</span>;
        }
        return <span className="text-gray-500">Not Checked In</span>;
    };

    return (
        <div ref={ticketRef} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-all">
            {/* Event Header */}
            <div className="relative h-32 bg-gradient-to-br from-[color:var(--secondary-color)] to-purple-600">
                {event.profile && (
                    <Image 
                        src={event.profile} 
                        alt={event.name}
                        fill
                        className="object-cover opacity-30"
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-white font-bold text-lg line-clamp-1">{event.name}</h3>
                    <p className="text-white/80 text-xs mt-1">Ticket ID: {(ticket.ticketId || ticket._id || '').substring(0, 12)}...</p>
                </div>
            </div>

            {/* Ticket Body */}
            <div className="p-4">
                {/* Event Details */}
                <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FiCalendar className="text-[color:var(--secondary-color)]" />
                        <span>{event.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FiClock className="text-[color:var(--secondary-color)]" />
                        <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FiMapPin className="text-[color:var(--secondary-color)]" />
                        <span className="line-clamp-1">{event.venue}</span>
                    </div>
                </div>

                {/* Ticket Type & Status */}
                <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-xl">
                    <div>
                        <div className="text-xs text-gray-500">Ticket Type</div>
                        <div className="font-bold text-gray-900">{ticket.ticketType || 'General Admission'}</div>
                    </div>
                    <div className="flex items-center gap-2">
                        {getStatusIcon()}
                        {getStatusText()}
                    </div>
                </div>

                {/* QR Code Section */}
                {showQR ? (
                    <div className="bg-gray-50 rounded-xl p-4 mb-4 text-center">
                        <div className="bg-white p-4 rounded-lg inline-block">
                            <img 
                                src={generateQRCode(ticket.qrToken || ticket._id || 'TICKET')} 
                                alt="Ticket QR Code"
                                className="w-48 h-48 mx-auto"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-3">Show this QR code at the event entrance</p>
                        <button
                            onClick={() => setShowQR(false)}
                            className="mt-3 text-sm text-[color:var(--secondary-color)] font-semibold hover:underline"
                        >
                            Hide QR Code
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowQR(true)}
                        className="w-full py-3 bg-[color:var(--secondary-color)] text-white rounded-xl font-bold hover:shadow-lg transition-all mb-3"
                    >
                        Show QR Code
                    </button>
                )}

                {/* Download Button */}
                <button
                    onClick={downloadTicket}
                    className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                >
                    <FiDownload />
                    Download Ticket
                </button>
            </div>
        </div>
    );
}
