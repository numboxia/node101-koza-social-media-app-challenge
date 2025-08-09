const express = require('express');
const router = express.Router();

function requireLogin(req, res, next) {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    next();
}

router.get('/', requireLogin, (req, res) => {
    res.render('main', {
        username: req.session.username || 'User'
    });
});

module.exports = router;
