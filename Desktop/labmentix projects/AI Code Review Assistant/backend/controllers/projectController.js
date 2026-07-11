const Project = require('../models/Project');
const Review = require('../models/Review');
const ReviewFinding = require('../models/ReviewFinding');

exports.createProject = async (req, res) => {
  try {
    const { project_name, github_url } = req.body;
    const project = await Project.create({
      project_name,
      github_url,
      user_id: req.user.id,
    });
    res.status(201).json({ success: true, project });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.findAll({
      where: { user_id: req.user.id },
      include: [{ model: Review, attributes: ['id', 'overall_score', 'created_at'] }],
      order: [['created_at', 'DESC']],
    });
    res.json({ success: true, projects });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProject = async (req, res) => {
  try {
    const project = await Project.findOne({
      where: { id: req.params.id, user_id: req.user.id },
      include: [{
        model: Review,
        include: [{ model: ReviewFinding }],
      }],
    });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json({ success: true, project });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    await project.destroy();
    res.json({ success: true, message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
