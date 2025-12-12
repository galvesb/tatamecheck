const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key_dev_tatamecheck';

const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

const adminMiddleware = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied: Admins only' });
    }
};

const professorMiddleware = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'professor')) {
        next();
    } else {
        res.status(403).json({ message: 'Access denied: Professors and Admins only' });
    }
};

const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        if (Array.isArray(roles) && roles.includes(req.user.role)) {
            next();
        } else if (req.user.role === roles) {
            next();
        } else {
            res.status(403).json({ message: 'Access denied: Insufficient permissions' });
        }
    };
};

module.exports = { authMiddleware, adminMiddleware, professorMiddleware, requireRole, JWT_SECRET };

