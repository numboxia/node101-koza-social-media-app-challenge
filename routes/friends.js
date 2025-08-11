const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/accept/:id', async (req, res) => {
    const userId = req.session.userId;
    const friendId = req.params.id;

    await User.findByIdAndUpdate(userId, {
        $pull: { friendRequests: friendId },
        $addToSet: { friends: friendId }
    });

    await User.findByIdAndUpdate(friendId, {
        $addToSet: { friends: userId }
    });

    res.redirect('/chat');
});

router.post('/deny/:id', async (req, res) => {
    const userId = req.session.userId;
    const friendId = req.params.id;

    await User.findByIdAndUpdate(userId, {
        $pull: { friendRequests: friendId }
    });

    res.redirect('/chat');
});

module.exports = router;
