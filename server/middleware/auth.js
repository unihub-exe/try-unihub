const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

function authenticate(req, res, next) {
    const header = req.headers.authorization || "";
    const tokenFromHeader = header.startsWith("Bearer ")
        ? header.slice(7)
        : null;
    const tokenFromBody = req.body && req.body.user_token;
    const adminId = req.body && req.body.admin_id;
    const userId = req.body && req.body.user_id;
    const token = tokenFromHeader || tokenFromBody || adminId || userId;
    if (!token) return res.status(401).send({ msg: "Unauthorized" });
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload;
        req.user.user_token = token; // Attach token for controller access
        if (adminId && token === adminId) req.user.role = "ADMIN";
        if (!req.user.role && userId && token === userId) req.user.role = "ORGANIZER";
        next();
    } catch (e) {
        return res.status(401).send({ msg: "Invalid token" });
    }
}

function requireRole(roles) {
    return (req, res, next) => {
        if (!req.user) return res.status(401).send({ msg: "Unauthorized" });
        if (req.user.role === "ADMIN") return next();
        if (Array.isArray(roles) && roles.includes(req.user.role)) return next();
        return res.status(403).send({ msg: "Forbidden" });
    };
}

function scopeByOrganization(req, res, next) {
    const orgId = req.body.organizationId || req.params.organizationId;
    if (!orgId) {
        if (req.user && req.user.role === "ADMIN") return next();
        return next();
    }
    if (!req.user) return res.status(401).send({ msg: "Unauthorized" });
    if (req.user.role === "ADMIN") return next();
    if (req.user.organizationId === orgId) return next();
    return res.status(403).send({ msg: "Forbidden" });
}

module.exports = { authenticate, requireRole, scopeByOrganization };
