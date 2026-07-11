const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Project = require('./Project');

const Review = sequelize.define('Review', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  review_type: {
    type: DataTypes.ENUM('snippet', 'file', 'repository'),
    allowNull: false,
  },
  language: {
    type: DataTypes.STRING,
    defaultValue: 'javascript',
  },
  code_snippet: {
    type: DataTypes.TEXT,
    defaultValue: null,
  },
  file_name: {
    type: DataTypes.STRING,
    defaultValue: null,
  },
  overall_score: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: { min: 0, max: 100 },
  },
  summary: {
    type: DataTypes.TEXT,
    defaultValue: null,
  },
  static_analysis: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  ai_review: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  complexity: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
}, {
  tableName: 'reviews',
  timestamps: true,
});

Project.hasMany(Review, { foreignKey: 'project_id', onDelete: 'CASCADE' });
Review.belongsTo(Project, { foreignKey: 'project_id' });

module.exports = Review;
