exports.isAuthenticated = (req, res, next) => {
  if (req.session.user) return next();
  res.status(401).json({ success: false, message: "Unauthorized" });
};

exports.isAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.role === 'ADMIN') return next();
  res.status(403).json({ success: false, message: "Forbidden: Admin access required" });
};
