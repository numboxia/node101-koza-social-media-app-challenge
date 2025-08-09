const express = require('express');
const router = express.Router();
const User = require('../models/User');

function requireLogin(req, res, next) {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    next();
}

router.get('/signup', (req, res) => {
    res.render('signup');
});

router.post('/signup', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = new User({ username, password });
        await user.save();
        req.session.userId = user._id; 
        res.redirect('/main');
    } catch (err) {
        console.error(err);
        res.send('Error creating account.');
    }
});

router.get('/login', (req, res) => {
    res.render('login');
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username, password });
        if (!user) {
            return res.send('Invalid credentials');
        }
        req.session.userId = user._id;
        res.redirect('/main');
    } catch (err) {
        console.error(err);
        res.send('Error logging in.');
    }
});

router.get('/main', requireLogin, (req, res) => {
    res.render('main', { username: req.session.username });
});

router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

module.exports = router;
