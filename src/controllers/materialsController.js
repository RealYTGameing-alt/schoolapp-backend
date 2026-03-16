const pool = require('../config/database');

const getMaterials = async (req, res) => {
  try {
    const { subject, className } = req.query;

    let query = `
      SELECT m.*, u.first_name || ' ' || u.last_name as teacher_name
      FROM learning_materials m
      JOIN users u ON m.uploaded_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (subject) {
      params.push(subject);
      query += ` AND m.subject_id = $${params.length}`;
    }

    query += ' ORDER BY m.created_at DESC';

    const result = await pool.query(query, params);
    res.json({ materials: result.rows });
  } catch (err) {
    console.error('Get materials error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const createMaterial = async (req, res) => {
  try {
    const { title, description, subject, className, materialType, fileUrl } = req.body;
    const uploadedBy = req.user.id;

    const result = await pool.query(
      `INSERT INTO learning_materials 
       (title, description, subject_id, class_id, material_type, file_url, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [title, description, subject || null, className || null, materialType || 'document', fileUrl || null, uploadedBy]
    );

    res.status(201).json({ message: 'Material uploaded!', material: result.rows[0] });
  } catch (err) {
    console.error('Create material error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await pool.query(
      'DELETE FROM learning_materials WHERE id = $1 AND uploaded_by = $2',
      [id, userId]
    );

    res.json({ message: 'Material deleted!' });
  } catch (err) {
    console.error('Delete material error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getMaterials, createMaterial, deleteMaterial };