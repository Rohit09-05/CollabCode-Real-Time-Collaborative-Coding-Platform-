const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FileVersion = sequelize.define(
  'FileVersion',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    file_id: { type: DataTypes.INTEGER, allowNull: false },
    content: { type: DataTypes.TEXT('long'), allowNull: false },
    saved_by: { type: DataTypes.INTEGER, allowNull: false },
  },
  {
    tableName: 'file_versions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [{ fields: ['file_id'] }],
  }
);

module.exports = FileVersion;
