const { query } = require('../config/db');

exports.list = async (req, res, next) => {
  try {
    const { company_id } = req.query;
    const params = [req.user.id];
    let sql = `
      SELECT l.*, g.name AS group_name
      FROM ledgers l
      JOIN groups g ON g.id = l.group_id
      JOIN companies c ON c.id = l.company_id
      WHERE c.user_id = $1`;

    if (company_id) {
      sql += ` AND l.company_id = $2`;
      params.push(company_id);
    }

    sql += ` ORDER BY l.name`;

    const { rows } = await query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT l.*, g.name AS group_name
       FROM ledgers l
       JOIN groups g ON g.id = l.group_id
       JOIN companies c ON c.id = l.company_id
       WHERE l.id = $1 AND c.user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Ledger not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { company_id, group_id, name, opening_balance, type } = req.body;

    if (!company_id || !group_id || !name || !type) {
      return res.status(400).json({
        success: false,
        message: 'company_id, group_id, name, and type are required',
      });
    }

    const { rows: compRows } = await query(
      'SELECT id FROM companies WHERE id = $1 AND user_id = $2',
      [company_id, req.user.id]
    );
    if (!compRows.length) {
      return res.status(403).json({ success: false, message: 'Company not found or access denied' });
    }

    const allowedTypes = ['Customer', 'Supplier', 'Bank', 'Cash', 'Expense', 'Income'];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid type. Must be one of: ${allowedTypes.join(', ')}`,
      });
    }

    const { rows } = await query(
      `INSERT INTO ledgers (company_id, group_id, name, opening_balance, current_balance, type)
       VALUES ($1, $2, $3, $4, $4, $5) RETURNING *`,
      [company_id, group_id, name, opening_balance || 0, type]
    );

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ success: false, message: 'Ledger name already exists in this company' });
    }
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { name, group_id, opening_balance, type } = req.body;

    const { rows } = await query(
      `UPDATE ledgers l
       SET name = COALESCE($1, l.name),
           group_id = COALESCE($2, l.group_id),
           opening_balance = COALESCE($3, l.opening_balance),
           current_balance = COALESCE($3, l.opening_balance),
           type = COALESCE($4, l.type)
       FROM companies c
       WHERE l.id = $5 AND c.id = l.company_id AND c.user_id = $6
       RETURNING l.*`,
      [name, group_id, opening_balance, type, req.params.id, req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Ledger not found' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const { rowCount } = await query(
      `DELETE FROM ledgers l USING companies c
       WHERE l.id = $1 AND c.id = l.company_id AND c.user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!rowCount) {
      return res.status(404).json({ success: false, message: 'Ledger not found' });
    }
    res.json({ success: true, message: 'Ledger deleted' });
  } catch (err) {
    if (err.code === '23503') {
      return res.status(409).json({ success: false, message: 'Ledger has transactions; remove them first' });
    }
    next(err);
  }
};
