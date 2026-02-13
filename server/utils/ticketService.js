const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

/**
 * Generate a PDF ticket with QR code
 * @param {Object} ticketData - Ticket information
 * @returns {Promise<Buffer>} - PDF buffer
 */
async function generateTicketPDF(ticketData) {
    const {
        ticketId,
        eventName,
        eventDate,
        eventTime,
        eventVenue,
        attendeeName,
        attendeeEmail,
        ticketType,
        price,
        qrData
    } = ticketData;

    return new Promise(async (resolve, reject) => {
        try {
            // Create PDF document
            const doc = new PDFDocument({
                size: 'A4',
                margins: { top: 50, bottom: 50, left: 50, right: 50 }
            });

            // Collect PDF data in buffer
            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });

            // Generate QR Code
            const qrCodeDataURL = await QRCode.toDataURL(qrData || ticketId, {
                width: 200,
                margin: 1,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });

            // Header with gradient effect
            doc.rect(0, 0, doc.page.width, 150).fill('#4F46E5');
            
            // UniHub Logo/Title
            doc.fontSize(32)
               .fillColor('#FFFFFF')
               .font('Helvetica-Bold')
               .text('UniHub', 50, 50);
            
            doc.fontSize(14)
               .fillColor('#E0E7FF')
               .font('Helvetica')
               .text('Your Event Ticket', 50, 90);

            // Ticket ID
            doc.fontSize(10)
               .fillColor('#C7D2FE')
               .text(`Ticket #${ticketId.substring(0, 12).toUpperCase()}`, 50, 115);

            // Main content area
            doc.fillColor('#000000');
            
            // Event Name
            doc.fontSize(24)
               .font('Helvetica-Bold')
               .fillColor('#1F2937')
               .text(eventName, 50, 180, { width: 500 });

            // Event Details
            const detailsY = 230;
            doc.fontSize(12)
               .font('Helvetica-Bold')
               .fillColor('#6B7280')
               .text('DATE', 50, detailsY);
            
            doc.fontSize(14)
               .font('Helvetica')
               .fillColor('#1F2937')
               .text(eventDate, 50, detailsY + 20);

            doc.fontSize(12)
               .font('Helvetica-Bold')
               .fillColor('#6B7280')
               .text('TIME', 200, detailsY);
            
            doc.fontSize(14)
               .font('Helvetica')
               .fillColor('#1F2937')
               .text(eventTime, 200, detailsY + 20);

            doc.fontSize(12)
               .font('Helvetica-Bold')
               .fillColor('#6B7280')
               .text('VENUE', 50, detailsY + 60);
            
            doc.fontSize(14)
               .font('Helvetica')
               .fillColor('#1F2937')
               .text(eventVenue, 50, detailsY + 80, { width: 500 });

            // Attendee Information
            const attendeeY = detailsY + 140;
            doc.fontSize(12)
               .font('Helvetica-Bold')
               .fillColor('#6B7280')
               .text('ATTENDEE', 50, attendeeY);
            
            doc.fontSize(14)
               .font('Helvetica')
               .fillColor('#1F2937')
               .text(attendeeName, 50, attendeeY + 20);

            doc.fontSize(12)
               .fillColor('#6B7280')
               .text(attendeeEmail, 50, attendeeY + 40);

            // Ticket Type and Price
            const ticketInfoY = attendeeY + 80;
            doc.fontSize(12)
               .font('Helvetica-Bold')
               .fillColor('#6B7280')
               .text('TICKET TYPE', 50, ticketInfoY);
            
            doc.fontSize(14)
               .font('Helvetica')
               .fillColor('#1F2937')
               .text(ticketType || 'General Admission', 50, ticketInfoY + 20);

            if (price && price > 0) {
                doc.fontSize(12)
                   .font('Helvetica-Bold')
                   .fillColor('#6B7280')
                   .text('PRICE', 250, ticketInfoY);
                
                doc.fontSize(14)
                   .font('Helvetica')
                   .fillColor('#10B981')
                   .text(`₦${price.toLocaleString()}`, 250, ticketInfoY + 20);
            }

            // QR Code
            const qrY = ticketInfoY + 80;
            doc.fontSize(12)
               .font('Helvetica-Bold')
               .fillColor('#6B7280')
               .text('SCAN TO VERIFY', 50, qrY);

            // Add QR code image
            doc.image(qrCodeDataURL, 50, qrY + 20, { width: 150, height: 150 });

            // Instructions
            doc.fontSize(10)
               .font('Helvetica')
               .fillColor('#6B7280')
               .text('Present this QR code at the event entrance for check-in', 220, qrY + 60, { width: 300 });

            // Footer
            const footerY = doc.page.height - 100;
            doc.moveTo(50, footerY)
               .lineTo(doc.page.width - 50, footerY)
               .stroke('#E5E7EB');

            doc.fontSize(9)
               .fillColor('#9CA3AF')
               .text('This ticket is non-transferable and valid for one entry only.', 50, footerY + 15, { align: 'center', width: doc.page.width - 100 });
            
            doc.fontSize(9)
               .fillColor('#9CA3AF')
               .text('For support, contact support@unihub.com', 50, footerY + 30, { align: 'center', width: doc.page.width - 100 });

            // Watermark
            doc.fontSize(60)
               .fillColor('#F3F4F6')
               .opacity(0.1)
               .text('UNIHUB', 0, doc.page.height / 2 - 30, { align: 'center', width: doc.page.width });

            // Finalize PDF
            doc.end();

        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Generate QR code data string for ticket
 * @param {Object} data - Ticket data
 * @returns {string} - QR code data
 */
function generateQRData(data) {
    return JSON.stringify({
        ticketId: data.ticketId,
        eventId: data.eventId,
        userId: data.userId,
        timestamp: Date.now()
    });
}

/**
 * Validate ticket QR code
 * @param {string} qrData - QR code data
 * @returns {Object} - Parsed ticket data
 */
function validateTicketQR(qrData) {
    try {
        const data = JSON.parse(qrData);
        return {
            valid: true,
            ...data
        };
    } catch (error) {
        return {
            valid: false,
            error: 'Invalid QR code'
        };
    }
}

module.exports = {
    generateTicketPDF,
    generateQRData,
    validateTicketQR
};
