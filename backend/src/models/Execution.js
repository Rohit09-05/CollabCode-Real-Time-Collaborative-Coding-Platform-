const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Execution = sequelize.define(
  'Execution',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    room_id: { type: DataTypes.INTEGER, allowNull: false },
    triggered_by: { type: DataTypes.INTEGER, allowNull: false },
    language: { type: DataTypes.STRING(30), allowNull: false },
    stdin: { type: DataTypes.TEXT, allowNull: true },
    stdout: { type: DataTypes.TEXT, allowNull: true },
    stderr: { type: DataTypes.TEXT, allowNull: true },
    exec_time_ms: { type: DataTypes.INTEGER, defaultValue: 0 },
    status: { type: DataTypes.STRING(20), defaultValue: 'success' },
  },
  {
    tableName: 'executions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [{ fields: ['room_id'] }],
  }
);

module.exports = Execution;
