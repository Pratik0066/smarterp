const { query } = require('../config/db');

exports.list = async (req, res, next) => {
  try {
    const { company_id } = req.query;
    const params = [req.user.id];
    let sql = `SELECT g.* FROM groups g JOIN companies c ON c.id = g.company_id WHERE c.user_id = $1`;

    if (company_id) {
      sql += ` AND g.company_id = $2`;
      params.push(company_id);
    }

    sql += ` ORDER BY g.name`;

    const { rows } = await query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT g.* FROM groups g JOIN companies c ON c.id = g.company_id
       WHERE g.id = $1 AND c.user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { company_id, name, parent_group_id, type } = req.body;

    if (!company_id || !name || !type) {
      return res.status(400).json({ success: false, message: 'company_id, name, and type are required' });
    }

    const { rows: compRows } = await query(
      'SELECT id FROM companies WHERE id = $1 AND user_id = $2',
      [company_id, req.user.id]
    );
    if (!compRows.length) {
      return res.status(403).json({ success: false, message: 'Company not found or access denied' });
    }

    const allowedTypes = ['Asset', 'Liability', 'Income', 'Expense', 'Stock'];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ success: false, message: `Invalid type. Must be one of: ${allowedTypes.join(', ')}` });
    }

    const { rows } = await query(
      `INSERT INTO groups (company_id, name, parent_group_id, type) VALUES ($1, $2, $3, $4) RETURNING *`,
      [company_id, name, parent_group_id || null, type]
    );

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ success: false, message: 'Group name already exists in this company' });
    }
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { name, parent_group_id, type } = req.body;

    const { rows } = await query(
      `UPDATE groups g
       SET name = COALESCE($1, g.name),
           parent_group_id = $2,
           type = COALESCE($3, g.type)
       FROM companies c
       WHERE g.id = $4 AND c.id = g.company_id AND c.user_id = $5
       RETURNING g.*`,
      [name, parent_group_id || null, type, req.params.id, req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const { rowCount } = await query(
      `DELETE FROM groups g USING companies c
       WHERE g.id = $1 AND c.id = g.company_id AND c.user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!rowCount) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }
    res.json({ success: true, message: 'Group deleted' });
  } catch (err) {
    if (err.code === '23503') {
      return res.status(409).json({ success: false, message: 'Group has ledgers attached; remove them first' });
    }
    next(err);
  }
};
