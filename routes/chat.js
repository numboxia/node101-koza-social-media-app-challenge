const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Message = require('../models/Message');

function requireLogin(req, res, next) {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    next();
}

router.get('/', requireLogin, async (req, res) => {
    const users = await User.find({ _id: { $ne: req.session.userId } });
    res.render('chat-list', { users });
});

router.get('/:id', requireLogin, async (req, res) => {
    const otherUserId = req.params.id;
    const otherUser = await User.findById(otherUserId);

    const messages = await Message.find({
        $or: [
            { sender: req.session.userId, receiver: otherUserId },
            { sender: otherUserId, receiver: req.session.userId }
        ]
    }).sort({ timestamp: 1 });

    res.render('chat-room', { otherUser, messages, currentUserId: req.session.userId });
});

module.exports = router;
