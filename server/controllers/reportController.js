const Report = require("../models/Report");
const Notification = require("../models/Notification");
const User = require("../models/user");
const Event = require("../models/event");
const Community = require("../models/Community");
const Blacklist = require("../models/Blacklist");
const { sendAccountSuspensionEmail, sendReportActionEmail } = require("../utils/emailService");

// Create a report
exports.createReport = async (req, res) => {
    try {
        const { reportType, reportedId, reportedName, reason } = req.body;
        const reporterId = req.body.reporterId || req.user?.user_token;
        const reporterName = req.body.reporterName;

        console.log("Creating report:", { reportType, reportedId, reportedName, reason, reporterId, reporterName });

        if (!reportType || !reportedId || !reportedName || !reason || !reporterId || !reporterName) {
            console.log("Missing fields:", { reportType, reportedId, reportedName, reason, reporterId, reporterName });
            return res.status(400).send({ msg: "Missing required fields" });
        }

        const report = await Report.create({
            reportType,
            reportedId,
            reportedName,
            reporterId,
            reporterName,
            reason
        });

        console.log("Report created successfully:", report._id);
        res.status(201).send({ msg: "Report submitted successfully", report });
    } catch (error) {
        console.error("Create report error:", error);
        res.status(500).send({ msg: "Server error", error: error.message });
    }
};

// Get all reports (Admin only)
exports.getAllReports = async (req, res) => {
    try {
        const { status } = req.query;
        const filter = status ? { status } : {};
        
        console.log("Fetching reports with filter:", filter);
        const reports = await Report.find(filter).sort({ createdAt: -1 });
        console.log(`Found ${reports.length} reports`);
        res.send(reports);
    } catch (error) {
        console.error("Get reports error:", error);
        res.status(500).send({ msg: "Server error", error: error.message });
    }
};

// Take action on a report (Admin only)
exports.takeAction = async (req, res) => {
    try {
        const { reportId, action, adminNotes } = req.body;
        const adminId = req.user?.user_token;

        const report = await Report.findById(reportId);
        if (!report) {
            return res.status(404).send({ msg: "Report not found" });
        }

        report.status = 'action_taken';
        report.adminAction = action;
        report.adminNotes = adminNotes || '';
        report.actionTakenBy = adminId;
        report.reviewedAt = new Date();
        await report.save();

        // Notify reporter
        let reporterNotification = {
            userId: report.reporterId,
            type: 'report_reviewed',
            title: 'Report Reviewed',
            message: '',
            metadata: { reportId: report._id, action }
        };

        // Take action based on type
        if (action === 'suspended') {
            if (report.reportType === 'user') {
                const user = await User.findOne({ _id: report.reportedId });
                if (user) {
                    user.suspended = true;
                    user.suspendedUntil = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours
                    user.suspensionReason = report.reason;
                    user.accountStatus = 'suspended';
                    await user.save();

                    // Notify suspended user
                    await Notification.create({
                        userId: report.reportedId,
                        type: 'account_suspended',
                        title: 'Account Suspended',
                        message: `Your account has been suspended for 48 hours. Reason: ${report.reason}`,
                        metadata: { suspendedUntil: user.suspendedUntil }
                    });
                }
                reporterNotification.message = `The user "${report.reportedName}" has been suspended for 48 hours.`;
            } else if (report.reportType === 'community') {
                const community = await Community.findById(report.reportedId);
                if (community) {
                    community.suspended = true;
                    community.suspendedUntil = new Date(Date.now() + 48 * 60 * 60 * 1000);
                    await community.save();
                }
                reporterNotification.message = `The community "${report.reportedName}" has been suspended for 48 hours.`;
            }
        } else if (action === 'deleted') {
            if (report.reportType === 'user') {
                const user = await User.findOne({ _id: report.reportedId });
                if (user) {
                    // Blacklist email
                    await Blacklist.create({
                        email: user.email,
                        reason: `Account deleted due to report: ${report.reason}`,
                        blacklistedBy: adminId
                    });

                    // Notify user before deletion
                    await Notification.create({
                        userId: report.reportedId,
                        type: 'account_deleted',
                        title: 'Account Deleted',
                        message: `Your account has been permanently deleted. Reason: ${report.reason}`,
                        metadata: {}
                    });

                    // Delete user
                    await User.deleteOne({ _id: report.reportedId });
                }
                reporterNotification.message = `The user "${report.reportedName}" has been permanently deleted.`;
            } else if (report.reportType === 'event') {
                await Event.deleteOne({ event_id: report.reportedId });
                reporterNotification.message = `The event "${report.reportedName}" has been deleted.`;
            } else if (report.reportType === 'community') {
                await Community.deleteOne({ _id: report.reportedId });
                reporterNotification.message = `The community "${report.reportedName}" has been deleted.`;
            }
        } else if (action === 'dismissed') {
            reporterNotification.message = `Your report about "${report.reportedName}" was reviewed. No action was taken as it didn't violate our guidelines.`;
        }

        // Create notification for reporter
        await Notification.create(reporterNotification);

        // Send email to reporter
        try {
            const reporter = await User.findOne({ user_token: report.reporterId });
            if (reporter && reporter.email) {
                await sendReportActionEmail({
                    email: reporter.email,
                    name: reporter.displayName || reporter.username,
                    reportedContent: report.reportedName,
                    action: action === 'dismissed' ? 'No Action Required' : action === 'suspended' ? 'Content Suspended' : 'Content Removed',
                    adminNotes
                });
            }
        } catch (emailError) {
            console.error("Error sending report action email:", emailError);
        }

        // Send suspension email if user was suspended
        if (action === 'suspended' && report.reportType === 'user') {
            try {
                const suspendedUser = await User.findOne({ _id: report.reportedId });
                if (suspendedUser && suspendedUser.email) {
                    await sendAccountSuspensionEmail({
                        email: suspendedUser.email,
                        name: suspendedUser.displayName || suspendedUser.username,
                        reason: report.reason,
                        suspendedUntil: suspendedUser.suspendedUntil
                    });
                }
            } catch (emailError) {
                console.error("Error sending suspension email:", emailError);
            }
        }

        res.send({ msg: "Action taken successfully", report });
    } catch (error) {
        console.error("Take action error:", error);
        res.status(500).send({ msg: "Server error" });
    }
};

// Delete a report (Admin only)
exports.deleteReport = async (req, res) => {
    try {
        const { reportId } = req.params;
        await Report.deleteOne({ _id: reportId });
        res.send({ msg: "Report deleted successfully" });
    } catch (error) {
        console.error("Delete report error:", error);
        res.status(500).send({ msg: "Server error" });
    }
};

module.exports = exports;
