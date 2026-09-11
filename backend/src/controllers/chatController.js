const { Room, Message, User, RoomMember } = require('../models');

// GET /api/rooms/:code/messages?before=<id>&limit=50
async function getChatHistory(req, res, next) {
  try {
    const room = await Room.findOne({ where: { room_code: req.params.code } });
    if (!room) return res.status(404).json({ message: 'Room not found.' });

    const member = await RoomMember.findOne({
      where: { room_id: room.id, user_id: req.user.id },
    });
    if (!member) return res.status(403).json({ message: 'Not a member of this room.' });

    const limit = Math.min(parseInt(req.query.limit || '50', 10), 100);
    const where = { room_id: room.id };
    if (req.query.before) {
      const { Op } = require('sequelize');
      where.id = { [Op.lt]: parseInt(req.query.before, 10) };
    }

    const messages = await Message.findAll({
      where,
      include: [{ model: User, attributes: ['id', 'username', 'avatar_color'] }],
      order: [['created_at', 'DESC']],
      limit,
    });

    return res.json({ messages: messages.reverse() });
  } catch (err) {
    next(err);
  }
}

module.exports = { getChatHistory };
