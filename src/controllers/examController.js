const pool = require('../config/database');

const getExams = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM exams ORDER BY exam_date DESC`
    );
    res.json({ exams: result.rows });
  } catch (err) {
    console.error('Get exams error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const createExam = async (req, res) => {
  try {
    const { title, examType, className, examDate, totalMarks, passingMarks, subject } = req.body;
    const createdBy = req.user.id;

    const result = await pool.query(
      `INSERT INTO exams (title, exam_type, class_id, exam_date, total_marks, passing_marks, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [title, examType || 'unit_test', className, examDate, totalMarks || 100, passingMarks || 33, createdBy]
    );

    res.status(201).json({ message: 'Exam created!', exam: result.rows[0] });
  } catch (err) {
    console.error('Create exam error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const enterResults = async (req, res) => {
  try {
    const { examId, results } = req.body;

    for (const result of results) {
      const grade = getGrade(result.marksObtained, result.totalMarks);
      await pool.query(
        `INSERT INTO exam_results (exam_id, student_id, marks_obtained, grade, remarks, entered_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (exam_id, student_id)
         DO UPDATE SET marks_obtained = $3, grade = $4, remarks = $5`,
        [examId, result.studentId, result.marksObtained, grade, result.remarks || '', req.user.id]
      );
    }

    res.json({ message: 'Results saved successfully!' });
  } catch (err) {
    console.error('Enter results error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getResults = async (req, res) => {
  try {
    const { examId } = req.params;

    const result = await pool.query(
      `SELECT er.*, u.first_name || ' ' || u.last_name as student_name,
              e.title as exam_title, e.total_marks, e.passing_marks, e.exam_date
       FROM exam_results er
       JOIN users u ON er.student_id = u.id
       JOIN exams e ON er.exam_id = e.id
       WHERE er.exam_id = $1
       ORDER BY er.marks_obtained DESC`,
      [examId]
    );

    res.json({ results: result.rows });
  } catch (err) {
    console.error('Get results error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getStudentResults = async (req, res) => {
  try {
    const studentId = req.user.id;

    const result = await pool.query(
      `SELECT er.*, e.title as exam_title, e.total_marks,
              e.passing_marks, e.exam_date, e.exam_type
       FROM exam_results er
       JOIN exams e ON er.exam_id = e.id
       WHERE er.student_id = $1
       ORDER BY e.exam_date DESC`,
      [studentId]
    );

    res.json({ results: result.rows });
  } catch (err) {
    console.error('Get student results error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getGrade = (marks, total) => {
  const pct = (marks / total) * 100;
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  if (pct >= 50) return 'C';
  if (pct >= 33) return 'D';
  return 'F';
};

module.exports = { getExams, createExam, enterResults, getResults, getStudentResults };