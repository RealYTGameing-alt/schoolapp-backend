const pool = require('../config/database');

const createLessonPlan = async (req, res) => {
  try {
    const { title, subject, className, objectives, content, resources, date, durationMinutes } = req.body;
    const teacherId = req.user.id;

    if (!title || !date) {
      return res.status(400).json({ error: 'Title and date are required.' });
    }

    const result = await pool.query(
      `INSERT INTO lesson_plans 
       (teacher_id, title, subject, class_name, objectives, content, resources, date, duration_minutes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [teacherId, title, subject, className, objectives, content, resources, date, durationMinutes || 45]
    );

    res.status(201).json({ message: 'Lesson plan created!', lessonPlan: result.rows[0] });
  } catch (err) {
    console.error('Create lesson plan error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getLessonPlans = async (req, res) => {
  try {
    const { teacherId, week } = req.query;
    const requesterId = req.user.id;
    const role = req.user.role_name;

    let query = `
      SELECT lp.*, u.first_name || ' ' || u.last_name as teacher_name
      FROM lesson_plans lp
      JOIN users u ON lp.teacher_id = u.id
      WHERE 1=1
    `;
    const params = [];

    // Teachers only see their own
    if (role === 'teacher') {
      params.push(requesterId);
      query += ` AND lp.teacher_id = $${params.length}`;
    }

    // Filter by specific teacher (for principal/admin)
    if (teacherId && role !== 'teacher') {
      params.push(teacherId);
      query += ` AND lp.teacher_id = $${params.length}`;
    }

    // Filter by week
    if (week) {
      params.push(week);
      query += ` AND DATE_TRUNC('week', lp.date) = DATE_TRUNC('week', $${params.length}::date)`;
    }

    query += ' ORDER BY lp.date DESC';

    const result = await pool.query(query, params);
    res.json({ lessonPlans: result.rows });
  } catch (err) {
    console.error('Get lesson plans error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const updateLessonPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subject, className, objectives, content, resources, date, durationMinutes } = req.body;
    const teacherId = req.user.id;

    const result = await pool.query(
      `UPDATE lesson_plans SET
        title = $1, subject = $2, class_name = $3, objectives = $4,
        content = $5, resources = $6, date = $7, duration_minutes = $8
       WHERE id = $9 AND teacher_id = $10
       RETURNING *`,
      [title, subject, className, objectives, content, resources, date, durationMinutes, id, teacherId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lesson plan not found.' });
    }

    res.json({ message: 'Lesson plan updated!', lessonPlan: result.rows[0] });
  } catch (err) {
    console.error('Update lesson plan error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteLessonPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const teacherId = req.user.id;

    await pool.query(
      'DELETE FROM lesson_plans WHERE id = $1 AND teacher_id = $2',
      [id, teacherId]
    );

    res.json({ message: 'Lesson plan deleted!' });
  } catch (err) {
    console.error('Delete lesson plan error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { createLessonPlan, getLessonPlans, updateLessonPlan, deleteLessonPlan };