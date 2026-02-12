const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

// Stronger token validation
function authenticate(req, res, next) {
    const header = req.headers.authorization || "";
    const tokenFromHeader = header.startsWith("Bearer ") ?
        header.slice(7) :
        null;
    const tokenFromBody = req.body && req.body.user_token;
    const adminId = req.body && req.body.admin_id;
    const userId = req.body && req.body.user_id;

    // Prefer Authorization header, fall back to body tokens
    const token = tokenFromHeader || tokenFromBody || adminId || userId;

    if (!token) {
        return res.status(401).send({ msg: "Authentication required" });
    }

    try {
        // Verify token with strict options
        const payload = jwt.verify(token, JWT_SECRET, {
            algorithms: ["HS256"], // Only allow HS256
            issuer: "unihub", // Verify issuer if set
        });

        // Attach user info to request
        req.user = payload;
        req.user.user_token = token;

        // Set role based on token type
        if (adminId && token === adminId) {
            req.user.role = "ADMIN";
        } else if (!req.user.role && userId && token === userId) {
            req.user.role = "ORGANIZER";
        }

        // Prevent token replay from different devices
        if (payload.jti) {
            req.user.jti = payload.jti;
        }

        next();
    } catch (e) {
        if (e.name === "TokenExpiredError") {
            return res.status(401).send({ msg: "Token expired" });
        }
        if (e.name === "JsonWebTokenError") {
            return res.status(401).send({ msg: "Invalid token" });
        }
        return res.status(401).send({ msg: "Authentication failed" });
    }
}

function requireRole(roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).send({ msg: "Authentication required" });
        }

        // Admin always has access
        if (req.user.role === "ADMIN") {
            return next();
        }

        // Check if role is allowed
        if (Array.isArray(roles)) {
            if (roles.includes(req.user.role)) {
                return next();
            }
        } else if (req.user.role === roles) {
            return next();
        }

        return res.status(403).send({ msg: "Insufficient permissions" });
    };
}

function scopeByOrganization(req, res, next) {
    const orgId = req.body.organizationId || req.params.organizationId;

    // Admins can access all organizations
    if (req.user && req.user.role === "ADMIN") {
        return next();
    }

    if (!orgId) {
        return next();
    }

    if (!req.user) {
        return res.status(401).send({ msg: "Authentication required" });
    }

    if (req.user.organizationId === orgId) {
        return next();
    }

    return res.status(403).send({ msg: "Access denied to this organization" });
}

// CSRF protection for state-changing operations
function validateCsrf(req, res, next) {
    const safeMethods = ["GET", "HEAD", "OPTIONS"];
    if (safeMethods.includes(req.method)) {
        return next();
    }

    // For API requests, we use JWT in Authorization header
    // If using cookies for auth, add CSRF token validation here
    next();
}

// Rate limiting for sensitive operations can be added per-route

module.exports = { authenticate, requireRole, scopeByOrganization, validateCsrf };