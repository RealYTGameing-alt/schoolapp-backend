const pool = require('../config/database');
const bcrypt = require('bcryptjs');

const createUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, roleId, phone, className } = req.body;

    if (!firstName || !lastName || !email || !password || !roleId) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // Check if email already exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (first_name, last_name, email, password, role_id, phone, class_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, first_name, last_name, email, role_id`,
      [firstName, lastName, email, hashedPassword, roleId, phone || null, className || null]
    );

    res.status(201).json({
      message: 'User created successfully!',
      user: result.rows[0]
    });
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;

    let query = `
      SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.class_name,
             r.name as role_name, r.id as role_id, u.created_at
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE 1=1
    `;
    const params = [];

    if (role) {
      params.push(role);
      query += ` AND r.name = $${params.length}`;
    }

    query += ' ORDER BY u.created_at DESC';

    const result = await pool.query(query, params);
    res.json({ users: result.rows });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'User deleted successfully!' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, id]);

    res.json({ message: 'Password reset successfully!' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
const updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, phone } = req.body;

    const result = await pool.query(
      `UPDATE users SET first_name = $1, last_name = $2, phone = $3 WHERE id = $4
       RETURNING id, first_name, last_name, email, phone, role_id`,
      [firstName, lastName, phone, id]
    );

    res.json({ message: 'Profile updated!', user: result.rows[0] });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    const userResult = await pool.query('SELECT password FROM users WHERE id = $1', [id]);
    if (userResult.rows.length === 0) return res.status(404).json({ error: 'User not found' });

    const bcrypt = require('bcryptjs');
    const valid = await bcrypt.compare(currentPassword, userResult.rows[0].password);
    if (!valid) return res.status(400).json({ error: 'Current password is incorrect.' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, id]);

    res.json({ message: 'Password changed successfully!' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};  

module.exports = { createUser, getAllUsers, deleteUser, resetPassword, updateProfile, changePassword };