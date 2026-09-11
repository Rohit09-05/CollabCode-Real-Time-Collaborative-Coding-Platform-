const { sequelize } = require('../config/database');
const User = require('./User');
const Room = require('./Room');
const RoomMember = require('./RoomMember');
const File = require('./File');
const FileVersion = require('./FileVersion');
const Execution = require('./Execution');
const Message = require('./Message');

// ── Associations ──────────────────────────────────────────────────────────────

// User <-> Room (owner)
Room.belongsTo(User, { as: 'owner', foreignKey: 'owner_id' });
User.hasMany(Room, { as: 'ownedRooms', foreignKey: 'owner_id' });

// Room <-> RoomMember <-> User
Room.hasMany(RoomMember, { foreignKey: 'room_id', onDelete: 'CASCADE' });
RoomMember.belongsTo(Room, { foreignKey: 'room_id' });
User.hasMany(RoomMember, { foreignKey: 'user_id', onDelete: 'CASCADE' });
RoomMember.belongsTo(User, { foreignKey: 'user_id' });

// Room <-> File
Room.hasMany(File, { foreignKey: 'room_id', onDelete: 'CASCADE' });
File.belongsTo(Room, { foreignKey: 'room_id' });

// File <-> FileVersion
File.hasMany(FileVersion, { foreignKey: 'file_id', onDelete: 'CASCADE' });
FileVersion.belongsTo(File, { foreignKey: 'file_id' });
User.hasMany(FileVersion, { as: 'fileVersions', foreignKey: 'saved_by' });
FileVersion.belongsTo(User, { as: 'savedBy', foreignKey: 'saved_by' });

// Room <-> Execution
Room.hasMany(Execution, { foreignKey: 'room_id', onDelete: 'CASCADE' });
Execution.belongsTo(Room, { foreignKey: 'room_id' });
User.hasMany(Execution, { as: 'executions', foreignKey: 'triggered_by' });
Execution.belongsTo(User, { as: 'triggeredBy', foreignKey: 'triggered_by' });

// Room <-> Message
Room.hasMany(Message, { foreignKey: 'room_id', onDelete: 'CASCADE' });
Message.belongsTo(Room, { foreignKey: 'room_id' });
User.hasMany(Message, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Message.belongsTo(User, { foreignKey: 'user_id' });

module.exports = {
  sequelize,
  User,
  Room,
  RoomMember,
  File,
  FileVersion,
  Execution,
  Message,
};
