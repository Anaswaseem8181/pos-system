const { ROLES } = require('../config/constants');

exports.isAuthenticated = (req, res, next) => {
	if (req.session.user) return next();
	res.status(401).json({ success: false, message: "Unauthorized" });
};

exports.isAdmin = (req, res, next) => {
	if (req.session.user && req.session.user.role === ROLES.ADMIN) return next();
	res.status(403).json({ success: false, message: "Forbidden: Admin access required" });
};

exports.isManagerOrAdmin = (req, res, next) => {
	const role = req.session.user ? req.session.user.role : null;
	if (role === ROLES.ADMIN || role === ROLES.MANAGER) return next();
	res.status(403).json({ success: false, message: "Forbidden: Admin or Manager access required" });
};
