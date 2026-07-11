const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  project_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  github_url: {
    type: DataTypes.STRING,
    defaultValue: null,
  },
}, {
  tableName: 'projects',
  timestamps: true,
});

User.hasMany(Project, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Project.belongsTo(User, { foreignKey: 'user_id' });

module.exports = Project;
