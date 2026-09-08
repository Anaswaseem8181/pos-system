const User = require('../models/User');
const catchAsync = require('../utils/asyncHandler');
const bcrypt = require('bcrypt');

exports.login = catchAsync(async (req, res) => {
	const { username, password } = req.body;
	const user = await User.findByUsername(username);

	if (!user || user.isActive === 0) {
		return res.status(401).json({ success: false, message: "Invalid credentials or account inactive" });
	}

	const isMatch = await bcrypt.compare(password, user.passwordHash);
	if (!isMatch) {
		return res.status(401).json({ success: false, message: "Invalid credentials" });
	}

	req.session.user = { id: user.id, username: user.username, role: user.role };
	res.json({ success: true, role: user.role });
});

exports.getMe = catchAsync(async (req, res) => {
	if (!req.session.user) {
		return res.status(401).json({ success: false, message: "Unauthorized" });
	}
	const user = await User.findById(req.session.user.id);
	if (!user || user.isActive === 0) {
		req.session.destroy();
		return res.status(401).json({ success: false, message: "Account is deactivated or no longer exists" });
	}
	res.json({ user });
});

exports.logout = (req, res) => {
	req.session.destroy();
	res.json({ success: true });
};
