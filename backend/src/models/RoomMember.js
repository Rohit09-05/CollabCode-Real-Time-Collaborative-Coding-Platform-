const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const RoomMember = sequelize.define(
  'RoomMember',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    room_id: { type: DataTypes.INTEGER, allowNull: false },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    role: {
      type: DataTypes.ENUM('owner', 'editor', 'viewer'),
      allowNull: false,
      defaultValue: 'editor',
    },
    joined_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: 'room_members',
    timestamps: false,
    indexes: [
      { unique: true, fields: ['room_id', 'user_id'] },
      { fields: ['user_id'] },
    ],
  }
);

module.exports = RoomMember;
