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
    const user = await User.findById(req.session.userId)
        .populate('friends')
        .populate('friendRequests');

    const contacts = [...user.friends, ...user.friendRequests];

    res.render('chat', {
        currentUserId: req.session.userId,
        contacts,
        friendRequests: user.friendRequests,
        selectedFriend: null,
        messages: []
    });
});

router.get('/:friendId', requireLogin, async (req, res) => {
    const user = await User.findById(req.session.userId)
        .populate('friends')
        .populate('friendRequests');

    const contacts = [...user.friends, ...user.friendRequests];

    const friend = await User.findById(req.params.friendId);
    if (!friend) return res.redirect('/chat');

    const messages = await Message.find({
        $or: [
            { sender: req.session.userId, receiver: req.params.friendId },
            { sender: req.params.friendId, receiver: req.session.userId }
        ]
    }).sort({ timestamp: 1 });

    res.render('chat', {
        currentUserId: req.session.userId,
        contacts,
        friendRequests: user.friendRequests,
        selectedFriend: friend,
        messages
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

    if (!friend.friendRequests.includes(currentUser._id) &&
        !friend.friends.includes(currentUser._id)) {
        friend.friendRequests.push(currentUser._id);
        await friend.save();
    }

    res.redirect('/chat');
});

router.post('/accept-friend/:id', requireLogin, async (req, res) => {
    const currentUser = await User.findById(req.session.userId);
    const requester = await User.findById(req.params.id);

    currentUser.friendRequests = currentUser.friendRequests.filter(
        id => !id.equals(requester._id)
    );

    if (!currentUser.friends.includes(requester._id)) {
        currentUser.friends.push(requester._id);
    }
    if (!requester.friends.includes(currentUser._id)) {
        requester.friends.push(currentUser._id);
    }

    await currentUser.save();
    await requester.save();

    res.redirect('/chat');
});

router.post('/deny-friend/:id', requireLogin, async (req, res) => {
    const currentUser = await User.findById(req.session.userId);

    currentUser.friendRequests = currentUser.friendRequests.filter(
        id => !id.equals(req.params.id)
    );

    await currentUser.save();
    res.redirect('/chat');
});

module.exports = router;
