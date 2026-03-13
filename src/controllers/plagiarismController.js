const pool = require('../config/database');

// Simple but effective plagiarism checker
// Compares word overlap between submissions
const checkPlagiarism = (text1, text2) => {
  if (!text1 || !text2) return 0;
  
  const normalize = (text) => text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3); // ignore small words

  const words1 = new Set(normalize(text1));
  const words2 = new Set(normalize(text2));
  
  if (words1.size === 0 || words2.size === 0) return 0;

  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);
  
  // Jaccard similarity
  const similarity = (intersection.size / union.size) * 100;
  return Math.round(similarity);
};

// Check AI-generated content using pattern detection
const detectAI = (text) => {
  if (!text || text.length < 50) return { score: 0, verdict: 'Too short to analyze' };

  const aiPatterns = [
    /\b(furthermore|moreover|additionally|consequently|therefore|thus)\b/gi,
    /\b(it is worth noting|it is important to note|in conclusion|to summarize)\b/gi,
    /\b(delve|underscore|leverage|utilize|facilitate|implement)\b/gi,
    /\b(comprehensive|multifaceted|nuanced|intricate|robust)\b/gi,
    /\b(as an ai|as a language model|i cannot|i'm unable to)\b/gi,
  ];

  let patternCount = 0;
  aiPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) patternCount += matches.length;
  });

  // Check sentence length variance (AI tends to be very uniform)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const lengths = sentences.map(s => s.trim().split(/\s+/).length);
  const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((sum, l) => sum + Math.pow(l - avgLength, 2), 0) / lengths.length;
  const lowVariance = variance < 15; // AI tends to have low variance

  // Check for overly formal vocabulary
  const wordCount = text.split(/\s+/).length;
  const patternDensity = (patternCount / wordCount) * 100;

  let aiScore = 0;
  if (patternDensity > 3) aiScore += 40;
  else if (patternDensity > 1.5) aiScore += 20;
  if (lowVariance && sentences.length > 3) aiScore += 30;
  if (patternCount > 5) aiScore += 20;
  if (text.length > 500 && variance < 10) aiScore += 10;

  aiScore = Math.min(aiScore, 95);

  let verdict;
  if (aiScore >= 70) verdict = '🔴 Likely AI-generated';
  else if (aiScore >= 40) verdict = '🟡 Possibly AI-assisted';
  else verdict = '🟢 Likely human-written';

  return { score: aiScore, verdict, patternCount, lowVariance };
};

const analyzeSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;

    const result = await pool.query(
      `SELECT s.*, u.first_name || ' ' || u.last_name as student_name,
        a.title as assignment_title, a.id as assignment_id
       FROM assignment_submissions s
       JOIN users u ON s.student_id = u.id
       JOIN assignments a ON s.assignment_id = a.id
       WHERE s.id = $1`,
      [submissionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const submission = result.rows[0];
    const textContent = submission.text_content;

    // AI detection
    const aiAnalysis = detectAI(textContent);

    // Plagiarism check against other submissions for same assignment
    const otherSubmissions = await pool.query(
      `SELECT s.id, s.text_content, u.first_name || ' ' || u.last_name as student_name
       FROM assignment_submissions s
       JOIN users u ON s.student_id = u.id
       WHERE s.assignment_id = $1 AND s.id != $2 AND s.text_content IS NOT NULL`,
      [submission.assignment_id, submissionId]
    );

    const plagiarismResults = otherSubmissions.rows.map(other => ({
      studentName: other.student_name,
      submissionId: other.id,
      similarity: checkPlagiarism(textContent, other.text_content)
    })).sort((a, b) => b.similarity - a.similarity);

    const maxSimilarity = plagiarismResults.length > 0
      ? plagiarismResults[0].similarity
      : 0;

    let plagiarismVerdict;
    if (maxSimilarity >= 70) plagiarismVerdict = '🔴 High plagiarism detected';
    else if (maxSimilarity >= 40) plagiarismVerdict = '🟡 Moderate similarity found';
    else plagiarismVerdict = '🟢 Original work';

    res.json({
      submissionId,
      studentName: submission.student_name,
      assignmentTitle: submission.assignment_title,
      aiDetection: aiAnalysis,
      plagiarism: {
        maxSimilarity,
        verdict: plagiarismVerdict,
        comparisons: plagiarismResults
      },
      hasTextContent: !!textContent,
      wordCount: textContent ? textContent.split(/\s+/).length : 0,
    });

  } catch (err) {
    console.error('Analysis error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const analyzeAllSubmissions = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const submissions = await pool.query(
      `SELECT s.id, s.text_content, u.first_name || ' ' || u.last_name as student_name
       FROM assignment_submissions s
       JOIN users u ON s.student_id = u.id
       WHERE s.assignment_id = $1 AND s.text_content IS NOT NULL`,
      [assignmentId]
    );

    const results = submissions.rows.map(sub => {
      const aiAnalysis = detectAI(sub.text_content);
      
      // Compare against all other submissions
      const plagiarismComparisons = submissions.rows
        .filter(other => other.id !== sub.id)
        .map(other => ({
          studentName: other.student_name,
          similarity: checkPlagiarism(sub.text_content, other.text_content)
        }))
        .sort((a, b) => b.similarity - a.similarity);

      const maxSimilarity = plagiarismComparisons.length > 0
        ? plagiarismComparisons[0].similarity : 0;

      return {
        submissionId: sub.id,
        studentName: sub.student_name,
        aiScore: aiAnalysis.score,
        aiVerdict: aiAnalysis.verdict,
        maxSimilarity,
        plagiarismVerdict: maxSimilarity >= 70 ? '🔴 High' : maxSimilarity >= 40 ? '🟡 Moderate' : '🟢 Original',
        topMatch: plagiarismComparisons[0] || null,
        wordCount: sub.text_content.split(/\s+/).length,
      };
    });

    res.json({ assignmentId, results });
  } catch (err) {
    console.error('Analyze all error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { analyzeSubmission, analyzeAllSubmissions };