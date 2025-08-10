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
    const currentUser = await User.findById(req.session.userId).populate('friends');
    let selectedFriend = null;
    let messages = [];

    if (req.query.friend) {
        selectedFriend = await User.findById(req.query.friend);
        if (selectedFriend) {
            messages = await Message.find({
                $or: [
                    { sender: req.session.userId, receiver: selectedFriend._id },
                    { sender: selectedFriend._id, receiver: req.session.userId }
                ]
            }).sort({ timestamp: 1 });
        }
    }

    res.render('chat', {
        friends: currentUser.friends,
        selectedFriend,
        messages,
        currentUserId: req.session.userId
    });
});

router.post('/add-friend', requireLogin, async (req, res) => {
    const { username } = req.body;
    const friend = await User.findOne({ username });

    if (!friend) {
        return res.send('User not found.');
    }

    if (friend._id.equals(req.session.userId)) {
        return res.send('You cannot add yourself.');
    }

    const currentUser = await User.findById(req.session.userId);

    if (!currentUser.friends.includes(friend._id)) {
        currentUser.friends.push(friend._id);
        await currentUser.save();
    }

    if (!friend.friends.includes(currentUser._id)) {
        friend.friends.push(currentUser._id);
        await friend.save();
    }

    res.redirect('/chat');
});

module.exports = router;
