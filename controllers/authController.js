const { query } = require('../config/database');
const bcrypt = require('bcrypt');

exports.login = async (req, res, next) => {
    const { username, password } = req.body;
    try {
        const users = await query("SELECT * FROM users WHERE username = ?", [username]);
        if (users.length === 0) return res.status(401).json({ success: false, message: "Invalid credentials" });

        const user = users[0];
        const match = await bcrypt.compare(password, user.passwordHash);
        
        if (match) {
            req.session.user = { id: user.id, username: user.username, role: user.role };
            res.json({ success: true, role: user.role });
        } else {
            res.status(401).json({ success: false, message: "Invalid credentials" });
        }
    } catch (err) { next(err); }
};

exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Logout failed" });
        }
        
        res.clearCookie('connect.sid');
        return res.json({ success: true });
    });
}; 
