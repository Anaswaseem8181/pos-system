const { db, run, query } = require('../config/database');

exports.getCategories = async (req, res, next) => {
  try {
    const rows = await query("SELECT * FROM categories ORDER BY name ASC");
    res.json(rows);
  } catch (err) { next(err); }
};

exports.addCategory = async (req, res, next) => {
  const { name } = req.body;
  try {
    const result = await run("INSERT INTO categories (name) VALUES (?)", [name]);
    res.status(201).json({ id: result.id, name });
  } catch (err) { next(err); }
};

exports.deleteCategory = async (req, res, next) => {
  const { id } = req.params;
  try {
    await run("DELETE FROM categories WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (err) { next(err); }
};
