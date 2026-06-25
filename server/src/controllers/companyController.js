const { query } = require('../config/db');

exports.list = async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT * FROM companies WHERE user_id = $1 ORDER BY created_at',
      [req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT * FROM companies WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { name, address, gst_number, financial_year_start, state, contact_info } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Company name is required' });
    }

    const countResult = await query(
      'SELECT COUNT(*)::int AS cnt FROM companies WHERE user_id = $1',
      [req.user.id]
    );
    if (countResult.rows[0].cnt >= 5) {
      return res.status(403).json({
        success: false,
        message: 'Maximum limit of 5 companies reached per account',
      });
    }

    const { rows } = await query(
      `INSERT INTO companies (user_id, name, address, gst_number, financial_year_start, state, contact_info)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [req.user.id, name, address, gst_number, financial_year_start, state, contact_info]
    );

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ success: false, message: 'Company already exists' });
    }
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { name, address, gst_number, financial_year_start, state, contact_info } = req.body;

    const { rows } = await query(
      `UPDATE companies
       SET name = COALESCE($1, name),
           address = COALESCE($2, address),
           gst_number = COALESCE($3, gst_number),
           financial_year_start = COALESCE($4, financial_year_start),
           state = COALESCE($5, state),
           contact_info = COALESCE($6, contact_info)
       WHERE id = $7 AND user_id = $8
       RETURNING *`,
      [name, address, gst_number, financial_year_start, state, contact_info, req.params.id, req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const { rowCount } = await query(
      'DELETE FROM companies WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!rowCount) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }
    res.json({ success: true, message: 'Company deleted' });
  } catch (err) {
    next(err);
  }
};
