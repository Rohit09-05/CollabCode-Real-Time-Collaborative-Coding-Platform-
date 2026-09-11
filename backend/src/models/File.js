const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const File = sequelize.define(
  'File',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    room_id: { type: DataTypes.INTEGER, allowNull: false },
    filename: { type: DataTypes.STRING(100), allowNull: false },
    content: { type: DataTypes.TEXT('long'), allowNull: true },
    language: { type: DataTypes.STRING(30), defaultValue: 'javascript' },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: 'files',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [{ fields: ['room_id'] }],
  }
);

module.exports = File;
