const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Room = sequelize.define(
  'Room',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    room_code: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    owner_id: { type: DataTypes.INTEGER, allowNull: false },
    is_private: { type: DataTypes.BOOLEAN, defaultValue: false },
    password_hash: { type: DataTypes.STRING(255), allowNull: true },
    language: { type: DataTypes.STRING(30), defaultValue: 'javascript' },
    max_members: { type: DataTypes.INTEGER, defaultValue: 10 },
    last_active_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: 'rooms',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      { fields: ['room_code'] },
      { fields: ['owner_id'] },
      { fields: ['last_active_at'] },
    ],
  }
);

module.exports = Room;
