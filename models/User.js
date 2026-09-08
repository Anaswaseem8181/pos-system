const { query, run } = require('../config/database');
const bcrypt = require('bcrypt');

class User {
	static async findAll() {
		return await query("SELECT id, username, role, isActive FROM users");
	}

	static async findByUsername(username) {
		const rows = await query("SELECT * FROM users WHERE username = ?", [username]);
		return rows[0];
	}

	static async findById(id) {
		const rows = await query("SELECT id, username, role, isActive FROM users WHERE id = ?", [id]);
		return rows[0];
	}

	static async create(data) {
		const { username, password, role } = data;
		const hash = await bcrypt.hash(password, 10);
		return await run(
			"INSERT INTO users (username, passwordHash, role) VALUES (?, ?, ?)",
			[username, hash, role]
		);
	}

	static async update(id, data) {
		const { username, role, password } = data;
		let sql = "UPDATE users SET username = ?, role = ?";
		const params = [username, role];

		if (password) {
			const hash = await bcrypt.hash(password, 10);
			sql += ", passwordHash = ?";
			params.push(hash);
		}

		sql += " WHERE id = ?";
		params.push(id);
		return await run(sql, params);
	}

	static async toggleStatus(id) {
		return await run("UPDATE users SET isActive = 1 - isActive WHERE id = ?", [id]);
	}
}

module.exports = User;
