const AdminSettings = require("../models/AdminSettings");

// Get platform settings
exports.getSettings = async (req, res) => {
    try {
        let settings = await AdminSettings.findOne();
        
        // Create default settings if none exist
        if (!settings) {
            settings = await AdminSettings.create({
                premiumPricePerDay: 100,
                payoutProcessingHours: 48,
            });
        }

        res.send(settings);
    } catch (error) {
        console.error("Get settings error:", error);
        res.status(500).send({ msg: "Server error" });
    }
};

// Update platform settings
exports.updateSettings = async (req, res) => {
    try {
        const { premiumPricePerDay, payoutProcessingHours } = req.body;

        let settings = await AdminSettings.findOne();
        
        if (!settings) {
            settings = new AdminSettings();
        }

        if (premiumPricePerDay !== undefined) {
            settings.premiumPricePerDay = premiumPricePerDay;
        }
        
        if (payoutProcessingHours !== undefined) {
            settings.payoutProcessingHours = payoutProcessingHours;
        }

        await settings.save();

        res.send({ msg: "Settings updated successfully", settings });
    } catch (error) {
        console.error("Update settings error:", error);
        res.status(500).send({ msg: "Server error" });
    }
};

module.exports = exports;
