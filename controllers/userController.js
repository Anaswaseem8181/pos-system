const User = require('../models/User');
const catchAsync = require('../utils/asyncHandler');

exports.getAll = catchAsync(async (req, res) => {
	const users = await User.findAll();
	// Filter out inactive if needed, but model handles it
	res.json(users);
});

exports.create = catchAsync(async (req, res) => {
	const { role } = req.body;
	if (role === 'ADMIN') {
		return res.status(403).json({ success: false, message: "Only one ADMIN is allowed." });
	}

	await User.create(req.body);
	res.status(201).json({ success: true });
});

exports.update = catchAsync(async (req, res) => {
	const { id } = req.params;
	const { role } = req.body;

	if (role === 'ADMIN' && req.session.user.id != id) {
		return res.status(403).json({ success: false, message: "Cannot promote user to ADMIN." });
	}

	await User.update(id, req.body);
	res.json({ success: true });
});

exports.softDelete = catchAsync(async (req, res) => {
	const { id } = req.params;
	if (id == req.session.user.id) {
		return res.status(400).json({ success: false, message: "You cannot deactivate your own account." });
	}

	await User.toggleStatus(id);
	res.json({ success: true });
});
