import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { FiDownload, FiMapPin, FiCalendar, FiClock, FiUser, FiCheck, FiX } from "react-icons/fi";
import QRCode from 'qrcode';

export default function TicketCard({ ticket, event }) {
    const [showQR, setShowQR] = useState(false);
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const ticketRef = useRef(null);

    // Generate proper QR code when component mounts or ticket changes
    useEffect(() => {
        const generateQR = async () => {
            try {
                const qrData = ticket.qrToken || ticket._id || 'TICKET';
                const url = await QRCode.toDataURL(qrData, {
                    width: 300,
                    margin: 2,
                    color: {
                        dark: '#000000',
                        light: '#FFFFFF'
                    }
                });
                setQrCodeUrl(url);
            } catch (error) {
                console.error('Error generating QR code:', error);
            }
        };
        generateQR();
    }, [ticket]);

    const downloadTicket = async () => {
        try {
            // Generate QR code for download
            const qrData = ticket.qrToken || ticket._id || 'TICKET';
            const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
                width: 400,
                margin: 2
            });

            // Create a printable ticket HTML
            const ticketHTML = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Ticket - ${event.name}</title>
                    <style>
                        @media print {
                            body { margin: 0; }
                            .no-print { display: none; }
                        }
                        body { 
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
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
                            padding: 40px 30px;
                            text-align: center;
                        }
                        .ticket-body {
                            padding: 30px;
                        }
                        .qr-section {
                            text-center;
                            padding: 30px;
                            background: #f9f9f9;
                            border-radius: 15px;
                            margin: 20px 0;
                        }
                        .qr-section img {
                            display: block;
                            margin: 0 auto;
                            width: 250px;
                            height: 250px;
                        }
                        .info-row {
                            display: flex;
                            justify-content: space-between;
                            padding: 15px 0;
                            border-bottom: 1px solid #eee;
                        }
                        .label { color: #666; font-size: 14px; }
                        .value { font-weight: 600; color: #333; text-align: right; }
                        h1 { margin: 0 0 10px 0; font-size: 32px; font-weight: 700; }
                        .ticket-id { font-size: 13px; opacity: 0.9; font-family: monospace; }
                        .print-btn {
                            display: block;
                            width: 200px;
                            margin: 20px auto;
                            padding: 12px;
                            background: #667eea;
                            color: white;
                            border: none;
                            border-radius: 8px;
                            font-size: 16px;
                            font-weight: 600;
                            cursor: pointer;
                        }
                        .print-btn:hover { background: #5568d3; }
                    </style>
                </head>
                <body>
                    <div class="ticket">
                        <div class="ticket-header">
                            <h1>${event.name}</h1>
                            <div class="ticket-id">Ticket ID: ${ticket.ticketId || ticket._id || 'N/A'}</div>
                        </div>
                        <div class="ticket-body">
                            <div class="qr-section">
                                <img src="${qrCodeDataUrl}" alt="QR Code">
                                <p style="margin-top: 15px; font-size: 14px; color: #666; font-weight: 500;">Scan this code at the event entrance</p>
                            </div>
                            <div class="info-row">
                                <span class="label">📅 Date</span>
                                <span class="value">${event.date}</span>
                            </div>
                            <div class="info-row">
                                <span class="label">🕐 Time</span>
                                <span class="value">${event.time}</span>
                            </div>
                            <div class="info-row">
                                <span class="label">📍 Venue</span>
                                <span class="value">${event.venue}</span>
                            </div>
                            <div class="info-row">
                                <span class="label">🎫 Ticket Type</span>
                                <span class="value">${ticket.ticketType || 'General Admission'}</span>
                            </div>
                            <div class="info-row">
                                <span class="label">👤 Attendee</span>
                                <span class="value">${ticket.attendeeName || ticket.name || 'Guest'}</span>
                            </div>
                        </div>
                    </div>
                    <button class="print-btn no-print" onclick="window.print()">🖨️ Print Ticket</button>
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
                        <div className="bg-white p-4 rounded-lg inline-block shadow-sm">
                            {qrCodeUrl ? (
                                <img 
                                    src={qrCodeUrl} 
                                    alt="Ticket QR Code"
                                    className="w-56 h-56 mx-auto"
                                />
                            ) : (
                                <div className="w-56 h-56 flex items-center justify-center">
                                    <div className="animate-spin h-8 w-8 border-4 border-[color:var(--secondary-color)] border-t-transparent rounded-full"></div>
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 mt-3 font-medium">Show this QR code at the event entrance</p>
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
