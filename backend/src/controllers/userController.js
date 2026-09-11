const bcrypt = require('bcryptjs');
const { User } = require('../models');

// GET /api/users/me
async function getMe(req, res) {
  return res.json({
    id: req.user.id,
    username: req.user.username,
    email: req.user.email,
    avatarColor: req.user.avatar_color,
  });
}

// PUT /api/users/me
async function updateMe(req, res, next) {
  try {
    const updates = {};
    const { username, password } = req.body;

    if (username) {
      const taken = await User.findOne({ where: { username } });
      if (taken && taken.id !== req.user.id) {
        return res.status(409).json({ message: 'Username already taken.' });
      }
      updates.username = username;
    }

    if (password) {
      updates.password_hash = await bcrypt.hash(password, 12);
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'Nothing to update.' });
    }

    await User.update(updates, { where: { id: req.user.id } });
    const updated = await User.findByPk(req.user.id, {
      attributes: ['id', 'username', 'email', 'avatar_color'],
    });

    return res.json({
      id: updated.id,
      username: updated.username,
      email: updated.email,
      avatarColor: updated.avatar_color,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getMe, updateMe };
