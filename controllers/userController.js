const { query, run } = require('../config/database');
const bcrypt = require('bcrypt');

exports.getAll = async (req, res, next) => {
    try {
        const users = await query("SELECT id, username, role FROM users");
        res.json(users);
    } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
    const { username, password, role } = req.body;
    try {
        const hash = await bcrypt.hash(password, 10);
        await run("INSERT INTO users (username, passwordHash, role) VALUES (?, ?, ?)", [username, hash, role]);
        res.status(201).json({ success: true });
    } catch (err) { next(err); }
};
