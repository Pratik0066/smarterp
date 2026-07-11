const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Review = require('./Review');

const ReviewFinding = sequelize.define('ReviewFinding', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  severity: {
    type: DataTypes.ENUM('error', 'warning', 'info', 'suggestion'),
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING,
    defaultValue: 'general',
  },
  issue: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  explanation: {
    type: DataTypes.TEXT,
    defaultValue: null,
  },
  suggested_fix: {
    type: DataTypes.TEXT,
    defaultValue: null,
  },
  file_name: {
    type: DataTypes.STRING,
    defaultValue: null,
  },
  line_number: {
    type: DataTypes.INTEGER,
    defaultValue: null,
  },
  source: {
    type: DataTypes.ENUM('static_analysis', 'ai_review'),
    allowNull: false,
  },
}, {
  tableName: 'review_findings',
  timestamps: true,
});

Review.hasMany(ReviewFinding, { foreignKey: 'review_id', onDelete: 'CASCADE' });
ReviewFinding.belongsTo(Review, { foreignKey: 'review_id' });

module.exports = ReviewFinding;
