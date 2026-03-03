const { db, run, query } = require('../config/database');

exports.checkout = async (req, res, next) => {
  const { items, total } = req.body;
  const userId = req.session.user.id;

  try {
    await run("BEGIN TRANSACTION");

    const saleResult = await run(
      `INSERT INTO sales (total, user_id) VALUES (?, ?)`,
      [total, userId]
    );
    const saleId = saleResult.id;

    for (const item of items) {
      const product = (await query("SELECT quantity FROM products WHERE id = ?", [item.id]))[0];
      
      if (!product || product.quantity < item.cartQuantity) {
        throw new Error(`Insufficient stock for product ID: ${item.id}`);
      }

      await run(
        `INSERT INTO sale_items (sale_id, product_id, quantity, price) VALUES (?, ?, ?, ?)`,
        [saleId, item.id, item.cartQuantity, item.price]
      );

      await run(
        `UPDATE products SET quantity = quantity - ? WHERE id = ?`,
        [item.cartQuantity, item.id]
      );
    }

    await run("COMMIT");
    res.status(201).json({ success: true, saleId, message: "Sale completed successfully" });

  } catch (error) {
    await run("ROLLBACK");
    next(error);
  }
};

exports.getSalesReport = async (req, res, next) => {
  try {
    const sales = await query(`
      SELECT s.*, u.username 
      FROM sales s 
      JOIN users u ON s.user_id = u.id 
      ORDER BY s.date DESC
    `);
    res.json(sales);
  } catch (error) { next(error); }
};
