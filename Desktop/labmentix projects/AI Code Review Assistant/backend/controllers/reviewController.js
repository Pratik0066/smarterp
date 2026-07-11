const Review = require('../models/Review');
const ReviewFinding = require('../models/ReviewFinding');
const Project = require('../models/Project');

exports.submitReview = async (req, res) => {
  try {
    const { project_id, code, language, filename, review_type, analysis, aiReview, complexity } = req.body;

    let projectId = project_id;
    if (!projectId) {
      const project = await Project.create({
        project_name: `Review - ${filename || 'Code Snippet'}`,
        user_id: req.user.id,
      });
      projectId = project.id;
    }

    const score = analysis?.score || aiReview?.score || 50;

    let summary = 'Code review completed.';
    if (aiReview?.explanation) {
      summary = aiReview.explanation;
    } else if (analysis?.findings?.length > 0) {
      summary = `Found ${analysis.findings.length} issues. Score: ${score}/100`;
    }

    const review = await Review.create({
      project_id: projectId,
      review_type: review_type || 'snippet',
      language: language || 'javascript',
      code_snippet: code,
      file_name: filename || null,
      overall_score: score,
      summary,
      static_analysis: analysis || {},
      ai_review: aiReview || {},
      complexity: complexity || {},
    });

    const allFindings = [];

    if (analysis?.findings?.length > 0) {
      analysis.findings.forEach(f => {
        allFindings.push({ ...f, review_id: review.id });
      });
    }

    if (aiReview) {
      const aiCategories = ['bugs', 'code_smells', 'improvements', 'performance', 'security', 'naming', 'refactoring'];
      aiCategories.forEach(cat => {
        if (aiReview[cat]?.length > 0) {
          aiReview[cat].forEach(item => {
            allFindings.push({
              review_id: review.id,
              severity: cat === 'bugs' ? 'error' : cat === 'security' ? 'warning' : 'info',
              category: cat,
              issue: item.issue,
              explanation: item.explanation,
              suggested_fix: item.suggested_fix,
              file_name: item.file_name || filename || null,
              line_number: item.line_number || null,
              source: 'ai_review',
            });
          });
        }
      });
    }

    if (allFindings.length > 0) {
      await ReviewFinding.bulkCreate(allFindings);
    }

    const fullReview = await Review.findByPk(review.id, {
      include: [{ model: ReviewFinding }],
    });

    res.status(201).json({ success: true, review: fullReview });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getReviews = async (req, res) => {
  try {
    const { search, language, review_type, sort } = req.query;

    const userProjects = await Project.findAll({
      where: { user_id: req.user.id },
      attributes: ['id'],
    });
    const projectIds = userProjects.map(p => p.id);

    const where = { project_id: projectIds };
    if (language) where.language = language;
    if (review_type) where.review_type = review_type;

    let order = [['created_at', 'DESC']];
    if (sort === 'score_asc') order = [['overall_score', 'ASC']];
    if (sort === 'score_desc') order = [['overall_score', 'DESC']];

    const reviews = await Review.findAll({
      where,
      include: [
        { model: Project, attributes: ['id', 'project_name'] },
        { model: ReviewFinding, attributes: ['id', 'severity', 'category', 'issue'] },
      ],
      order,
    });

    let filtered = reviews;
    if (search) {
      const s = search.toLowerCase();
      filtered = reviews.filter(r =>
        r.summary?.toLowerCase().includes(s) ||
        r.file_name?.toLowerCase().includes(s) ||
        r.language?.toLowerCase().includes(s) ||
        r.Project?.project_name?.toLowerCase().includes(s)
      );
    }

    res.json({ success: true, reviews: filtered });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getReview = async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id, {
      include: [
        { model: Project, attributes: ['id', 'project_name'] },
        { model: ReviewFinding },
      ],
    });
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    res.json({ success: true, review });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    await review.destroy();
    res.json({ success: true, message: 'Review deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const userProjects = await Project.findAll({
      where: { user_id: req.user.id },
      attributes: ['id'],
    });
    const projectIds = userProjects.map(p => p.id);

    const totalReviews = await Review.count({ where: { project_id: projectIds } });

    const reviews = await Review.findAll({
      where: { project_id: projectIds },
      attributes: ['overall_score', 'language', 'created_at'],
    });

    const avgScore = reviews.length > 0
      ? Math.round(reviews.reduce((sum, r) => sum + r.overall_score, 0) / reviews.length)
      : 0;

    const languageStats = {};
    reviews.forEach(r => {
      if (!languageStats[r.language]) {
        languageStats[r.language] = { count: 0, totalScore: 0 };
      }
      languageStats[r.language].count++;
      languageStats[r.language].totalScore += r.overall_score;
    });

    const languages = Object.entries(languageStats).map(([lang, stats]) => ({
      language: lang,
      count: stats.count,
      avgScore: Math.round(stats.totalScore / stats.count),
    }));

    res.json({
      success: true,
      stats: {
        total_reviews: totalReviews,
        average_score: avgScore,
        languages,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
